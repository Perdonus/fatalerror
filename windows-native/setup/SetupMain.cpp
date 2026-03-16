#include <windows.h>
#include <shellapi.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <urlmon.h>

#include <filesystem>
#include <string>

#include "NeuralV/Config.h"

#pragma comment(lib, "urlmon.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "shlwapi.lib")

namespace {

std::wstring TempPathFor(const std::wstring& name) {
    wchar_t path[MAX_PATH]{};
    GetTempPathW(MAX_PATH, path);
    return std::wstring(path) + name;
}

std::wstring LocalInstallDir() {
    PWSTR raw = nullptr;
    if (SHGetKnownFolderPath(FOLDERID_LocalAppData, KF_FLAG_CREATE, nullptr, &raw) != S_OK || raw == nullptr) {
        return L".\\NeuralV";
    }
    std::wstring base(raw);
    CoTaskMemFree(raw);
    return (std::filesystem::path(base) / L"Programs" / L"NeuralV").wstring();
}

bool RunHidden(const std::wstring& commandLine) {
    STARTUPINFOW startup{};
    startup.cb = sizeof(startup);
    PROCESS_INFORMATION info{};
    std::wstring mutableCommand = commandLine;
    const BOOL ok = CreateProcessW(nullptr, mutableCommand.data(), nullptr, nullptr, FALSE, CREATE_NO_WINDOW, nullptr, nullptr, &startup, &info);
    if (!ok) {
        return false;
    }
    WaitForSingleObject(info.hProcess, INFINITE);
    DWORD exitCode = 1;
    GetExitCodeProcess(info.hProcess, &exitCode);
    CloseHandle(info.hThread);
    CloseHandle(info.hProcess);
    return exitCode == 0;
}

bool ExtractZip(const std::wstring& zipPath, const std::wstring& destination) {
    std::filesystem::create_directories(destination);
    const std::wstring command =
        L"powershell -NoProfile -ExecutionPolicy Bypass -Command \"Expand-Archive -Force -LiteralPath '" + zipPath +
        L"' -DestinationPath '" + destination + L"'\"";
    return RunHidden(command);
}

bool CopyPortablePayload(const std::wstring& extractedDir, const std::wstring& installDir) {
    std::error_code error;
    std::filesystem::remove_all(installDir, error);
    std::filesystem::create_directories(installDir);
    for (const auto& entry : std::filesystem::directory_iterator(extractedDir, error)) {
        if (error) {
            return false;
        }
        std::filesystem::copy(entry.path(), std::filesystem::path(installDir) / entry.path().filename(), std::filesystem::copy_options::recursive | std::filesystem::copy_options::overwrite_existing, error);
        if (error) {
            return false;
        }
    }
    return std::filesystem::exists(std::filesystem::path(installDir) / L"NeuralV.exe");
}

} // namespace

int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR commandLine, int) {
    const bool noLaunch = commandLine && std::wstring(commandLine).find(L"--no-launch") != std::wstring::npos;
    MessageBoxW(nullptr, L"NeuralV Setup скачает и установит последнюю Windows-сборку в LocalAppData.", L"NeuralV Setup", MB_OK | MB_ICONINFORMATION);

    const std::wstring zipPath = TempPathFor(L"neuralv-windows.zip");
    const std::wstring extractDir = TempPathFor(L"neuralv-extract");
    const std::wstring installDir = LocalInstallDir();

    if (URLDownloadToFileW(nullptr, NEURALV_WINDOWS_PORTABLE_URL, zipPath.c_str(), 0, nullptr) != S_OK) {
        MessageBoxW(nullptr, L"Не удалось скачать portable-архив NeuralV.", L"NeuralV Setup", MB_OK | MB_ICONERROR);
        return 1;
    }
    if (!ExtractZip(zipPath, extractDir)) {
        MessageBoxW(nullptr, L"Не удалось распаковать NeuralV.", L"NeuralV Setup", MB_OK | MB_ICONERROR);
        return 1;
    }
    if (!CopyPortablePayload(extractDir, installDir)) {
        MessageBoxW(nullptr, L"Не удалось разложить файлы NeuralV.", L"NeuralV Setup", MB_OK | MB_ICONERROR);
        return 1;
    }

    const std::wstring exePath = (std::filesystem::path(installDir) / L"NeuralV.exe").wstring();
    if (!noLaunch) {
        ShellExecuteW(nullptr, L"open", exePath.c_str(), nullptr, installDir.c_str(), SW_SHOWNORMAL);
    }

    MessageBoxW(nullptr, L"NeuralV установлен.", L"NeuralV Setup", MB_OK | MB_ICONINFORMATION);
    return 0;
}
