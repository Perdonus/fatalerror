using System.Diagnostics;
using NeuralV.Windows.Services;

WindowsLog.StartSession("windows-updater");
WindowsLog.Info($"Updater args: {string.Join(' ', args)}");

var forwardedArgs = args.Where(arg => !string.Equals(arg, "--check-and-launch", StringComparison.OrdinalIgnoreCase)).ToArray();

try
{
    var currentExecutable = Environment.ProcessPath ?? InstallLayout.UpdaterPath(AppContext.BaseDirectory);
    var currentDirectory = Path.GetDirectoryName(currentExecutable) ?? AppContext.BaseDirectory;
    var installState = InstallStateStore.ResolveExistingInstall(currentExecutable)
        ?? InstallStateStore.CreateDefault(currentDirectory);

    installState.InstallRoot = InstallStateStore.NormalizeInstallRoot(installState.InstallRoot);
    var installRoot = installState.InstallRoot;
    var guiPath = InstallLayout.GuiPath(installRoot);
    WindowsLog.Info($"Resolved install root: {installRoot}");

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

    if (releaseInfo is not null && releaseInfo.IsNewerThan(currentVersion) && !string.IsNullOrWhiteSpace(releaseInfo.PortableUrl))
    {
        WindowsLog.Info($"Update available: {currentVersion} -> {releaseInfo.Version}");
        installState.Version = releaseInfo.Version;
        installState.CliBinary = releaseInfo.CliBinaryName;
        installState.GuiBinary = releaseInfo.GuiBinaryName;
        installState.LauncherBinary = releaseInfo.LauncherBinaryName;
        installState.UpdaterBinary = releaseInfo.UpdaterBinaryName;

        using var preparedBundle = await WindowsBundleInstaller.PrepareBundleAsync(
            releaseInfo.PortableUrl,
            installRoot,
            installState.Version,
            installState.AutoStartEnabled);

        var scriptPath = WindowsBundleInstaller.BuildApplyUpdateScript(preparedBundle, installState);
        WindowsLog.Info($"Prepared update script: {scriptPath}");
        Process.Start(new ProcessStartInfo("cmd.exe", $"/c \"{scriptPath}\"")
        {
            UseShellExecute = true,
            WorkingDirectory = installRoot,
            CreateNoWindow = true
        });
        return;
    }

    LaunchGui(guiPath, installRoot, forwardedArgs);
}
catch (Exception ex)
{
    WindowsLog.Error("Updater failed, attempting direct GUI launch", ex);
    var installRoot = InstallStateStore.ResolveExistingInstall(Environment.ProcessPath)?.InstallRoot ?? AppContext.BaseDirectory;
    var guiPath = InstallLayout.GuiPath(installRoot);
    LaunchGui(guiPath, installRoot, forwardedArgs);
}

static void LaunchGui(string guiPath, string installRoot, IEnumerable<string> forwardedArgs)
{
    if (!File.Exists(guiPath))
    {
        WindowsLog.Error($"GUI binary missing: {guiPath}");
        return;
    }

    WindowsLog.Info($"Launching GUI: {guiPath}");
    var startInfo = new ProcessStartInfo(guiPath)
    {
        UseShellExecute = false,
        WorkingDirectory = installRoot
    };
    startInfo.Environment["NEURALV_SKIP_UPDATER"] = "1";
    startInfo.ArgumentList.Add("--launched-by-updater");
    foreach (var arg in forwardedArgs)
    {
        startInfo.ArgumentList.Add(arg);
    }
    Process.Start(startInfo);
}

static string TryReadFileVersion(string guiPath)
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
