using System.Diagnostics;
using System.IO.Compression;
using System.Text;
using Microsoft.Win32;

namespace NeuralV.Windows.Services;

public sealed class PreparedWindowsBundle : IDisposable
{
    public string WorkingDirectory { get; init; } = string.Empty;
    public string StageRoot { get; init; } = string.Empty;
    public string PayloadRoot { get; init; } = string.Empty;

    public void Dispose()
    {
        TryDelete(WorkingDirectory);
    }

    private static void TryDelete(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return;
        }
        try
        {
            if (Directory.Exists(path))
            {
                Directory.Delete(path, true);
            }
        }
        catch
        {
        }
    }
}

public enum WindowsUpdateStage
{
    Checking,
    UpdateAvailable,
    Downloading,
    Extracting,
    Installing,
    Launching,
    Completed,
    Failed
}

public sealed class WindowsUpdateProgressSnapshot
{
    public WindowsUpdateStage Stage { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
    public bool IsIndeterminate { get; init; }
    public int OverallPercent { get; init; }
    public int StagePercent { get; init; }
    public long BytesDownloaded { get; init; }
    public long BytesTotal { get; init; }
}

public static class WindowsBundleInstaller
{
    public static async Task<PreparedWindowsBundle> PrepareBundleAsync(
        string portableUrl,
        string installRoot,
        string version,
        bool autoStartEnabled,
        IProgress<WindowsUpdateProgressSnapshot>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedInstallRoot = InstallLayout.NormalizeInstallRoot(installRoot);
        var parentDir = Path.GetDirectoryName(normalizedInstallRoot) ?? AppContext.BaseDirectory;
        Directory.CreateDirectory(parentDir);

        var workingDirectory = Path.Combine(Path.GetTempPath(), $"neuralv-bundle-{Guid.NewGuid():N}");
        Directory.CreateDirectory(workingDirectory);

        var archivePath = Path.Combine(workingDirectory, "neuralv-windows.zip");
        var extractRoot = Path.Combine(workingDirectory, "extract");
        var stageRoot = Path.Combine(parentDir, $".NeuralV.stage-{Guid.NewGuid():N}");

        progress?.Report(new WindowsUpdateProgressSnapshot
        {
            Stage = WindowsUpdateStage.Downloading,
            Title = "Скачивание обновления",
            Detail = "Получаем пакет новой версии.",
            IsIndeterminate = true,
            OverallPercent = 10,
            StagePercent = 0
        });

        await DownloadFileAsync(portableUrl, archivePath, progress, cancellationToken);

        progress?.Report(new WindowsUpdateProgressSnapshot
        {
            Stage = WindowsUpdateStage.Extracting,
            Title = "Распаковка обновления",
            Detail = "Подготавливаем файлы перед установкой.",
            IsIndeterminate = true,
            OverallPercent = 62,
            StagePercent = 0
        });
        ZipFile.ExtractToDirectory(archivePath, extractRoot, overwriteFiles: true);
        var payloadRoot = FindPayloadRoot(extractRoot);
        CopyDirectory(payloadRoot, stageRoot);

        var installState = InstallStateStore.CreateDefault(normalizedInstallRoot, version);
        installState.AutoStartEnabled = autoStartEnabled;
        WriteMetadataInto(stageRoot, installState);

        progress?.Report(new WindowsUpdateProgressSnapshot
        {
            Stage = WindowsUpdateStage.Extracting,
            Title = "Обновление подготовлено",
            Detail = "Файлы готовы к установке.",
            IsIndeterminate = false,
            OverallPercent = 82,
            StagePercent = 100
        });

        return new PreparedWindowsBundle
        {
            WorkingDirectory = workingDirectory,
            StageRoot = stageRoot,
            PayloadRoot = payloadRoot
        };
    }

