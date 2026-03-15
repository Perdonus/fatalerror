package com.neuralv.desktop.core.model

data class RegisterStartRequest(
    val name: String,
    val email: String,
    val password: String,
    val deviceId: String
)

data class LoginStartRequest(
    val email: String,
    val password: String,
    val deviceId: String
)

data class VerifyChallengeRequest(
    val challengeId: String,
    val email: String,
    val code: String,
    val deviceId: String
)

data class RefreshSessionRequest(
    val refreshToken: String,
    val sessionId: String,
    val deviceId: String
)

data class DesktopStartScanRequest(
    val platform: DesktopPlatform,
    val mode: DesktopScanMode,
    val artifactKind: DesktopArtifactKind? = null,
    val artifactMetadata: Map<String, Any?> = emptyMap(),
    val localFindings: List<String> = emptyList(),
    val sha256: String? = null
)
