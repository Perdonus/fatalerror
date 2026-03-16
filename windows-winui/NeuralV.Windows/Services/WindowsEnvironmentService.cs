namespace NeuralV.Windows.Services;

public static class WindowsEnvironmentService
{
    public static IReadOnlyList<string> DetectScanRoots()
    {
        var roots = new List<string>();
        AddIfExists(roots, Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles));
        AddIfExists(roots, Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86));
        AddIfExists(roots, Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData));
        AddIfExists(roots, Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs"));
        AddIfExists(roots, Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData));
        AddIfExists(roots, Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Desktop"));
        AddIfExists(roots, Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads"));
        AddIfExists(roots, Path.GetTempPath());
        return roots.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    }

    public static IReadOnlyList<string> DetectInstallRoots()
    {
        var roots = new List<string>();
        AddIfExists(roots, Environment.GetFolderPath(Environment.SpecialFolder.StartMenu));
        AddIfExists(roots, Environment.GetFolderPath(Environment.SpecialFolder.CommonStartMenu));
        AddIfExists(roots, Environment.GetFolderPath(Environment.SpecialFolder.Startup));
        AddIfExists(roots, Environment.GetFolderPath(Environment.SpecialFolder.CommonStartup));
        AddIfExists(roots, Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory));
        return roots.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private static void AddIfExists(ICollection<string> output, string? path)
    {
        if (!string.IsNullOrWhiteSpace(path) && Directory.Exists(path))
        {
            output.Add(path);
        }
    }
}