    public static async Task InstallPreparedBundleAsync(
        PreparedWindowsBundle preparedBundle,
        InstallState installState,
        IProgress<WindowsUpdateProgressSnapshot>? progress = null,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var normalizedInstallRoot = InstallLayout.NormalizeInstallRoot(installState.InstallRoot);
        var backupRoot = normalizedInstallRoot + ".backup";

        progress?.Report(new WindowsUpdateProgressSnapshot
        {
            Stage = WindowsUpdateStage.Installing,
            Title = "Установка обновления",
            Detail = "Заменяем текущую версию на новую.",
            IsIndeterminate = true,
            OverallPercent = 88,
            StagePercent = 0
        });

        if (Directory.Exists(backupRoot))
        {
            Directory.Delete(backupRoot, true);
        }

        if (Directory.Exists(normalizedInstallRoot))
        {
            Directory.Move(normalizedInstallRoot, backupRoot);
        }

        try
        {
            Directory.Move(preparedBundle.StageRoot, normalizedInstallRoot);
            TryRestoreLogFile(backupRoot, normalizedInstallRoot);
            InstallStateStore.Save(installState);
            EnsureShortcuts(installState);
            EnsureUserPath(normalizedInstallRoot);
            WindowsProtocolRegistration.EnsureHandlers(installState);
            EnsureAutoStart(installState);
            TryDelete(backupRoot);
            progress?.Report(new WindowsUpdateProgressSnapshot
            {
                Stage = WindowsUpdateStage.Completed,
                Title = "Обновление установлено",
                Detail = "Можно запускать новую версию.",
                IsIndeterminate = false,
                OverallPercent = 100,
                StagePercent = 100
            });
        }
        catch
        {
            if (!Directory.Exists(normalizedInstallRoot) && Directory.Exists(backupRoot))
            {
                Directory.Move(backupRoot, normalizedInstallRoot);
            }
            throw;
        }
    }

    public static async Task InstallFromReleaseAsync(WindowsReleaseInfo releaseInfo, InstallState installState, CancellationToken cancellationToken = default)
    {
        using var preparedBundle = await PrepareBundleAsync(releaseInfo.PortableUrl, installState.InstallRoot, releaseInfo.Version, installState.AutoStartEnabled, progress: null, cancellationToken);
        installState.Version = releaseInfo.Version;
        installState.CliBinary = releaseInfo.CliBinaryName;
        installState.GuiBinary = releaseInfo.GuiBinaryName;
        installState.LauncherBinary = releaseInfo.LauncherBinaryName;
        installState.UpdaterBinary = releaseInfo.UpdaterBinaryName;
        installState.UpdaterHostBinary = releaseInfo.UpdaterHostBinaryName;
        installState.ProtocolSchemes = InstallLayout.UriSchemes.ToArray();
        installState.ProtocolHandlerBinary = releaseInfo.LauncherBinaryName;
        await InstallPreparedBundleAsync(preparedBundle, installState, progress: null, cancellationToken);
    }

    public static void Uninstall(InstallState installState)
    {
        TryDelete(installState.InstallRoot);
        RemoveShortcut(InstallLayout.StartMenuShortcutPath());
        RemoveShortcut(InstallLayout.DesktopShortcutPath());
        RemoveFromUserPath(installState.InstallRoot);
        WindowsProtocolRegistration.RemoveHandlers();
        DisableAutoStart();
        InstallStateStore.ClearRegistry();
    }

    public static void EnsureAutoStart(InstallState installState)
    {
        if (installState.AutoStartEnabled)
        {
            using var key = Registry.CurrentUser.CreateSubKey(InstallLayout.RunKeyPath);
            key?.SetValue(InstallLayout.RunValueName, Quote(InstallLayout.LauncherPath(installState.InstallRoot)), RegistryValueKind.String);
        }
        else
        {
            DisableAutoStart();
        }
    }

