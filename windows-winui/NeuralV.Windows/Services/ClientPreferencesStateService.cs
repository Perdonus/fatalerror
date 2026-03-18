using NeuralV.Windows.Models;

namespace NeuralV.Windows.Services;

public static class ClientPreferencesStateService
{
    private static readonly SemaphoreSlim Gate = new(1, 1);

    public static ClientPreferences Get() => ClientPreferencesStore.Load();

    public static Task<ClientPreferences> GetAsync(CancellationToken cancellationToken = default) =>
        ClientPreferencesStore.LoadAsync(cancellationToken);

    public static Task<ClientPreferences> SaveAsync(ClientPreferences preferences, CancellationToken cancellationToken = default) =>
        UpdateAsync(_ => Clone(preferences), cancellationToken);

    public static Task<ClientPreferences> SetThemeModeAsync(ThemeModePreference themeMode, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            state.ThemeMode = themeMode;
            return state;
        }, cancellationToken);

    public static Task<ClientPreferences> SetDynamicColorsEnabledAsync(bool enabled, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            state.DynamicColorsEnabled = enabled;
            return state;
        }, cancellationToken);

    public static Task<ClientPreferences> SetNetworkProtectionEnabledAsync(bool enabled, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            return WindowsNetworkProtectionStateService.ApplyUnifiedToggle(state, enabled);
        }, cancellationToken);

    public static Task<ClientPreferences> SetAdBlockEnabledAsync(bool enabled, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            return WindowsNetworkProtectionStateService.ApplyUnifiedToggle(state, enabled);
        }, cancellationToken);

    public static Task<ClientPreferences> SetUnsafeSitesEnabledAsync(bool enabled, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            return WindowsNetworkProtectionStateService.ApplyUnifiedToggle(state, enabled);
        }, cancellationToken);

    public static Task<ClientPreferences> SetAutoStartEnabledAsync(bool enabled, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            state.AutoStartEnabled = enabled;
            return state;
        }, cancellationToken);

    public static Task<ClientPreferences> SetBlockedCountersAsync(int blockedThreats, int blockedAds, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            state.BlockedThreats = Math.Max(0, blockedThreats);
            state.BlockedAds = Math.Max(0, blockedAds);
            return state;
        }, cancellationToken);

    public static Task<ClientPreferences> IncrementBlockedThreatsAsync(int delta = 1, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            state.BlockedThreats = Math.Max(0, state.BlockedThreats + delta);
            return state;
        }, cancellationToken);

    public static Task<ClientPreferences> IncrementBlockedAdsAsync(int delta = 1, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            state.BlockedAds = Math.Max(0, state.BlockedAds + delta);
            return state;
        }, cancellationToken);

    public static Task<ClientPreferences> ApplyRemoteNetworkStateAsync(NetworkProtectionState remoteState, CancellationToken cancellationToken = default) =>
        UpdateAsync(state =>
        {
            var normalizedRemoteState = WindowsNetworkProtectionStateService.Normalize(remoteState);
            state = WindowsNetworkProtectionStateService.ApplyUnifiedToggle(state, normalizedRemoteState.NetworkEnabled);
            state.BlockedThreats = Math.Max(normalizedRemoteState.BlockedThreatsPlatform, normalizedRemoteState.BlockedThreatsTotal);
            state.BlockedAds = Math.Max(normalizedRemoteState.BlockedAdsPlatform, normalizedRemoteState.BlockedAdsTotal);
            state.DeveloperModeEnabled = normalizedRemoteState.DeveloperMode;
            return WindowsNetworkProtectionStateService.Normalize(state);
        }, cancellationToken);

    public static async Task<ClientPreferences> UpdateAsync(
        Func<ClientPreferences, ClientPreferences> mutator,
        CancellationToken cancellationToken = default)
    {
        await Gate.WaitAsync(cancellationToken);
        try
        {
            var current = await ClientPreferencesStore.LoadAsync(cancellationToken);
            var next = WindowsNetworkProtectionStateService.Normalize(mutator(Clone(current)));
            await ClientPreferencesStore.SaveAsync(next, cancellationToken);
            return next;
        }
        finally
        {
            Gate.Release();
        }
    }

    private static ClientPreferences Clone(ClientPreferences source)
    {
        return WindowsNetworkProtectionStateService.Normalize(new ClientPreferences
        {
            ThemeMode = source.ThemeMode,
            DynamicColorsEnabled = source.DynamicColorsEnabled,
            DeveloperModeEnabled = source.DeveloperModeEnabled,
            NetworkProtectionEnabled = source.NetworkProtectionEnabled,
            AdBlockEnabled = source.AdBlockEnabled,
            UnsafeSitesEnabled = source.UnsafeSitesEnabled,
            MinimizeToTrayOnClose = source.MinimizeToTrayOnClose,
            AutoStartEnabled = source.AutoStartEnabled,
            BlockedThreats = source.BlockedThreats,
            BlockedAds = source.BlockedAds
        });
    }
}
