#pragma once

#include <windows.h>

namespace neuralv {

struct ThemePalette {
    bool dark = false;
    COLORREF accent = RGB(82, 102, 255);
    COLORREF accentSoft = RGB(210, 216, 255);
    COLORREF background = RGB(250, 248, 255);
    COLORREF surface = RGB(255, 255, 255);
    COLORREF surfaceRaised = RGB(243, 239, 252);
    COLORREF text = RGB(26, 27, 31);
    COLORREF textMuted = RGB(98, 101, 115);
    COLORREF outline = RGB(207, 209, 220);
    COLORREF success = RGB(35, 138, 79);
    COLORREF warning = RGB(188, 110, 24);
    COLORREF danger = RGB(191, 55, 65);
};

ThemePalette LoadThemePalette();
COLORREF BlendColor(COLORREF from, COLORREF to, double ratio);

} // namespace neuralv
