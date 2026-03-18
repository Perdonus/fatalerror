using System.Diagnostics;
using NeuralV.Windows.Services;

WindowsLog.StartSession("windows-launcher");
WindowsLog.Info("Launcher bootstrap started");

try
{
    var currentExecutable = Environment.ProcessPath ?? InstallLayout.LauncherPath(AppContext.BaseDirectory);
    var currentDirectory = Path.GetDirectoryName(currentExecutable) ?? AppContext.BaseDirectory;
    var installState = InstallStateStore.ResolveExistingInstall(currentExecutable)
        ?? InstallStateStore.CreateDefault(currentDirectory);

    installState.InstallRoot = InstallStateStore.NormalizeInstallRoot(installState.InstallRoot);
    InstallStateStore.Save(installState);

    var installRoot = installState.InstallRoot;
    var updaterPath = InstallLayout.UpdaterPath(installRoot);
    var guiPath = InstallLayout.GuiPath(installRoot);

    if (File.Exists(updaterPath))
    {
        WindowsLog.Info($"Delegating launch to updater: {updaterPath}");
        var updaterStart = new ProcessStartInfo(updaterPath)
        {
            UseShellExecute = false,
            WorkingDirectory = installRoot,
            CreateNoWindow = true
        };
        updaterStart.ArgumentList.Add("--check-and-launch");
        foreach (var arg in args)
        {
            updaterStart.ArgumentList.Add(arg);
        }
        Process.Start(updaterStart);
        return;
    }

    if (File.Exists(guiPath))
    {
        WindowsLog.Info($"Updater missing, launching GUI directly: {guiPath}");
        var guiStart = new ProcessStartInfo(guiPath)
        {
            UseShellExecute = false,
            WorkingDirectory = installRoot
        };
        guiStart.Environment["NEURALV_SKIP_UPDATER"] = "1";
        foreach (var arg in args)
        {
            guiStart.ArgumentList.Add(arg);
        }
        Process.Start(guiStart);
        return;
    }

    WindowsLog.Error($"Launcher failed: GUI bundle missing in {installRoot}");
}
catch (Exception ex)
{
    WindowsLog.Error("Launcher failed", ex);
}
