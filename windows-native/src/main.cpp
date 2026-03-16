#include <windows.h>
#include <commctrl.h>
#include <uxtheme.h>
#include <shellapi.h>
#include <urlmon.h>

#include <cmath>
#include <filesystem>
#include <string>

#include "NeuralV/ApiClient.h"
#include "NeuralV/Config.h"
#include "NeuralV/SessionStore.h"
#include "NeuralV/Theme.h"

#pragma comment(lib, "urlmon.lib")

namespace {

enum class Screen {
    Splash,
    Welcome,
    Login,
    Register,
    Code,
    Home,
    History,
    Settings
};

enum ControlId : int {
    IdName = 1001,
    IdEmail,
    IdPassword,
    IdPasswordRepeat,
    IdCode,
    IdPrimary,
    IdSecondary,
    IdTertiary,
    IdScan,
    IdHistory,
    IdSettings,
    IdLogout
};

struct AppContext {
    HINSTANCE instance = nullptr;
    HWND hwnd = nullptr;
    neuralv::ThemePalette palette{};
    neuralv::ApiClient api{};
    Screen screen = Screen::Splash;
    DWORD splashStartedAt = 0;
    std::wstring deviceId;
    std::wstring status;
    neuralv::ChallengeTicket challenge{};
    neuralv::SessionData session{};
    HFONT titleFont = nullptr;
    HFONT bodyFont = nullptr;
    HFONT smallFont = nullptr;
};

AppContext g_app;

HWND g_name = nullptr;
HWND g_email = nullptr;
HWND g_password = nullptr;
HWND g_passwordRepeat = nullptr;
HWND g_code = nullptr;
HWND g_primary = nullptr;
HWND g_secondary = nullptr;
HWND g_tertiary = nullptr;
HWND g_scan = nullptr;
HWND g_history = nullptr;
HWND g_settings = nullptr;
HWND g_logout = nullptr;

constexpr wchar_t kWindowClass[] = L"NeuralVNativeWindow";
constexpr UINT_PTR kSplashTimer = 1;

RECT GetClientArea(HWND hwnd) {
    RECT rect{};
    GetClientRect(hwnd, &rect);
    return rect;
}

std::wstring ReadControlText(HWND control) {
    const int size = GetWindowTextLengthW(control);
    std::wstring value(size + 1, L'\0');
    GetWindowTextW(control, value.data(), size + 1);
    value.resize(size);
    return value;
}

void ShowControl(HWND hwnd, bool visible) {
    ShowWindow(hwnd, visible ? SW_SHOW : SW_HIDE);
    EnableWindow(hwnd, visible);
}

void ApplyModernControlTheme(HWND hwnd) {
    SetWindowTheme(hwnd, L"Explorer", nullptr);
    SendMessageW(hwnd, WM_SETFONT, reinterpret_cast<WPARAM>(g_app.bodyFont), TRUE);
}

void SetCue(HWND hwnd, const wchar_t* text) {
    SendMessageW(hwnd, EM_SETCUEBANNER, TRUE, reinterpret_cast<LPARAM>(text));
}

void ClearInputs() {
    SetWindowTextW(g_name, L"");
    SetWindowTextW(g_email, L"");
    SetWindowTextW(g_password, L"");
    SetWindowTextW(g_passwordRepeat, L"");
    SetWindowTextW(g_code, L"");
}

bool DownloadFile(const std::wstring& url, const std::wstring& destination) {
    return URLDownloadToFileW(nullptr, url.c_str(), destination.c_str(), 0, nullptr) == S_OK;
}

std::wstring TempFilePath(const std::wstring& fileName) {
    wchar_t buffer[MAX_PATH]{};
    GetTempPathW(MAX_PATH, buffer);
    return std::wstring(buffer) + fileName;
}

void MaybeRunAutoUpdate() {
    const auto update = g_app.api.CheckForUpdate(NEURALV_VERSION_W);
    if (!update.available || update.setupUrl.empty()) {
        return;
    }
    const std::wstring setupPath = TempFilePath(L"NeuralVSetup-latest.exe");
    g_app.status = L"Обновляем NeuralV...";
    InvalidateRect(g_app.hwnd, nullptr, TRUE);
    if (!DownloadFile(update.setupUrl, setupPath)) {
        g_app.status = L"Автообновление недоступно.";
        return;
    }
    ShellExecuteW(g_app.hwnd, L"open", setupPath.c_str(), L"--self-update --no-launch", nullptr, SW_SHOWNORMAL);
    PostQuitMessage(0);
}

void LayoutControls() {
    RECT rect = GetClientArea(g_app.hwnd);
    const int left = 104;
    const int top = 228;
    const int width = 460;
    const int height = 42;
    const int gap = 18;

    MoveWindow(g_name, left, top, width, height, TRUE);
    MoveWindow(g_email, left, top + (height + gap), width, height, TRUE);
    MoveWindow(g_password, left, top + 2 * (height + gap), width, height, TRUE);
    MoveWindow(g_passwordRepeat, left, top + 3 * (height + gap), width, height, TRUE);
    MoveWindow(g_code, left, top + height + gap, width, height, TRUE);

    MoveWindow(g_primary, left, rect.bottom - 176, 220, 46, TRUE);
    MoveWindow(g_secondary, left + 238, rect.bottom - 176, 220, 46, TRUE);
    MoveWindow(g_tertiary, left, rect.bottom - 118, 458, 40, TRUE);

    const int cardTop = 310;
    MoveWindow(g_scan, left, cardTop, 200, 132, TRUE);
    MoveWindow(g_history, left + 220, cardTop, 200, 132, TRUE);
    MoveWindow(g_settings, left + 440, cardTop, 200, 132, TRUE);
    MoveWindow(g_logout, left, rect.bottom - 176, 220, 46, TRUE);
}

void SetScreen(Screen screen) {
    g_app.screen = screen;

    ShowControl(g_name, screen == Screen::Register);
    ShowControl(g_email, screen == Screen::Login || screen == Screen::Register);
    ShowControl(g_password, screen == Screen::Login || screen == Screen::Register);
    ShowControl(g_passwordRepeat, screen == Screen::Register);
    ShowControl(g_code, screen == Screen::Code);

    ShowControl(g_primary, screen == Screen::Welcome || screen == Screen::Login || screen == Screen::Register || screen == Screen::Code || screen == Screen::History || screen == Screen::Settings);
    ShowControl(g_secondary, screen == Screen::Welcome || screen == Screen::Login || screen == Screen::Register || screen == Screen::Code || screen == Screen::History || screen == Screen::Settings);
    ShowControl(g_tertiary, screen == Screen::Code);

    ShowControl(g_scan, screen == Screen::Home);
    ShowControl(g_history, screen == Screen::Home);
    ShowControl(g_settings, screen == Screen::Home);
    ShowControl(g_logout, screen == Screen::Settings);

    switch (screen) {
    case Screen::Welcome:
        SetWindowTextW(g_primary, L"Войти");
        SetWindowTextW(g_secondary, L"Регистрация");
        break;
    case Screen::Login:
    case Screen::Register:
        SetWindowTextW(g_primary, L"Продолжить");
        SetWindowTextW(g_secondary, L"Назад");
        break;
    case Screen::Code:
        SetWindowTextW(g_primary, L"Подтвердить");
        SetWindowTextW(g_secondary, L"Назад");
        SetWindowTextW(g_tertiary, L"Код отправлен");
        break;
    case Screen::History:
    case Screen::Settings:
        SetWindowTextW(g_primary, L"Назад");
        SetWindowTextW(g_secondary, screen == Screen::Settings ? L"Обновить" : L"Скоро");
        break;
    default:
        break;
    }

    InvalidateRect(g_app.hwnd, nullptr, TRUE);
}

void BootstrapAfterSplash() {
    MaybeRunAutoUpdate();
    const auto session = neuralv::LoadSession();
    if (!session) {
        g_app.status = L"Войди в аккаунт, чтобы открыть Windows-клиент.";
        SetScreen(Screen::Welcome);
        return;
    }

    std::wstring error;
    if (const auto refreshed = g_app.api.RefreshSession(*session, error)) {
        g_app.session = *refreshed;
        neuralv::SaveSession(g_app.session);
        g_app.status = L"Сессия восстановлена.";
        SetScreen(Screen::Home);
        return;
    }

    neuralv::ClearSession();
    g_app.status = error.empty() ? L"Сессия устарела. Войди снова." : error;
    SetScreen(Screen::Welcome);
}

void SubmitAuth() {
    if (g_app.screen == Screen::Login) {
        g_app.challenge = g_app.api.StartLogin(ReadControlText(g_email), ReadControlText(g_password), g_app.deviceId);
    } else if (g_app.screen == Screen::Register) {
        if (ReadControlText(g_password) != ReadControlText(g_passwordRepeat)) {
            g_app.status = L"Пароли не совпадают.";
            InvalidateRect(g_app.hwnd, nullptr, TRUE);
            return;
        }
        g_app.challenge = g_app.api.StartRegister(ReadControlText(g_name), ReadControlText(g_email), ReadControlText(g_password), g_app.deviceId);
    }

    if (!g_app.challenge.ok()) {
        g_app.status = g_app.challenge.error.empty() ? L"Не удалось начать авторизацию." : g_app.challenge.error;
        InvalidateRect(g_app.hwnd, nullptr, TRUE);
        return;
    }

    g_app.status = L"Код отправлен на почту.";
    SetScreen(Screen::Code);
}

void VerifyCode() {
    std::wstring error;
    const auto session = g_app.api.VerifyChallenge(g_app.challenge.mode, g_app.challenge.challengeId, g_app.challenge.email, ReadControlText(g_code), g_app.deviceId, error);
    if (!session) {
        g_app.status = error.empty() ? L"Код не принят." : error;
        InvalidateRect(g_app.hwnd, nullptr, TRUE);
        return;
    }

    g_app.session = *session;
    neuralv::SaveSession(g_app.session);
    g_app.status = L"Вход выполнен.";
    ClearInputs();
    SetScreen(Screen::Home);
}

void Logout() {
    g_app.api.Logout(g_app.session);
    neuralv::ClearSession();
    g_app.session = {};
    g_app.status = L"Сессия закрыта.";
    ClearInputs();
    SetScreen(Screen::Welcome);
}

void DrawCard(HDC hdc, const RECT& rect) {
    HBRUSH brush = CreateSolidBrush(g_app.palette.surface);
    HBRUSH outlineBrush = CreateSolidBrush(g_app.palette.outline);
    FrameRect(hdc, &rect, outlineBrush);
    RECT inner = rect;
    InflateRect(&inner, -1, -1);
    FillRect(hdc, &inner, brush);
    DeleteObject(brush);
    DeleteObject(outlineBrush);
}

void PaintSplash(HDC hdc, const RECT& rect) {
    const double t = (GetTickCount() - g_app.splashStartedAt) / 1000.0;
    const int cx = (rect.right - rect.left) / 2;
    const int cy = (rect.bottom - rect.top) / 2 - 18;
    const int outer = 122 + static_cast<int>(std::sin(t * 4.0) * 12.0);
    const int inner = 76 + static_cast<int>(std::sin(t * 5.7) * 8.0);

    HBRUSH outerBrush = CreateSolidBrush(neuralv::BlendColor(g_app.palette.accent, g_app.palette.background, 0.52));
    HBRUSH innerBrush = CreateSolidBrush(g_app.palette.accent);
    SelectObject(hdc, outerBrush);
    Ellipse(hdc, cx - outer, cy - outer, cx + outer, cy + outer);
    SelectObject(hdc, innerBrush);
    Ellipse(hdc, cx - inner, cy - inner, cx + inner, cy + inner);
    DeleteObject(outerBrush);
    DeleteObject(innerBrush);

    RECT title{ rect.left, cy + 126, rect.right, cy + 180 };
    SelectObject(hdc, g_app.titleFont);
    SetTextColor(hdc, g_app.palette.text);
    SetBkMode(hdc, TRANSPARENT);
    DrawTextW(hdc, L"NeuralV", -1, &title, DT_CENTER | DT_SINGLELINE);
}

void PaintWindow(HWND hwnd) {
    PAINTSTRUCT ps{};
    HDC hdc = BeginPaint(hwnd, &ps);
    RECT rect = GetClientArea(hwnd);

    HBRUSH background = CreateSolidBrush(g_app.palette.background);
    FillRect(hdc, &rect, background);
    DeleteObject(background);

    SetBkMode(hdc, TRANSPARENT);
    if (g_app.screen == Screen::Splash) {
        PaintSplash(hdc, rect);
        EndPaint(hwnd, &ps);
        return;
    }

    RECT card{ 72, 72, rect.right - 72, rect.bottom - 72 };
    DrawCard(hdc, card);

    RECT title{ 104, 104, rect.right - 104, 152 };
    SelectObject(hdc, g_app.titleFont);
    SetTextColor(hdc, g_app.palette.text);
    DrawTextW(hdc, L"NeuralV", -1, &title, DT_LEFT | DT_SINGLELINE);

    RECT subtitle{ 104, 156, rect.right - 104, 196 };
    SelectObject(hdc, g_app.bodyFont);
    SetTextColor(hdc, g_app.palette.textMuted);
    std::wstring subtitleText;
    switch (g_app.screen) {
    case Screen::Welcome: subtitleText = L"Windows Native Client"; break;
    case Screen::Login: subtitleText = L"Вход"; break;
    case Screen::Register: subtitleText = L"Регистрация"; break;
    case Screen::Code: subtitleText = L"Код из почты"; break;
    case Screen::Home: subtitleText = g_app.session.user.name.empty() ? L"Главный экран" : g_app.session.user.name; break;
    case Screen::History: subtitleText = L"История"; break;
    case Screen::Settings: subtitleText = L"Настройки"; break;
    default: break;
    }
    DrawTextW(hdc, subtitleText.c_str(), -1, &subtitle, DT_LEFT | DT_SINGLELINE);

    RECT copy{ 104, 210, rect.right - 104, 288 };
    std::wstring text;
    switch (g_app.screen) {
    case Screen::Welcome:
        text = L"Выбери вход или регистрацию. Этот клиент уже работает без JVM и тянет тему из Windows.";
        break;
    case Screen::Login:
        text = L"Введи почту и пароль. После этого придёт код на почту.";
        break;
    case Screen::Register:
        text = L"Создай аккаунт: имя, почта и пароль. После этого подтверди код из письма.";
        break;
    case Screen::Code:
        text = L"Введи код из письма и нажми Enter.";
        break;
    case Screen::Home:
        text = L"Авторизация, сессия и автообновление уже работают нативно. Локальный scan engine переносится следующим шагом поверх этого клиента.";
        break;
    case Screen::History:
        text = L"Экран истории уже выделен под native-клиент. Подтянем отчёты после перевода desktop scan flow.";
        break;
    case Screen::Settings:
        text = L"Тема берётся из Windows автоматически. Отсюда уже работает выход, а следующим шагом зайдут обновления и resident-поведение.";
        break;
    default:
        break;
    }
    DrawTextW(hdc, text.c_str(), -1, &copy, DT_LEFT | DT_WORDBREAK);

    if (!g_app.status.empty()) {
        RECT status{ 104, rect.bottom - 248, rect.right - 104, rect.bottom - 212 };
        SelectObject(hdc, g_app.smallFont);
        SetTextColor(hdc, g_app.palette.textMuted);
        DrawTextW(hdc, g_app.status.c_str(), -1, &status, DT_LEFT | DT_WORDBREAK);
    }

    EndPaint(hwnd, &ps);
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_CREATE: {
        g_app.hwnd = hwnd;
        g_app.palette = neuralv::LoadThemePalette();
        g_app.deviceId = neuralv::EnsureDeviceId();
        g_app.splashStartedAt = GetTickCount();
        INITCOMMONCONTROLSEX common{};
        common.dwSize = sizeof(common);
        common.dwICC = ICC_STANDARD_CLASSES;
        InitCommonControlsEx(&common);

        g_app.titleFont = CreateFontW(38, 0, 0, 0, FW_SEMIBOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");
        g_app.bodyFont = CreateFontW(20, 0, 0, 0, FW_MEDIUM, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");
        g_app.smallFont = CreateFontW(15, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");

        g_name = CreateWindowExW(WS_EX_CLIENTEDGE, L"EDIT", nullptr, WS_CHILD | WS_TABSTOP | ES_AUTOHSCROLL, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdName), g_app.instance, nullptr);
        g_email = CreateWindowExW(WS_EX_CLIENTEDGE, L"EDIT", nullptr, WS_CHILD | WS_TABSTOP | ES_AUTOHSCROLL, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdEmail), g_app.instance, nullptr);
        g_password = CreateWindowExW(WS_EX_CLIENTEDGE, L"EDIT", nullptr, WS_CHILD | WS_TABSTOP | ES_AUTOHSCROLL | ES_PASSWORD, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdPassword), g_app.instance, nullptr);
        g_passwordRepeat = CreateWindowExW(WS_EX_CLIENTEDGE, L"EDIT", nullptr, WS_CHILD | WS_TABSTOP | ES_AUTOHSCROLL | ES_PASSWORD, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdPasswordRepeat), g_app.instance, nullptr);
        g_code = CreateWindowExW(WS_EX_CLIENTEDGE, L"EDIT", nullptr, WS_CHILD | WS_TABSTOP | ES_AUTOHSCROLL, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdCode), g_app.instance, nullptr);

