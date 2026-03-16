using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using NeuralV.Windows.Models;

namespace NeuralV.Windows.Services;

public static class SessionStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    public static string AppDirectory
    {
        get
        {
            var path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "NeuralV");
            Directory.CreateDirectory(path);
            return path;
        }
    }

    public static string SessionFilePath => Path.Combine(AppDirectory, "session.json");
    public static string HistoryFilePath => Path.Combine(AppDirectory, "history.json");
    public static string DeviceIdFilePath => Path.Combine(AppDirectory, "device.id");

    public static string EnsureDeviceId()
    {
        if (File.Exists(DeviceIdFilePath))
        {
            var existing = File.ReadAllText(DeviceIdFilePath, Encoding.UTF8).Trim();
            if (!string.IsNullOrWhiteSpace(existing))
            {
                return existing;
            }
        }

        var deviceId = Guid.NewGuid().ToString("D");
        File.WriteAllText(DeviceIdFilePath, deviceId, Encoding.UTF8);
        return deviceId;
    }

    public static async Task SaveSessionAsync(SessionData session, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(AppDirectory);
        var payload = JsonSerializer.Serialize(session, JsonOptions);
        var protectedBytes = ProtectedData.Protect(Encoding.UTF8.GetBytes(payload), null, DataProtectionScope.CurrentUser);
        await File.WriteAllBytesAsync(SessionFilePath, protectedBytes, cancellationToken);
    }

    public static async Task<SessionData?> LoadSessionAsync(CancellationToken cancellationToken = default)
    {
        if (!File.Exists(SessionFilePath))
        {
            return null;
        }

        try
        {
            var payload = await File.ReadAllBytesAsync(SessionFilePath, cancellationToken);
            var jsonBytes = ProtectedData.Unprotect(payload, null, DataProtectionScope.CurrentUser);
            var session = JsonSerializer.Deserialize<SessionData>(jsonBytes, JsonOptions);
            return session is { IsValid: true } ? session : null;
        }
        catch
        {
            return null;
        }
    }

    public static void ClearSession()
    {
        if (File.Exists(SessionFilePath))
        {
            File.Delete(SessionFilePath);
        }
    }
}
