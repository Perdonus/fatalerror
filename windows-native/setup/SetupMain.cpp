#include <windows.h>
#include <shellapi.h>

#include <string>

#include "NeuralV/Config.h"

namespace {

std::wstring BuildPowerShellArguments() {
    std::wstring command =
        L"-NoProfile -ExecutionPolicy Bypass -Command \"irm " +
        std::wstring(NEURALV_WINDOWS_PS1_URL) +
        L" | iex\"";
    return command;
}

} // namespace

int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR, int) {
    const auto args = BuildPowerShellArguments();
    HINSTANCE result = ShellExecuteW(
        nullptr,
        L"open",
        L"powershell.exe",
        args.c_str(),
        nullptr,
        SW_SHOWNORMAL
    );

    return reinterpret_cast<INT_PTR>(result) > 32 ? 0 : 1;
}
