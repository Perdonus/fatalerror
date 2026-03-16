#pragma once

#include <optional>
#include <string>
#include <vector>

#include "NeuralV/SessionStore.h"

namespace neuralv {

enum class ChallengeMode {
    Login,
    Register
};

struct ChallengeTicket {
    ChallengeMode mode = ChallengeMode::Login;
    std::wstring challengeId;
    std::wstring email;
    long long expiresAt = 0;
    std::wstring error;

    bool ok() const { return error.empty() && !challengeId.empty(); }
};

struct UpdateInfo {
    bool available = false;
    std::wstring latestVersion;
    std::wstring setupUrl;
    std::wstring error;
};

class ApiClient {
public:
    ChallengeTicket StartLogin(const std::wstring& email, const std::wstring& password, const std::wstring& deviceId) const;
    ChallengeTicket StartRegister(const std::wstring& name, const std::wstring& email, const std::wstring& password, const std::wstring& deviceId) const;
    std::optional<SessionData> VerifyChallenge(ChallengeMode mode, const std::wstring& challengeId, const std::wstring& email, const std::wstring& code, const std::wstring& deviceId, std::wstring& error) const;
    std::optional<SessionData> RefreshSession(const SessionData& current, std::wstring& error) const;
    bool Logout(const SessionData& current) const;
    UpdateInfo CheckForUpdate(const std::wstring& currentVersion) const;

private:
    struct HttpResult {
        int statusCode = 0;
        std::string body;
        std::wstring error;
        bool ok() const { return error.empty(); }
    };

    HttpResult JsonRequest(const std::wstring& method, const std::wstring& path, const std::string& bodyUtf8, const std::vector<std::pair<std::wstring, std::wstring>>& headers = {}) const;
    std::optional<SessionData> ParseSession(const std::string& body, const std::wstring& deviceId, std::wstring& error) const;
};

} // namespace neuralv
