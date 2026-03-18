using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.Win32;

namespace NeuralV.Windows.Services;

public static class InstallStateStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true
    };

    public static InstallState CreateDefault(string? installRoot = null, string? version = null)
    {
        return new InstallState
        {
            InstallRoot = NormalizeInstallRoot(installRoot ?? InstallLayout.DefaultInstallRoot()),
            Version = string.IsNullOrWhiteSpace(version) ? string.Empty : version.Trim(),
            UpdatedAtUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };
    }

    public static InstallState? ResolveExistingInstall(string? executablePath = null)
    {
        foreach (var candidate in EnumerateCandidateInstallRoots(executablePath))
        {
            var state = LoadFromRoot(candidate);
            if (state is not null)
            {
                return state;
            }
        }
        return null;
    }

    public static IEnumerable<string> EnumerateCandidateInstallRoots(string? executablePath = null)
    {
        var candidates = new List<string>();
        AddCandidate(candidates, ReadRegistryInstallRoot());

        if (!string.IsNullOrWhiteSpace(executablePath))
        {
            AddCandidate(candidates, Path.GetDirectoryName(executablePath));
        }

        if (!string.IsNullOrWhiteSpace(Environment.ProcessPath))
        {
            AddCandidate(candidates, Path.GetDirectoryName(Environment.ProcessPath));
        }

        if (!string.IsNullOrWhiteSpace(AppContext.BaseDirectory))
        {
            AddCandidate(candidates, AppContext.BaseDirectory);
        }

        AddCandidate(candidates, ResolveInstallRootFromShortcuts());
        AddCandidate(candidates, InstallLayout.DefaultInstallRoot());
        return candidates;
    }

    public static InstallState? LoadFromRoot(string? installRoot)
    {
        if (string.IsNullOrWhiteSpace(installRoot))
        {
            return null;
        }

        var normalizedRoot = NormalizeInstallRoot(installRoot);
        var metadataPath = InstallLayout.MetadataPath(normalizedRoot);
        if (!File.Exists(metadataPath))
        {
            if (!BundleLooksInstalled(normalizedRoot))
            {
                return null;
            }
            return CreateDefault(normalizedRoot, ReadRegistryVersion());
        }

        try
        {
            var payload = File.ReadAllText(metadataPath, Encoding.UTF8);
            var state = JsonSerializer.Deserialize<InstallState>(payload, JsonOptions);
            if (state is null)
            {
                return null;
            }
            state.InstallRoot = normalizedRoot;
            if (string.IsNullOrWhiteSpace(state.LauncherBinary)) state.LauncherBinary = InstallLayout.LauncherBinaryName;
            if (string.IsNullOrWhiteSpace(state.GuiBinary)) state.GuiBinary = InstallLayout.GuiBinaryName;
            if (string.IsNullOrWhiteSpace(state.CliBinary)) state.CliBinary = InstallLayout.CliBinaryName;
            if (string.IsNullOrWhiteSpace(state.UpdaterBinary)) state.UpdaterBinary = InstallLayout.UpdaterBinaryName;
            return state;
        }
        catch (Exception ex)
        {
            WindowsLog.Error($"Install metadata read failed: {metadataPath}", ex);
            return null;
        }
    }

    public static void Save(InstallState state)
    {
        state.InstallRoot = NormalizeInstallRoot(state.InstallRoot);
        state.UpdatedAtUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        Directory.CreateDirectory(state.InstallRoot);
        var metadataPath = InstallLayout.MetadataPath(state.InstallRoot);
        var payload = JsonSerializer.Serialize(state, JsonOptions);
        File.WriteAllText(metadataPath, payload, Encoding.UTF8);

        using var key = Registry.CurrentUser.CreateSubKey(InstallLayout.RegistryKeyPath);
        key?.SetValue(InstallLayout.RegistryInstallRootValue, state.InstallRoot, RegistryValueKind.String);
        key?.SetValue(InstallLayout.RegistryVersionValue, state.Version ?? string.Empty, RegistryValueKind.String);
        key?.SetValue(InstallLayout.RegistryAutoStartValue, state.AutoStartEnabled ? 1 : 0, RegistryValueKind.DWord);
    }

    public static void UpdateAutoStartPreference(bool enabled, string? executablePath = null)
    {
        var state = ResolveExistingInstall(executablePath) ?? CreateDefault();
        state.AutoStartEnabled = enabled;
        Save(state);
    }

    public static void ClearRegistry()
    {
        try
        {
            Registry.CurrentUser.DeleteSubKeyTree(InstallLayout.RegistryKeyPath, false);
        }
        catch
        {
        }
    }

    public static bool BundleLooksInstalled(string? installRoot)
    {
        if (string.IsNullOrWhiteSpace(installRoot))
        {
            return false;
        }

        return File.Exists(InstallLayout.GuiPath(installRoot))
            || File.Exists(InstallLayout.LauncherPath(installRoot))
            || File.Exists(InstallLayout.CliPath(installRoot));
    }

    public static string NormalizeInstallRoot(string installRoot) =>
        Path.GetFullPath(string.IsNullOrWhiteSpace(installRoot) ? InstallLayout.DefaultInstallRoot() : installRoot.Trim());

    private static void AddCandidate(ICollection<string> items, string? candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return;
        }
        var normalized = NormalizeInstallRoot(candidate);
        if (items.Contains(normalized, StringComparer.OrdinalIgnoreCase))
        {
            return;
        }
        items.Add(normalized);
    }

    private static string? ReadRegistryInstallRoot()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(InstallLayout.RegistryKeyPath);
            return key?.GetValue(InstallLayout.RegistryInstallRootValue) as string;
        }
        catch
        {
            return null;
        }
    }

    private static string ReadRegistryVersion()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(InstallLayout.RegistryKeyPath);
            return (key?.GetValue(InstallLayout.RegistryVersionValue) as string ?? string.Empty).Trim();
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string? ResolveInstallRootFromShortcuts()
    {
        foreach (var shortcutPath in new[] { InstallLayout.StartMenuShortcutPath(), InstallLayout.DesktopShortcutPath() })
        {
            var target = ResolveShortcutTarget(shortcutPath);
            if (string.IsNullOrWhiteSpace(target) || !File.Exists(target))
            {
                continue;
            }
            return Path.GetDirectoryName(target);
        }
        return null;
    }

    private static string? ResolveShortcutTarget(string shortcutPath)
    {
        if (!File.Exists(shortcutPath))
        {
            return null;
        }

        try
        {
            var script = string.Join(Environment.NewLine, new[]
            {
                "$shell = New-Object -ComObject WScript.Shell",
                $"$shortcut = $shell.CreateShortcut('{EscapePowerShell(shortcutPath)}')",
                "if ($shortcut.TargetPath) { Write-Output $shortcut.TargetPath }"
            });
            var startInfo = new ProcessStartInfo("powershell", $"-NoProfile -ExecutionPolicy Bypass -Command \"{script.Replace("\"", "\\\"")}\"")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var process = Process.Start(startInfo);
            if (process is null)
            {
                return null;
            }
            var output = process.StandardOutput.ReadToEnd().Trim();
            process.WaitForExit(5000);
            return string.IsNullOrWhiteSpace(output) ? null : output;
        }
        catch
        {
            return null;
        }
    }

    private static string EscapePowerShell(string value) => value.Replace("'", "''");
}