    public static void DisableAutoStart()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(InstallLayout.RunKeyPath, writable: true);
            key?.DeleteValue(InstallLayout.RunValueName, false);
        }
        catch
        {
        }
    }

    public static void EnsureShortcuts(InstallState installState)
    {
        var launcherPath = InstallLayout.LauncherPath(installState.InstallRoot);
        var workingDir = installState.InstallRoot;
        CreateShortcut(InstallLayout.StartMenuShortcutPath(), launcherPath, workingDir);
        CreateShortcut(InstallLayout.DesktopShortcutPath(), launcherPath, workingDir);
    }

    public static void EnsureUserPath(string installRoot)
    {
        var pathEntry = InstallLayout.BinDirectory(installRoot);
        var userPath = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.User) ?? string.Empty;
        var parts = userPath
            .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
        if (!parts.Contains(pathEntry, StringComparer.OrdinalIgnoreCase))
        {
            parts.Insert(0, pathEntry);
            Environment.SetEnvironmentVariable("Path", string.Join(Path.PathSeparator, parts), EnvironmentVariableTarget.User);
        }
    }

    public static void RemoveFromUserPath(string installRoot)
    {
        var pathEntry = InstallLayout.BinDirectory(installRoot);
        var userPath = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.User) ?? string.Empty;
        var parts = userPath
            .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(item => !string.Equals(Path.GetFullPath(item), Path.GetFullPath(pathEntry), StringComparison.OrdinalIgnoreCase))
            .ToArray();
        Environment.SetEnvironmentVariable("Path", string.Join(Path.PathSeparator, parts), EnvironmentVariableTarget.User);
    }

    public static string BuildApplyUpdateScript(PreparedWindowsBundle preparedBundle, InstallState installState)
    {
        var installRoot = installState.InstallRoot;
        var backupRoot = installRoot + ".backup";
        var launcherPath = InstallLayout.LauncherPath(installRoot);
        var scriptPath = Path.Combine(preparedBundle.WorkingDirectory, "apply-update.cmd");
        var content = string.Join("\r\n", new[]
        {
            "@echo off",
            "setlocal",
            $"set \"INSTALL_ROOT={installRoot}\"",
            $"set \"STAGE_ROOT={preparedBundle.StageRoot}\"",
            $"set \"BACKUP_ROOT={backupRoot}\"",
            ":retry",
            "if exist \"%BACKUP_ROOT%\" rmdir /S /Q \"%BACKUP_ROOT%\" >nul 2>&1",
            "if exist \"%INSTALL_ROOT%\" move /Y \"%INSTALL_ROOT%\" \"%BACKUP_ROOT%\" >nul 2>&1",
            "move /Y \"%STAGE_ROOT%\" \"%INSTALL_ROOT%\" >nul 2>&1",
            "if errorlevel 1 (",
            "  timeout /t 1 /nobreak >nul",
            "  goto retry",
            ")",
            "if exist \"%BACKUP_ROOT%\\log.txt\" if not exist \"%INSTALL_ROOT%\\log.txt\" copy /Y \"%BACKUP_ROOT%\\log.txt\" \"%INSTALL_ROOT%\\log.txt\" >nul 2>&1",
            "if exist \"%BACKUP_ROOT%\" rmdir /S /Q \"%BACKUP_ROOT%\" >nul 2>&1",
            $"start \"\" \"{launcherPath}\"",
            "del /F /Q \"%~f0\" >nul 2>&1"
        });
        File.WriteAllText(scriptPath, content, Encoding.UTF8);
        return scriptPath;
    }

    private static async Task DownloadFileAsync(
        string url,
        string targetPath,
        IProgress<WindowsUpdateProgressSnapshot>? progress,
        CancellationToken cancellationToken)
    {
        using var httpClient = new HttpClient { Timeout = TimeSpan.FromMinutes(10) };
        using var response = await httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();
        var totalBytes = response.Content.Headers.ContentLength ?? 0L;
        await using var input = await response.Content.ReadAsStreamAsync(cancellationToken);
        await using var output = File.Create(targetPath);
        var buffer = new byte[1024 * 96];
        long downloaded = 0;
        int read;
        while ((read = await input.ReadAsync(buffer, cancellationToken)) > 0)
        {
            await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            downloaded += read;

            var hasTotal = totalBytes > 0;
            var stagePercent = hasTotal
                ? (int)Math.Clamp(downloaded * 100d / totalBytes, 0d, 100d)
                : 0;
            var overallPercent = hasTotal
                ? (int)Math.Clamp(10d + (downloaded * 45d / totalBytes), 10d, 55d)
                : 10;

            progress?.Report(new WindowsUpdateProgressSnapshot
            {
                Stage = WindowsUpdateStage.Downloading,
                Title = "Скачивание обновления",
                Detail = hasTotal
                    ? $"Загружено {FormatSize(downloaded)} из {FormatSize(totalBytes)}"
                    : $"Загружено {FormatSize(downloaded)}",
                IsIndeterminate = !hasTotal,
                OverallPercent = overallPercent,
                StagePercent = stagePercent,
                BytesDownloaded = downloaded,
                BytesTotal = totalBytes
            });
        }
    }

    private static string FormatSize(long bytes)
    {
        if (bytes <= 0)
        {
            return "0 Б";
        }

        string[] suffixes = ["Б", "КБ", "МБ", "ГБ"];
        var value = (double)bytes;
        var index = 0;
        while (value >= 1024 && index < suffixes.Length - 1)
        {
            value /= 1024d;
            index++;
        }

        return $"{value:0.#} {suffixes[index]}";
    }

    private static string FindPayloadRoot(string extractRoot)
    {
        foreach (var directory in Directory.EnumerateDirectories(extractRoot, "*", SearchOption.AllDirectories).Prepend(extractRoot))
        {
            if (File.Exists(InstallLayout.GuiPath(directory)) || File.Exists(InstallLayout.LauncherPath(directory)) || File.Exists(InstallLayout.CliPath(directory)))
            {
                return directory;
            }
        }
        throw new InvalidOperationException("Не удалось найти корень Windows bundle после распаковки.");
    }

    private static void CopyDirectory(string sourceRoot, string targetRoot)
    {
        Directory.CreateDirectory(targetRoot);
        foreach (var directory in Directory.EnumerateDirectories(sourceRoot, "*", SearchOption.AllDirectories))
        {
            var relative = Path.GetRelativePath(sourceRoot, directory);
            Directory.CreateDirectory(Path.Combine(targetRoot, relative));
        }
        foreach (var file in Directory.EnumerateFiles(sourceRoot, "*", SearchOption.AllDirectories))
        {
            var relative = Path.GetRelativePath(sourceRoot, file);
            var target = Path.Combine(targetRoot, relative);
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, overwrite: true);
        }
    }

    private static void WriteMetadataInto(string stageRoot, InstallState installState)
    {
        var clone = new InstallState
        {
            InstallRoot = InstallLayout.NormalizeInstallRoot(installState.InstallRoot),
            Version = installState.Version,
            LauncherBinary = installState.LauncherBinary,
            GuiBinary = installState.GuiBinary,
            CliBinary = installState.CliBinary,
            UpdaterBinary = installState.UpdaterBinary,
            UpdaterHostBinary = installState.UpdaterHostBinary,
            ProtocolSchemes = installState.ProtocolSchemes,
            ProtocolHandlerBinary = installState.ProtocolHandlerBinary,
            AutoStartEnabled = installState.AutoStartEnabled,
            UpdatedAtUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };
        Directory.CreateDirectory(InstallLayout.LibsDirectory(stageRoot));
        var payload = InstallStateJsonContext.Serialize(clone);
        File.WriteAllText(InstallLayout.MetadataPath(stageRoot), payload, Encoding.UTF8);
    }

    private static void TryRestoreLogFile(string backupRoot, string installRoot)
    {
        try
        {
            var previousLog = InstallLayout.LogPath(backupRoot);
            var currentLog = InstallLayout.LogPath(installRoot);
            if (File.Exists(previousLog) && !File.Exists(currentLog))
            {
                File.Copy(previousLog, currentLog, overwrite: false);
            }
        }
        catch
        {
        }
    }

    private static void CreateShortcut(string shortcutPath, string targetPath, string workingDirectory)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(shortcutPath)!);
        var script = string.Join(Environment.NewLine, new[]
        {
            "$shell = New-Object -ComObject WScript.Shell",
            $"$shortcut = $shell.CreateShortcut('{EscapePowerShell(shortcutPath)}')",
            $"$shortcut.TargetPath = '{EscapePowerShell(targetPath)}'",
            $"$shortcut.WorkingDirectory = '{EscapePowerShell(workingDirectory)}'",
            $"$shortcut.IconLocation = '{EscapePowerShell(targetPath)},0'",
            "$shortcut.Save()"
        });
        RunPowerShell(script);
    }

    private static void RemoveShortcut(string shortcutPath)
    {
        try
        {
            if (File.Exists(shortcutPath))
            {
                File.Delete(shortcutPath);
            }
        }
        catch
        {
        }
    }

    private static void RunPowerShell(string script)
    {
        var startInfo = new ProcessStartInfo("powershell", $"-NoProfile -ExecutionPolicy Bypass -Command \"{script.Replace("\"", "\\\"")}\"")
        {
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };
        using var process = Process.Start(startInfo);
        process?.WaitForExit(15000);
    }

    private static string EscapePowerShell(string value) => value.Replace("'", "''");
    private static string Quote(string value) => string.Concat('"', value, '"');

    private static void TryDelete(string path)
    {
        try
        {
            if (Directory.Exists(path))
            {
                Directory.Delete(path, true);
            }
        }
        catch
        {
        }
    }
}
