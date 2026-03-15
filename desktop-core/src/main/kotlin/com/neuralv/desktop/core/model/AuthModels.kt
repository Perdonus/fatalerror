package com.neuralv.desktop.core.model

data class SessionUser(
    val id: String,
    val name: String,
    val email: String,
    val isPremium: Boolean = false,
    val isDeveloperMode: Boolean = false
)

data class SessionState(
    val accessToken: String,
    val refreshToken: String,
    val sessionId: String,
    val accessTokenExpiresAt: Long,
    val refreshTokenExpiresAt: Long,
    val user: SessionUser,
    val deviceId: String,
    val backendBaseUrl: String
)

data class ChallengeTicket(
    val challengeId: String,
    val expiresAt: Long,
    val email: String,
    val mode: AuthChallengeMode
)

enum class AuthChallengeMode {
    REGISTER,
    LOGIN
}

data class AuthResponse(
    val success: Boolean,
    val token: String,
    val refreshToken: String,
    val sessionId: String,
    val accessTokenExpiresAt: Long,
    val refreshTokenExpiresAt: Long,
    val user: SessionUser
)
