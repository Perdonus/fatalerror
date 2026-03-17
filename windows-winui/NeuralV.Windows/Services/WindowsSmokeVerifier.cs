namespace NeuralV.Windows.Services;

public static class WindowsSmokeVerifier
{
    public static void Run()
    {
        WindowsLog.Info("Smoke verifier started");

        _ = SessionStore.EnsureDeviceId();
        _ = SessionStore.AppDirectory;
        _ = WindowsEnvironmentService.DetectScanRoots();
        _ = WindowsEnvironmentService.DetectInstallRoots();

        var assetPath = Path.Combine(AppContext.BaseDirectory, "Assets", "NeuralV.png");
        if (!File.Exists(assetPath))
        {
            throw new FileNotFoundException("Smoke verifier did not find packaged icon asset", assetPath);
        }

        WindowsLog.Info($"Smoke verifier asset ok: {assetPath}");
        using var client = new NeuralVApiClient();
        WindowsLog.Info("Smoke verifier API client constructed");
    }
}
