using System.Windows.Forms;
using NeuralV.Windows.Services;

ApplicationConfiguration.Initialize();
WindowsLog.StartSession("windows-setup");
WindowsLog.Info("Setup bootstrap started");

try
{
    var existingInstall = InstallStateStore.ResolveExistingInstall();
    if (existingInstall is not null && InstallStateStore.BundleLooksInstalled(existingInstall.InstallRoot))
    {
        var choice = MessageBox.Show(
            $"NeuralV уже установлен в:\n{existingInstall.InstallRoot}\n\nДа — починить текущую установку\nНет — удалить приложение",
            "NeuralV Setup",
            MessageBoxButtons.YesNoCancel,
            MessageBoxIcon.Question);

        if (choice == DialogResult.Yes)
        {
            await RepairAsync(existingInstall);
            return;
        }
        if (choice == DialogResult.No)
        {
            WindowsBundleInstaller.Uninstall(existingInstall);
            MessageBox.Show("NeuralV удалён.", "NeuralV Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }
        return;
    }

    using var dialog = new FolderBrowserDialog
    {
        Description = "Выбери папку для установки NeuralV",
        InitialDirectory = InstallLayout.DefaultInstallRoot(),
        UseDescriptionForTitle = true,
        AutoUpgradeEnabled = true,
        ShowNewFolderButton = true
    };

    if (dialog.ShowDialog() != DialogResult.OK || string.IsNullOrWhiteSpace(dialog.SelectedPath))
    {
        return;
    }

    var installState = InstallStateStore.CreateDefault(dialog.SelectedPath);
    installState.AutoStartEnabled = true;
    await RepairAsync(installState);
}
catch (Exception ex)
{
    WindowsLog.Error("Setup failed", ex);
    MessageBox.Show($"Не удалось завершить установку.\n\n{ex.Message}", "NeuralV Setup", MessageBoxButtons.OK, MessageBoxIcon.Error);
}

static async Task RepairAsync(InstallState installState)
{
    var releaseInfo = await WindowsReleaseManifestClient.FetchAsync()
        ?? throw new InvalidOperationException("Не удалось получить текущий Windows-релиз.");

    installState.Version = releaseInfo.Version;
    installState.CliBinary = releaseInfo.CliBinaryName;
    installState.GuiBinary = releaseInfo.GuiBinaryName;
    installState.LauncherBinary = releaseInfo.LauncherBinaryName;
    installState.UpdaterBinary = releaseInfo.UpdaterBinaryName;

    await WindowsBundleInstaller.InstallFromReleaseAsync(releaseInfo, installState);
    MessageBox.Show($"NeuralV установлен в:\n{installState.InstallRoot}", "NeuralV Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(InstallLayout.LauncherPath(installState.InstallRoot))
    {
        UseShellExecute = true,
        WorkingDirectory = installState.InstallRoot
    });
}
