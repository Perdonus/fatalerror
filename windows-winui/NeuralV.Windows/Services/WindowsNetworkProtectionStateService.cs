using System.Globalization;
using NeuralV.Windows.Models;

namespace NeuralV.Windows.Services;

public static class WindowsNetworkProtectionStateService
{
    public static ClientPreferences Normalize(ClientPreferences preferences)
    {
        var unifiedEnabled = preferences.NetworkProtectionEnabled || preferences.AdBlockEnabled || preferences.UnsafeSitesEnabled;
        preferences.NetworkProtectionEnabled = unifiedEnabled;
        preferences.AdBlockEnabled = unifiedEnabled;
        preferences.UnsafeSitesEnabled = unifiedEnabled;
        preferences.BlockedThreats = Math.Max(0, preferences.BlockedThreats);
        preferences.BlockedAds = Math.Max(0, preferences.BlockedAds);
        return preferences;
    }

    public static ClientPreferences ApplyUnifiedToggle(ClientPreferences preferences, bool enabled)
    {
        preferences.NetworkProtectionEnabled = enabled;
        preferences.AdBlockEnabled = enabled;
        preferences.UnsafeSitesEnabled = enabled;
        return preferences;
    }

    public static NetworkProtectionState Normalize(NetworkProtectionState state)
    {
        var unifiedEnabled = state.NetworkEnabled || state.AdBlockEnabled || state.UnsafeSitesEnabled;
        var localEnforcementAvailable = state.LocalEnforcementAvailable;
        var effectiveEnabled = unifiedEnabled && localEnforcementAvailable && state.LocalEnforcementActive;

        return new NetworkProtectionState
        {
            Mode = string.IsNullOrWhiteSpace(state.Mode) ? "unified" : state.Mode,
            Platform = string.IsNullOrWhiteSpace(state.Platform) ? "windows" : state.Platform,
            NetworkEnabled = unifiedEnabled,
            AdBlockEnabled = unifiedEnabled,
            UnsafeSitesEnabled = unifiedEnabled,
            BlockedAdsTotal = Math.Max(0, state.BlockedAdsTotal),
            BlockedThreatsTotal = Math.Max(0, state.BlockedThreatsTotal),
            BlockedAdsPlatform = Math.Max(0, state.BlockedAdsPlatform),
            BlockedThreatsPlatform = Math.Max(0, state.BlockedThreatsPlatform),
            DeveloperMode = state.DeveloperMode,
            LocalEnforcementAvailable = localEnforcementAvailable,
            LocalEnforcementActive = effectiveEnabled,
            EffectiveEnabled = effectiveEnabled,
            StatusMessage = BuildStatusMessage(unifiedEnabled, localEnforcementAvailable, effectiveEnabled, state.StatusMessage)
        };
    }

    public static string FormatCounter(int value) =>
        Math.Max(0, value).ToString("N0", CultureInfo.GetCultureInfo("ru-RU"));

    private static string BuildStatusMessage(bool requestedEnabled, bool localEnforcementAvailable, bool effectiveEnabled, string existingMessage)
    {
        if (!string.IsNullOrWhiteSpace(existingMessage))
        {
            return existingMessage;
        }

        if (!requestedEnabled)
        {
            return "Защита в сети выключена";
        }

        if (!localEnforcementAvailable)
        {
            return "Локальная фильтрация пока не активна";
        }

        return effectiveEnabled
            ? "Защита в сети активна"
            : "Защита в сети готовится";
    }
}
