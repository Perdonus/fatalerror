#pragma once

#include <optional>
#include <string>

namespace neuralv {

struct SessionUser {
    std::wstring id;
    std::wstring name;
    std::wstring email;
    bool isPremium = false;
    bool isDeveloper = false;
};

struct SessionData {
    std::wstring accessToken;
    std::wstring refreshToken;
    std::wstring sessionId;
    long long accessTokenExpiresAt = 0;
    long long refreshTokenExpiresAt = 0;
    std::wstring deviceId;
    SessionUser user;

    bool IsValid() const {
        return !accessToken.empty() && !refreshToken.empty() && !sessionId.empty();
    }
};

std::wstring Utf8ToWide(const std::string& value);
std::string WideToUtf8(const std::wstring& value);
std::wstring GetAppDataDirectory();
std::wstring GetSessionFilePath();
std::wstring EnsureDeviceId();
bool SaveSession(const SessionData& session);
std::optional<SessionData> LoadSession();
void ClearSession();

} // namespace neuralv
