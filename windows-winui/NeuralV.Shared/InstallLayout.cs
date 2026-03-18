using System.Text.Json.Serialization;

namespace NeuralV.Windows.Services;

public static class InstallLayout
{
    public const string ProductName = "NeuralV";
    public const string LauncherBinaryName = "NeuralV.exe";
    public const string GuiBinaryName = "NeuralV.Gui.exe";
    public const string CliBinaryName = "neuralv.exe";
    public const string UpdaterBinaryName = "neuralv-updater.exe";
    public const string MetadataFileName = "install.json";
    public const string RegistryKeyPath = @"Software\NeuralV";
    public const string RegistryInstallRootValue = "InstallRoot";
    public const string RegistryVersionValue = "Version";
    public const string RegistryAutoStartValue = "AutoStartEnabled";
    public const string RunKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
    public const string RunValueName = "NeuralV";

    public static string DefaultInstallRoot()
    {
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (string.IsNullOrWhiteSpace(localAppData))
        {
            localAppData = AppContext.BaseDirectory;
        }
        return Path.Combine(localAppData, "Programs", ProductName);
    }

    public static string MetadataPath(string installRoot) => Path.Combine(installRoot, MetadataFileName);
    public static string LauncherPath(string installRoot) => Path.Combine(installRoot, LauncherBinaryName);
    public static string GuiPath(string installRoot) => Path.Combine(installRoot, GuiBinaryName);
    public static string CliPath(string installRoot) => Path.Combine(installRoot, CliBinaryName);
    public static string UpdaterPath(string installRoot) => Path.Combine(installRoot, UpdaterBinaryName);

    public static string StartMenuShortcutPath()
    {
        var programs = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
        return Path.Combine(programs, ProductName + ".lnk");
    }

    public static string DesktopShortcutPath()
    {
        var desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        return Path.Combine(desktop, ProductName + ".lnk");
    }
}

public sealed class InstallState
{
    [JsonPropertyName("installRoot")]
    public string InstallRoot { get; set; } = InstallLayout.DefaultInstallRoot();

    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("launcherBinary")]
    public string LauncherBinary { get; set; } = InstallLayout.LauncherBinaryName;

    [JsonPropertyName("guiExecutable")]
    public string GuiBinary { get; set; } = InstallLayout.GuiBinaryName;

    [JsonPropertyName("cliExecutable")]
    public string CliBinary { get; set; } = InstallLayout.CliBinaryName;

    [JsonPropertyName("updaterExecutable")]
    public string UpdaterBinary { get; set; } = InstallLayout.UpdaterBinaryName;

    [JsonPropertyName("autoStartEnabled")]
    public bool AutoStartEnabled { get; set; } = true;

    [JsonPropertyName("updatedAt")]
    public long UpdatedAtUnixMs { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}
