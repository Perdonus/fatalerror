using System.Text.Json.Serialization;
using NeuralV.Windows.Services;

namespace NeuralV.UpdateHost;

internal sealed class DetachedUpdateRequest
{
    [JsonPropertyName("workingDirectory")]
    public string WorkingDirectory { get; set; } = string.Empty;

    [JsonPropertyName("stageRoot")]
    public string StageRoot { get; set; } = string.Empty;

    [JsonPropertyName("forwardedArgs")]
    public string[] ForwardedArgs { get; set; } = Array.Empty<string>();

    [JsonPropertyName("installState")]
    public InstallState InstallState { get; set; } = InstallStateStore.CreateDefault();

    [JsonPropertyName("cleanupExecutablePath")]
    public string CleanupExecutablePath { get; set; } = string.Empty;
}
