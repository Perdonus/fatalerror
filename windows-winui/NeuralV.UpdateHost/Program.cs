using System.Diagnostics;
using System.Text.Json;
using System.Windows.Forms;
using NeuralV.Windows.Services;
using NeuralV.UpdateHost;

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        WindowsLog.StartSession("windows-updater-host");
        WindowsLog.Info($"Updater host args count: {args.Length}");

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        try
        {
            return RunAsync(args).GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            WindowsLog.Error("Updater host failed, attempting direct GUI launch", ex);
            try
            {
                var installRoot = ResolveInstallState(Environment.ProcessPath).InstallRoot;
                LaunchGui(InstallLayout.GuiPath(installRoot), installRoot, Array.Empty<string>());
            }
            catch (Exception launchError)
            {
                WindowsLog.Error("Updater host fallback launch failed", launchError);
            }
            return 1;
        }
    }

    private static async Task<int> RunAsync(string[] args)
    {
        if (TryGetApplyRequestPath(args, out var requestPath))
        {
            return await RunApplyStagedAsync(requestPath!);
        }

        if (args.Any(arg => string.Equals(arg, "--launch-only", StringComparison.OrdinalIgnoreCase)))
        {
            var installState = ResolveInstallState(Environment.ProcessPath);
            LaunchGui(InstallLayout.GuiPath(installState.InstallRoot), installState.InstallRoot, Array.Empty<string>());
            return 0;
        }

        return await RunCheckAndLaunchAsync(args);
    }

    private static async Task<int> RunCheckAndLaunchAsync(string[] args)
    {
        var forwardedArgs = args.Where(arg => !string.Equals(arg, "--check-and-launch", StringComparison.OrdinalIgnoreCase)).ToArray();
        var installState = ResolveInstallState(Environment.ProcessPath);
        var installRoot = installState.InstallRoot;
        var guiPath = InstallLayout.GuiPath(installRoot);
        WindowsLog.Info($"Resolved install root: {installRoot}");
        WindowsLog.Info($"GUI path: {guiPath}");

        WindowsReleaseInfo? releaseInfo = null;
        try
        {
            releaseInfo = await WindowsReleaseManifestClient.FetchAsync();
            WindowsLog.Info($"Manifest version: {releaseInfo?.Version}");
        }
        catch (Exception manifestError)
        {
            WindowsLog.Error("Updater manifest fetch failed", manifestError);
        }

        var currentVersion = string.IsNullOrWhiteSpace(installState.Version)
            ? TryReadFileVersion(guiPath)
            : installState.Version;

        if (releaseInfo is null || !releaseInfo.IsNewerThan(currentVersion) || string.IsNullOrWhiteSpace(releaseInfo.PortableUrl))
        {
            LaunchGui(guiPath, installRoot, forwardedArgs);
            return 0;
        }

        using var prompt = new UpdatePromptDialog(currentVersion, releaseInfo.Version);
        if (prompt.ShowDialog() != DialogResult.OK)
        {
            WindowsLog.Info("Updater prompt cancelled by user; launching current GUI");
            LaunchGui(guiPath, installRoot, forwardedArgs);
            return 0;
        }

        using var progressDialog = new UpdateProgressDialog("Подготавливаем обновление");
        using var cancellation = new CancellationTokenSource();
        progressDialog.CancelRequested += (_, _) => cancellation.Cancel();
        progressDialog.Shown += async (_, _) =>
        {
            PreparedWindowsBundle? preparedBundle = null;
            try
            {
                var progress = new Progress<WindowsUpdateProgressSnapshot>(snapshot => progressDialog.ApplySnapshot(snapshot));
                progressDialog.ApplySnapshot(new WindowsUpdateProgressSnapshot
                {
                    Stage = WindowsUpdateStage.Checking,
                    Title = "Проверяем обновление",
                    Detail = $"Найдена версия {releaseInfo.Version}. Подготавливаем файлы для установки.",
                    IsIndeterminate = true,
                    OverallPercent = 3
                });

                preparedBundle = await WindowsBundleInstaller.PrepareBundleAsync(
                    releaseInfo.PortableUrl,
                    installRoot,
                    releaseInfo.Version,
                    installState.AutoStartEnabled,
                    progress,
                    cancellation.Token);

                installState.Version = releaseInfo.Version;
                installState.CliBinary = releaseInfo.CliBinaryName;
                installState.GuiBinary = releaseInfo.GuiBinaryName;
                installState.LauncherBinary = releaseInfo.LauncherBinaryName;
                installState.UpdaterBinary = releaseInfo.UpdaterBinaryName;
                installState.UpdaterHostBinary = releaseInfo.UpdaterHostBinaryName;
                installState.ProtocolSchemes = InstallLayout.UriSchemes.ToArray();
                installState.ProtocolHandlerBinary = releaseInfo.LauncherBinaryName;

                progressDialog.ApplySnapshot(new WindowsUpdateProgressSnapshot
                {
                    Stage = WindowsUpdateStage.Installing,
                    Title = "Готовим установщик",
                    Detail = "Запускаем отдельное окно обновления для применения новой версии.",
                    IsIndeterminate = true,
                    OverallPercent = 90,
                    StagePercent = 0
                });

                StartDetachedApplyHost(preparedBundle, installState, forwardedArgs);
                preparedBundle = null;
                progressDialog.RequestClose(UpdateDialogCloseReason.Exit);
            }
            catch (OperationCanceledException)
            {
                WindowsLog.Info("Updater preparation cancelled by user");
                progressDialog.RequestClose(UpdateDialogCloseReason.LaunchCurrent);
            }
            catch (Exception ex)
            {
                WindowsLog.Error("Updater preparation failed", ex);
                progressDialog.ShowFailure("Не удалось подготовить обновление. Можно закрыть updater или запустить текущую версию.", allowLaunchCurrent: true);
            }
            finally
            {
                preparedBundle?.Dispose();
            }
        };

        progressDialog.ShowDialog();

        if (progressDialog.CloseReason == UpdateDialogCloseReason.LaunchCurrent)
        {
            LaunchGui(guiPath, installRoot, forwardedArgs);
        }

        return 0;
    }

    private static async Task<int> RunApplyStagedAsync(string requestPath)
    {
        var request = ReadRequest(requestPath);
        var installRoot = InstallLayout.NormalizeInstallRoot(request.InstallState.InstallRoot);
        var guiPath = InstallLayout.GuiPath(installRoot);
        WindowsLog.Info($"Applying staged update for install root: {installRoot}");

        using var progressDialog = new UpdateProgressDialog("Устанавливаем обновление");
        progressDialog.Shown += async (_, _) =>
        {
            try
            {
                var progress = new Progress<WindowsUpdateProgressSnapshot>(snapshot => progressDialog.ApplySnapshot(snapshot));
                using var preparedBundle = new PreparedWindowsBundle
                {
                    WorkingDirectory = request.WorkingDirectory,
                    StageRoot = request.StageRoot,
                    PayloadRoot = string.Empty
                };

                progressDialog.ApplySnapshot(new WindowsUpdateProgressSnapshot
                {
                    Stage = WindowsUpdateStage.Installing,
                    Title = "Устанавливаем обновление",
                    Detail = "Заменяем текущую версию NeuralV на новую.",
                    IsIndeterminate = true,
                    OverallPercent = 92
                });

                await WindowsBundleInstaller.InstallPreparedBundleAsync(preparedBundle, request.InstallState, progress, CancellationToken.None);

                progressDialog.ApplySnapshot(new WindowsUpdateProgressSnapshot
                {
                    Stage = WindowsUpdateStage.Launching,
                    Title = "Запускаем NeuralV",
                    Detail = "Открываем обновлённую версию клиента.",
                    IsIndeterminate = true,
                    OverallPercent = 99
                });
                progressDialog.MarkCompleted("Обновление установлено. Открываем новую версию.", UpdateDialogCloseReason.LaunchUpdated);
            }
            catch (Exception ex)
            {
                WindowsLog.Error("Detached updater apply failed", ex);
                progressDialog.ShowFailure("Обновление не удалось применить. Текущую версию можно запустить без обновления.", allowLaunchCurrent: true);
            }
        };

        progressDialog.ShowDialog();

        try
        {
            if (progressDialog.CloseReason is UpdateDialogCloseReason.LaunchUpdated or UpdateDialogCloseReason.LaunchCurrent)
            {
                LaunchGui(guiPath, installRoot, request.ForwardedArgs);
            }
        }
        finally
        {
            ScheduleCleanup(request.CleanupExecutablePath, requestPath);
        }

        return 0;
    }

    private static InstallState ResolveInstallState(string? executablePath)
    {
        var hintedInstallRoot = Environment.GetEnvironmentVariable("NEURALV_INSTALL_ROOT");
        var currentExecutable = string.IsNullOrWhiteSpace(hintedInstallRoot)
            ? executablePath
            : hintedInstallRoot;
        var currentDirectory = InstallLayout.ResolveInstallRootFromExecutablePath(currentExecutable ?? AppContext.BaseDirectory);
        var installState = InstallStateStore.ResolveExistingInstall(currentExecutable)
            ?? InstallStateStore.CreateDefault(currentDirectory);

        installState.InstallRoot = InstallLayout.NormalizeInstallRoot(installState.InstallRoot);
        return installState;
    }

    private static DetachedUpdateRequest ReadRequest(string requestPath)
    {
        var payload = File.ReadAllText(requestPath);
        var request = JsonSerializer.Deserialize<DetachedUpdateRequest>(payload);
        if (request is null)
        {
            throw new InvalidOperationException("Не удалось прочитать запрос на применение обновления.");
        }
        request.InstallState ??= InstallStateStore.CreateDefault();
        request.InstallState.InstallRoot = InstallLayout.NormalizeInstallRoot(request.InstallState.InstallRoot);
        return request;
    }

    private static void StartDetachedApplyHost(PreparedWindowsBundle preparedBundle, InstallState installState, IReadOnlyList<string> forwardedArgs)
    {
        var currentHostPath = Environment.ProcessPath ?? InstallLayout.UpdaterHostPath(installState.InstallRoot);
        var detachedDirectory = Path.Combine(Path.GetTempPath(), "NeuralV", "Updater", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(detachedDirectory);
        var detachedHostPath = Path.Combine(detachedDirectory, Path.GetFileName(currentHostPath));
        File.Copy(currentHostPath, detachedHostPath, overwrite: true);

        var request = new DetachedUpdateRequest
        {
            WorkingDirectory = preparedBundle.WorkingDirectory,
            StageRoot = preparedBundle.StageRoot,
            ForwardedArgs = forwardedArgs.ToArray(),
            InstallState = installState,
            CleanupExecutablePath = detachedHostPath
        };

        var requestPath = Path.Combine(detachedDirectory, "apply-request.json");
        File.WriteAllText(requestPath, JsonSerializer.Serialize(request));

        var startInfo = new ProcessStartInfo(detachedHostPath)
        {
            UseShellExecute = false,
            WorkingDirectory = detachedDirectory
        };
        startInfo.Environment["NEURALV_INSTALL_ROOT"] = installState.InstallRoot;
        startInfo.Environment["NEURALV_LOG_APPEND"] = "1";
        startInfo.ArgumentList.Add("--apply-staged");
        startInfo.ArgumentList.Add(requestPath);
        using var process = Process.Start(startInfo);
        if (process is null)
        {
            throw new InvalidOperationException("Не удалось запустить отдельное окно обновления.");
        }
        WindowsLog.Info($"Detached updater started pid={process.Id}");
    }

    private static bool TryGetApplyRequestPath(IReadOnlyList<string> args, out string? requestPath)
    {
        for (var index = 0; index < args.Count - 1; index++)
        {
            if (string.Equals(args[index], "--apply-staged", StringComparison.OrdinalIgnoreCase))
            {
                requestPath = args[index + 1];
                return !string.IsNullOrWhiteSpace(requestPath);
            }
        }

        requestPath = null;
        return false;
    }

    private static void LaunchGui(string guiPath, string installRoot, IEnumerable<string> forwardedArgs)
    {
        if (!File.Exists(guiPath))
        {
            WindowsLog.Error($"GUI binary missing: {guiPath}");
            return;
        }

        WindowsLog.Info($"Launching GUI core: {guiPath}");
        var startInfo = new ProcessStartInfo(guiPath)
        {
            UseShellExecute = false,
            WorkingDirectory = Path.GetDirectoryName(guiPath) ?? installRoot
        };
        startInfo.Environment["NEURALV_SKIP_UPDATER"] = "1";
        startInfo.Environment["NEURALV_INSTALL_ROOT"] = installRoot;
        startInfo.Environment["NEURALV_LOG_APPEND"] = "1";
        startInfo.ArgumentList.Add("--launched-by-updater");
        foreach (var arg in forwardedArgs)
        {
            startInfo.ArgumentList.Add(arg);
        }
        using var process = Process.Start(startInfo);
        if (process is null)
        {
            WindowsLog.Error("GUI process did not start");
            return;
        }
        WindowsLog.Info($"GUI process started pid={process.Id}");
    }

    private static void ScheduleCleanup(string cleanupExecutablePath, string requestPath)
    {
        if (string.IsNullOrWhiteSpace(cleanupExecutablePath) && string.IsNullOrWhiteSpace(requestPath))
        {
            return;
        }

        var commandParts = new List<string>
        {
            "timeout /t 2 /nobreak >nul"
        };

        if (!string.IsNullOrWhiteSpace(cleanupExecutablePath))
        {
            commandParts.Add($"del /f /q \"{cleanupExecutablePath}\" >nul 2>&1");
        }

        if (!string.IsNullOrWhiteSpace(requestPath))
        {
            commandParts.Add($"del /f /q \"{requestPath}\" >nul 2>&1");
        }

        var cleanupDirectory = Path.GetDirectoryName(cleanupExecutablePath) ?? Path.GetDirectoryName(requestPath) ?? Path.GetTempPath();
        var command = string.Join(" & ", commandParts);
        Process.Start(new ProcessStartInfo("cmd.exe", $"/c {command}")
        {
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = cleanupDirectory
        });
    }

    private static string TryReadFileVersion(string guiPath)
    {
        try
        {
            return File.Exists(guiPath)
                ? (FileVersionInfo.GetVersionInfo(guiPath).ProductVersion ?? string.Empty).Split('+', 2)[0]
                : string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }
}
