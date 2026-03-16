#include <windows.h>

#include <string>

#include "NeuralV/Config.h"
#include "NeuralV/SessionStore.h"
#include "NeuralV/Theme.h"

namespace {

constexpr wchar_t kWindowClass[] = L"NeuralVNativeWindow";

neuralv::ThemePalette g_palette;

void PaintWindow(HWND hwnd) {
    PAINTSTRUCT ps{};
    HDC hdc = BeginPaint(hwnd, &ps);

    RECT rect{};
    GetClientRect(hwnd, &rect);

    HBRUSH backgroundBrush = CreateSolidBrush(g_palette.background);
    FillRect(hdc, &rect, backgroundBrush);
    DeleteObject(backgroundBrush);

    RECT card = rect;
    InflateRect(&card, -48, -48);
    HBRUSH cardBrush = CreateSolidBrush(g_palette.surface);
    FillRect(hdc, &card, cardBrush);
    DeleteObject(cardBrush);

    SetBkMode(hdc, TRANSPARENT);
    SetTextColor(hdc, g_palette.text);

    HFONT titleFont = CreateFontW(
        42, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
        DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI"
    );
    HFONT bodyFont = CreateFontW(
        18, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
        DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI"
    );

    const auto oldFont = SelectObject(hdc, titleFont);
    RECT titleRect = card;
    titleRect.left += 36;
    titleRect.top += 28;
    DrawTextW(hdc, L"NeuralV", -1, &titleRect, DT_LEFT | DT_TOP | DT_SINGLELINE);

    SelectObject(hdc, bodyFont);
    SetTextColor(hdc, g_palette.textMuted);
    RECT bodyRect = card;
    bodyRect.left += 36;
    bodyRect.top += 92;
    bodyRect.right -= 36;

    std::wstring message =
        L"Windows native rewrite in progress.\n"
        L"Version: " NEURALV_VERSION_W L"\n"
        L"Session file: " + neuralv::GetSessionFilePath() + L"\n"
        L"Device ID prepared: " + neuralv::EnsureDeviceId();

    DrawTextW(hdc, message.c_str(), -1, &bodyRect, DT_LEFT | DT_TOP | DT_WORDBREAK);

    SelectObject(hdc, oldFont);
    DeleteObject(titleFont);
    DeleteObject(bodyFont);

    EndPaint(hwnd, &ps);
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_PAINT:
        PaintWindow(hwnd);
        return 0;
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    default:
        return DefWindowProcW(hwnd, message, wParam, lParam);
    }
}

} // namespace

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR, int showCommand) {
    g_palette = neuralv::LoadThemePalette();

    WNDCLASSW windowClass{};
    windowClass.lpfnWndProc = WindowProc;
    windowClass.hInstance = instance;
    windowClass.lpszClassName = kWindowClass;
    windowClass.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    windowClass.hbrBackground = CreateSolidBrush(g_palette.background);

    RegisterClassW(&windowClass);

    HWND hwnd = CreateWindowExW(
        0,
        kWindowClass,
        L"NeuralV",
        WS_OVERLAPPEDWINDOW | WS_VISIBLE,
        CW_USEDEFAULT,
        CW_USEDEFAULT,
        980,
        720,
        nullptr,
        nullptr,
        instance,
        nullptr
    );

    if (!hwnd) {
        return 1;
    }

    ShowWindow(hwnd, showCommand);
    UpdateWindow(hwnd);

    MSG message{};
    while (GetMessageW(&message, nullptr, 0, 0)) {
        TranslateMessage(&message);
        DispatchMessageW(&message);
    }

    return 0;
}
