using System.Text.Json.Serialization;

namespace NeuralV.Windows.Models;

public enum AuthMode
{
    Login,
    Register
}

public enum AppScreen
{
    Splash,
    Welcome,
    Login,
    Register,
    Code,
    Home,
    Scan,
    History,
    Settings
}

public sealed class SessionUser
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("is_premium")]
    public bool IsPremium { get; set; }

    [JsonPropertyName("is_developer_mode")]
    public bool IsDeveloperMode { get; set; }
}

public sealed class SessionData
{
    [JsonPropertyName("token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = string.Empty;

    [JsonPropertyName("session_id")]
    public string SessionId { get; set; } = string.Empty;

    [JsonPropertyName("access_token_expires_at")]
    public long AccessTokenExpiresAt { get; set; }

    [JsonPropertyName("refresh_token_expires_at")]
    public long RefreshTokenExpiresAt { get; set; }

    public string DeviceId { get; set; } = string.Empty;
    public SessionUser User { get; set; } = new();

    public bool IsValid =>
        !string.IsNullOrWhiteSpace(AccessToken) &&
        !string.IsNullOrWhiteSpace(RefreshToken) &&
        !string.IsNullOrWhiteSpace(SessionId);
}

public sealed class ChallengeTicket
{
    public AuthMode Mode { get; init; }
    public string ChallengeId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public long ExpiresAt { get; init; }
    public string Error { get; init; } = string.Empty;
    public bool Ok => string.IsNullOrWhiteSpace(Error) && !string.IsNullOrWhiteSpace(ChallengeId);
}

public sealed class UpdateInfo
{
    public bool Available { get; init; }
    public string LatestVersion { get; init; } = string.Empty;
    public string SetupUrl { get; init; } = string.Empty;
    public string PortableUrl { get; init; } = string.Empty;
    public string Error { get; init; } = string.Empty;
}

public sealed class DesktopScanFinding
{
    public string Id { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Verdict { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
    public IReadOnlyList<string> Engines { get; init; } = Array.Empty<string>();
}

public sealed class DesktopScanState
{
    public string Id { get; init; } = string.Empty;
    public string Platform { get; init; } = string.Empty;
    public string Mode { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Verdict { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public int RiskScore { get; init; }
    public int SurfacedFindings { get; init; }
    public int HiddenFindings { get; init; }
    public long StartedAt { get; init; }
    public long CompletedAt { get; init; }
    public IReadOnlyList<string> Timeline { get; init; } = Array.Empty<string>();
    public IReadOnlyList<DesktopScanFinding> Findings { get; init; } = Array.Empty<DesktopScanFinding>();
    public bool IsFinished => Status is "COMPLETED" or "FAILED" or "CANCELLED";
    public bool IsSuccessful => Status == "COMPLETED";
    public string PrimarySummary => string.IsNullOrWhiteSpace(Message) ? Verdict : Message;
}

public sealed class StoredScanRecord
{
    public string Id { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public string Verdict { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTimeOffset SavedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<string> Timeline { get; set; } = new();
    public List<DesktopScanFindingRecord> Findings { get; set; } = new();
}

public sealed class DesktopScanFindingRecord
{
    public string Title { get; set; } = string.Empty;
    public string Verdict { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
}
