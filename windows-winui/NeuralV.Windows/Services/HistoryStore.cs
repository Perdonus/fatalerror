using System.Text.Json;
using NeuralV.Windows.Models;

namespace NeuralV.Windows.Services;

public static class HistoryStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    public static async Task<IReadOnlyList<StoredScanRecord>> LoadAsync(CancellationToken cancellationToken = default)
    {
        if (!File.Exists(SessionStore.HistoryFilePath))
        {
            return Array.Empty<StoredScanRecord>();
        }

        try
        {
            await using var stream = File.OpenRead(SessionStore.HistoryFilePath);
            var items = await JsonSerializer.DeserializeAsync<List<StoredScanRecord>>(stream, JsonOptions, cancellationToken);
            return items ?? new List<StoredScanRecord>();
        }
        catch
        {
            return Array.Empty<StoredScanRecord>();
        }
    }

    public static async Task AppendAsync(DesktopScanState scan, CancellationToken cancellationToken = default)
    {
        var current = (await LoadAsync(cancellationToken)).ToList();
        current.RemoveAll(item => item.Id == scan.Id);
        current.Insert(0, new StoredScanRecord
        {
            Id = scan.Id,
            Mode = scan.Mode,
            Verdict = scan.Verdict,
            Message = scan.Message,
            SavedAt = DateTimeOffset.UtcNow,
            Timeline = scan.Timeline.ToList(),
            Findings = scan.Findings.Select(item => new DesktopScanFindingRecord
            {
                Title = item.Title,
                Verdict = item.Verdict,
                Summary = item.Summary
            }).ToList()
        });
        if (current.Count > 30)
        {
            current = current.Take(30).ToList();
        }

        Directory.CreateDirectory(SessionStore.AppDirectory);
        await using var stream = File.Create(SessionStore.HistoryFilePath);
        await JsonSerializer.SerializeAsync(stream, current, JsonOptions, cancellationToken);
    }
}
