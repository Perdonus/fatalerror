#include "NeuralV/Theme.h"

#include <algorithm>
#include <dwmapi.h>
#include <winreg.h>

namespace neuralv {

namespace {

COLORREF ReadAccentColor() {
    DWORD value = 0;
    DWORD size = sizeof(value);
    if (RegGetValueW(HKEY_CURRENT_USER, L"Software\\Microsoft\\Windows\\DWM", L"ColorizationColor", RRF_RT_REG_DWORD, nullptr, &value, &size) == ERROR_SUCCESS) {
        const BYTE a = static_cast<BYTE>((value >> 24) & 0xFF);
        const BYTE r = static_cast<BYTE>((value >> 16) & 0xFF);
        const BYTE g = static_cast<BYTE>((value >> 8) & 0xFF);
        const BYTE b = static_cast<BYTE>(value & 0xFF);
        if (a > 0) {
            return RGB(r, g, b);
        }
    }
    return RGB(82, 102, 255);
}

bool IsDarkMode() {
    DWORD value = 1;
    DWORD size = sizeof(value);
    if (RegGetValueW(HKEY_CURRENT_USER, L"Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize", L"AppsUseLightTheme", RRF_RT_REG_DWORD, nullptr, &value, &size) == ERROR_SUCCESS) {
        return value == 0;
    }
    return false;
}

} // namespace

COLORREF BlendColor(COLORREF from, COLORREF to, double ratio) {
    ratio = std::clamp(ratio, 0.0, 1.0);
    const auto blend = [ratio](BYTE a, BYTE b) -> BYTE {
        return static_cast<BYTE>(a + (b - a) * ratio);
    };
    return RGB(
        blend(GetRValue(from), GetRValue(to)),
        blend(GetGValue(from), GetGValue(to)),
        blend(GetBValue(from), GetBValue(to))
    );
}

ThemePalette LoadThemePalette() {
    ThemePalette palette;
    palette.dark = IsDarkMode();
    palette.accent = ReadAccentColor();

    if (palette.dark) {
        palette.background = RGB(18, 19, 24);
        palette.surface = RGB(28, 30, 38);
        palette.surfaceRaised = RGB(35, 37, 48);
        palette.text = RGB(241, 242, 247);
        palette.textMuted = RGB(168, 172, 189);
        palette.outline = RGB(75, 80, 98);
    }

    palette.accentSoft = BlendColor(palette.accent, palette.surface, palette.dark ? 0.72 : 0.82);
    return palette;
}

} // namespace neuralv
