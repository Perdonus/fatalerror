using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using NeuralV.Windows.Models;

namespace NeuralV.Windows.Services;

public sealed class NeuralVApiClient : IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;

    public NeuralVApiClient()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri("https://sosiskibot.ru/basedata/"),
            Timeout = TimeSpan.FromSeconds(45)
        };
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public void Dispose() => _httpClient.Dispose();

    public async Task<ChallengeTicket> StartLoginAsync(string email, string password, string deviceId, CancellationToken cancellationToken = default)
    {
        var document = await PostJsonAsync("api/auth/login/start", new
        {
            email,
            password,
            device_id = deviceId
        }, cancellationToken);

        if (document.error is not null)
        {
            return new ChallengeTicket { Mode = AuthMode.Login, Email = email, Error = document.error };
        }

        return new ChallengeTicket
        {
            Mode = AuthMode.Login,
            Email = email,
            ChallengeId = document.root?.GetPropertyOrDefault("challenge_id")?.GetString() ?? string.Empty,
            ExpiresAt = document.root?.GetPropertyOrDefault("expires_at")?.GetInt64() ?? 0
        };
    }

    public async Task<ChallengeTicket> StartRegisterAsync(string name, string email, string password, string deviceId, CancellationToken cancellationToken = default)
    {
        var document = await PostJsonAsync("api/auth/register/start", new
        {
            name,
            email,
            password,
            device_id = deviceId
        }, cancellationToken);

        if (document.error is not null)
        {
            return new ChallengeTicket { Mode = AuthMode.Register, Email = email, Error = document.error };
        }

        return new ChallengeTicket
        {
            Mode = AuthMode.Register,
            Email = email,
            ChallengeId = document.root?.GetPropertyOrDefault("challenge_id")?.GetString() ?? string.Empty,
            ExpiresAt = document.root?.GetPropertyOrDefault("expires_at")?.GetInt64() ?? 0
        };
    }

    public async Task<(SessionData? session, string? error)> VerifyChallengeAsync(AuthMode mode, string challengeId, string email, string code, string deviceId, CancellationToken cancellationToken = default)
    {
        var path = mode == AuthMode.Register ? "api/auth/register/verify" : "api/auth/login/verify";
        var response = await PostJsonAsync(path, new
        {
            challenge_id = challengeId,
            email,
            code,
            device_id = deviceId
        }, cancellationToken);
        return response.error is not null
            ? (null, response.error)
            : (ParseSession(response.root, deviceId), null);
    }

    public async Task<(SessionData? session, string? error)> RefreshSessionAsync(SessionData current, CancellationToken cancellationToken = default)
    {
        var response = await PostJsonAsync("api/auth/refresh", new
        {
            refresh_token = current.RefreshToken,
            session_id = current.SessionId,
            device_id = current.DeviceId
        }, cancellationToken);
        return response.error is not null
            ? (null, response.error)
            : (ParseSession(response.root, current.DeviceId), null);
    }

    public async Task<bool> LogoutAsync(SessionData current, CancellationToken cancellationToken = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "api/auth/logout")
        {
            Content = new StringContent("{}", Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", current.AccessToken);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        return response.IsSuccessStatusCode;
    }

    public async Task<(DesktopScanState? scan, string? error)> StartDesktopScanAsync(SessionData current, string mode, string artifactKind, string targetName, string targetPath, IReadOnlyList<string> scanRoots, IReadOnlyList<string> installRoots, CancellationToken cancellationToken = default)
    {
        var response = await PostJsonAsync("api/scans/desktop/start", new
        {
            platform = "windows",
            mode,
            artifact_kind = artifactKind,
            artifact_metadata = new
            {
                target_name = targetName,
                target_path = targetPath,
                scan_roots = scanRoots,
                install_roots = installRoots,
                package_count = 0,
                candidate_count = 0
            }
        }, cancellationToken, current.AccessToken);
        return response.error is not null
            ? (null, response.error)
            : (ParseScan(response.root?.GetPropertyOrDefault("scan")), null);
    }

    public async Task<(DesktopScanState? scan, string? error)> GetDesktopScanAsync(SessionData current, string scanId, CancellationToken cancellationToken = default)
    {
        var response = await GetJsonAsync($"api/scans/desktop/{scanId}", cancellationToken, current.AccessToken);
        return response.error is not null
            ? (null, response.error)
            : (ParseScan(response.root?.GetPropertyOrDefault("scan")), null);
    }

    public async Task<(bool success, string? error)> CancelDesktopScanAsync(SessionData current, CancellationToken cancellationToken = default)
    {
        var response = await PostJsonAsync("api/scans/desktop/cancel-active", new { }, cancellationToken, current.AccessToken);
        if (response.error is not null)
        {
            return (false, response.error);
        }
        return (response.root?.GetPropertyOrDefault("success")?.GetBoolean() ?? false, null);
    }

    public async Task<UpdateInfo> CheckForUpdateAsync(string currentVersion, CancellationToken cancellationToken = default)
    {
        var response = await GetJsonAsync("api/releases/manifest?platform=windows", cancellationToken);
        if (response.error is not null)
        {
            return new UpdateInfo { Error = response.error };
        }

        var root = response.root;
        var latest = root?.GetPropertyOrDefault("version")?.GetString() ?? string.Empty;
        var setupUrl = root?.GetPropertyOrDefault("setupUrl")?.GetString()
            ?? root?.GetPropertyOrDefault("metadata")?.GetPropertyOrDefault("setupUrl")?.GetString()
            ?? string.Empty;
        var portableUrl = root?.GetPropertyOrDefault("download_url")?.GetString() ?? string.Empty;
        return new UpdateInfo
        {
            Available = !string.IsNullOrWhiteSpace(latest) && !string.Equals(latest, currentVersion, StringComparison.OrdinalIgnoreCase),
            LatestVersion = latest,
            SetupUrl = setupUrl,
            PortableUrl = portableUrl
        };
    }

    private static SessionData ParseSession(JsonElement? root, string deviceId)
    {
        var element = root ?? throw new InvalidOperationException("Session payload is missing");
        var session = JsonSerializer.Deserialize<SessionData>(element.GetRawText(), JsonOptions) ?? new SessionData();
        session.DeviceId = deviceId;
        session.User ??= new SessionUser();
        session.User.Id = element.GetPropertyOrDefault("id")?.GetString() ?? session.User.Id;
        session.User.Name = element.GetPropertyOrDefault("name")?.GetString() ?? session.User.Name;
        session.User.Email = element.GetPropertyOrDefault("email")?.GetString() ?? session.User.Email;
        session.User.IsPremium = element.GetPropertyOrDefault("is_premium")?.GetBoolean() ?? session.User.IsPremium;
        session.User.IsDeveloperMode = element.GetPropertyOrDefault("is_developer_mode")?.GetBoolean() ?? session.User.IsDeveloperMode;
        if (!session.IsValid)
        {
            throw new InvalidOperationException("Сервер вернул неполную сессию");
        }
        return session;
    }

    private static DesktopScanState ParseScan(JsonElement? root)
    {
        if (root is null)
        {
            throw new InvalidOperationException("Сервер не вернул desktop-задачу");
        }

        var item = root.Value;
        return new DesktopScanState
        {
            Id = item.GetPropertyOrDefault("id")?.GetString() ?? string.Empty,
            Platform = item.GetPropertyOrDefault("platform")?.GetString() ?? string.Empty,
            Mode = item.GetPropertyOrDefault("mode")?.GetString() ?? string.Empty,
            Status = item.GetPropertyOrDefault("status")?.GetString() ?? string.Empty,
            Verdict = item.GetPropertyOrDefault("verdict")?.GetString() ?? string.Empty,
            Message = item.GetPropertyOrDefault("message")?.GetString() ?? string.Empty,
            RiskScore = item.GetPropertyOrDefault("risk_score")?.GetInt32() ?? 0,
            SurfacedFindings = item.GetPropertyOrDefault("surfaced_findings")?.GetInt32() ?? 0,
            HiddenFindings = item.GetPropertyOrDefault("hidden_findings")?.GetInt32() ?? 0,
            StartedAt = item.GetPropertyOrDefault("started_at")?.GetInt64() ?? 0,
            CompletedAt = item.GetPropertyOrDefault("completed_at")?.GetInt64() ?? 0,
            Timeline = item.GetPropertyOrDefault("timeline")?.ToStringList() ?? Array.Empty<string>(),
            Findings = item.GetPropertyOrDefault("findings")?.ToFindingList() ?? Array.Empty<DesktopScanFinding>()
        };
    }

    private async Task<(JsonElement? root, string? error)> GetJsonAsync(string relativePath, CancellationToken cancellationToken, string? bearerToken = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, relativePath);
        if (!string.IsNullOrWhiteSpace(bearerToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
        }
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        return await ParseResponseAsync(response, cancellationToken);
    }

    private async Task<(JsonElement? root, string? error)> PostJsonAsync(string relativePath, object payload, CancellationToken cancellationToken, string? bearerToken = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, relativePath)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json")
        };
        if (!string.IsNullOrWhiteSpace(bearerToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
        }
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        return await ParseResponseAsync(response, cancellationToken);
    }

    private static async Task<(JsonElement? root, string? error)> ParseResponseAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        JsonDocument? document = null;
        try
        {
            if (!string.IsNullOrWhiteSpace(body))
            {
                document = JsonDocument.Parse(body);
            }
        }
        catch
        {
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorText = document?.RootElement.GetPropertyOrDefault("error")?.GetString();
            return (null, string.IsNullOrWhiteSpace(errorText) ? $"HTTP {(int)response.StatusCode}" : errorText);
        }

        return (document?.RootElement.Clone(), null);
    }
}

internal static class JsonElementExtensions
{
    public static JsonElement? GetPropertyOrDefault(this JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var value) ? value : null;
    }

    public static IReadOnlyList<string> ToStringList(this JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<string>();
        }
        return element.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => item.GetString() ?? string.Empty)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToArray();
    }

    public static IReadOnlyList<DesktopScanFinding> ToFindingList(this JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<DesktopScanFinding>();
        }

        var items = new List<DesktopScanFinding>();
        foreach (var item in element.EnumerateArray())
        {
            items.Add(new DesktopScanFinding
            {
                Id = item.GetPropertyOrDefault("id")?.GetString() ?? string.Empty,
                Title = item.GetPropertyOrDefault("title")?.GetString() ?? string.Empty,
                Verdict = item.GetPropertyOrDefault("verdict")?.GetString() ?? string.Empty,
                Summary = item.GetPropertyOrDefault("summary")?.GetString() ?? string.Empty,
                Engines = item.GetPropertyOrDefault("engines")?.ToStringList() ?? Array.Empty<string>()
            });
        }
        return items;
    }
}