        g_primary = CreateWindowExW(0, L"BUTTON", L"", WS_CHILD | WS_TABSTOP | BS_PUSHBUTTON, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdPrimary), g_app.instance, nullptr);
        g_secondary = CreateWindowExW(0, L"BUTTON", L"", WS_CHILD | WS_TABSTOP | BS_PUSHBUTTON, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdSecondary), g_app.instance, nullptr);
        g_tertiary = CreateWindowExW(0, L"BUTTON", L"", WS_CHILD | WS_TABSTOP | BS_PUSHBUTTON, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdTertiary), g_app.instance, nullptr);
        g_scan = CreateWindowExW(0, L"BUTTON", L"Проверка", WS_CHILD | WS_TABSTOP | BS_PUSHBUTTON, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdScan), g_app.instance, nullptr);
        g_history = CreateWindowExW(0, L"BUTTON", L"История", WS_CHILD | WS_TABSTOP | BS_PUSHBUTTON, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdHistory), g_app.instance, nullptr);
        g_settings = CreateWindowExW(0, L"BUTTON", L"Настройки", WS_CHILD | WS_TABSTOP | BS_PUSHBUTTON, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdSettings), g_app.instance, nullptr);
        g_logout = CreateWindowExW(0, L"BUTTON", L"Выйти", WS_CHILD | WS_TABSTOP | BS_PUSHBUTTON, 0, 0, 0, 0, hwnd, reinterpret_cast<HMENU>(IdLogout), g_app.instance, nullptr);

        for (HWND control : { g_name, g_email, g_password, g_passwordRepeat, g_code, g_primary, g_secondary, g_tertiary, g_scan, g_history, g_settings, g_logout }) {
            ApplyModernControlTheme(control);
        }
        SetCue(g_name, L"Имя");
        SetCue(g_email, L"Email");
        SetCue(g_password, L"Пароль");
        SetCue(g_passwordRepeat, L"Повтори пароль");
        SetCue(g_code, L"Код из письма");

        LayoutControls();
        SetScreen(Screen::Splash);
        SetTimer(hwnd, kSplashTimer, 16, nullptr);
        return 0;
    }
    case WM_SIZE:
        LayoutControls();
        return 0;
    case WM_TIMER:
        if (wParam == kSplashTimer) {
            InvalidateRect(hwnd, nullptr, TRUE);
            if (GetTickCount() - g_app.splashStartedAt >= 1100) {
                KillTimer(hwnd, kSplashTimer);
                BootstrapAfterSplash();
            }
        }
        return 0;
    case WM_KEYDOWN:
        if (wParam == VK_ESCAPE) {
            if (g_app.screen == Screen::Login || g_app.screen == Screen::Register || g_app.screen == Screen::Code) {
                SetScreen(Screen::Welcome);
                return 0;
            }
            if (g_app.screen == Screen::History || g_app.screen == Screen::Settings) {
                SetScreen(Screen::Home);
                return 0;
            }
        }
        if (wParam == VK_RETURN) {
            if (g_app.screen == Screen::Login || g_app.screen == Screen::Register) {
                SubmitAuth();
                return 0;
            }
            if (g_app.screen == Screen::Code) {
                VerifyCode();
                return 0;
            }
        }
        break;
    case WM_COMMAND:
        switch (LOWORD(wParam)) {
        case IdPrimary:
            if (g_app.screen == Screen::Welcome) SetScreen(Screen::Login);
            else if (g_app.screen == Screen::Login || g_app.screen == Screen::Register) SubmitAuth();
            else if (g_app.screen == Screen::Code) VerifyCode();
            else if (g_app.screen == Screen::History || g_app.screen == Screen::Settings) SetScreen(Screen::Home);
            return 0;
        case IdSecondary:
            if (g_app.screen == Screen::Welcome) SetScreen(Screen::Register);
            else if (g_app.screen == Screen::Login || g_app.screen == Screen::Register || g_app.screen == Screen::Code) SetScreen(Screen::Welcome);
            else if (g_app.screen == Screen::Settings) MaybeRunAutoUpdate();
            return 0;
        case IdScan:
            g_app.status = L"Native scan engine будет следующим патчем поверх этого окна.";
            InvalidateRect(hwnd, nullptr, TRUE);
            return 0;
        case IdHistory:
            SetScreen(Screen::History);
            return 0;
        case IdSettings:
            SetScreen(Screen::Settings);
            return 0;
        case IdLogout:
            Logout();
            return 0;
        default:
            break;
        }
        break;
    case WM_CTLCOLOREDIT:
    case WM_CTLCOLORSTATIC: {
        HDC hdc = reinterpret_cast<HDC>(wParam);
        SetBkColor(hdc, g_app.palette.surface);
        SetTextColor(hdc, g_app.palette.text);
        static HBRUSH brush = CreateSolidBrush(g_app.palette.surface);
        return reinterpret_cast<LRESULT>(brush);
    }
    case WM_PAINT:
        PaintWindow(hwnd);
        return 0;
    case WM_DESTROY:
        DeleteObject(g_app.titleFont);
        DeleteObject(g_app.bodyFont);
        DeleteObject(g_app.smallFont);
        PostQuitMessage(0);
        return 0;
    default:
        break;
    }

    return DefWindowProcW(hwnd, message, wParam, lParam);
}

} // namespace

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR, int showCommand) {
    g_app.instance = instance;

    WNDCLASSW windowClass{};
    windowClass.lpfnWndProc = WindowProc;
    windowClass.hInstance = instance;
    windowClass.lpszClassName = kWindowClass;
    windowClass.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    RegisterClassW(&windowClass);

    HWND hwnd = CreateWindowExW(
        0,
        kWindowClass,
        L"NeuralV",
        WS_OVERLAPPEDWINDOW | WS_VISIBLE,
        CW_USEDEFAULT,
        CW_USEDEFAULT,
        1120,
        780,
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

    return static_cast<int>(message.wParam);
}
