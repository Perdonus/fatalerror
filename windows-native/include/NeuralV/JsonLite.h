#pragma once

#include <optional>
#include <regex>
#include <string>

namespace neuralv {

inline std::optional<std::string> FindJsonString(const std::string& body, const std::string& key) {
    const std::regex pattern("\\\"" + key + "\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"");
    std::smatch match;
    if (std::regex_search(body, match, pattern) && match.size() > 1) {
        return match[1].str();
    }
    return std::nullopt;
}

inline std::optional<long long> FindJsonInt64(const std::string& body, const std::string& key) {
    const std::regex pattern("\\\"" + key + "\\\"\\s*:\\s*([0-9]+)");
    std::smatch match;
    if (std::regex_search(body, match, pattern) && match.size() > 1) {
        return std::stoll(match[1].str());
    }
    return std::nullopt;
}

inline std::string EscapeJson(const std::string& value) {
    std::string out;
    out.reserve(value.size() + 8);
    for (const char ch : value) {
        switch (ch) {
        case '\\': out += "\\\\"; break;
        case '"': out += "\\\""; break;
        case '\n': out += "\\n"; break;
        case '\r': out += "\\r"; break;
        case '\t': out += "\\t"; break;
        default: out.push_back(ch); break;
        }
    }
    return out;
}

} // namespace neuralv
