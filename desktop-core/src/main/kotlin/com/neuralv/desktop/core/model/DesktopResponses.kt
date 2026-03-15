package com.neuralv.desktop.core.model

data class ChallengeResponse(
    val success: Boolean = false,
    val challengeId: String? = null,
    val expiresAt: Long? = null,
    val email: String? = null,
    val error: String? = null
)

data class SessionEnvelope(
    val success: Boolean = false,
    val token: String? = null,
    val refreshToken: String? = null,
    val sessionId: String? = null,
    val accessTokenExpiresAt: Long? = null,
    val refreshTokenExpiresAt: Long? = null,
    val user: SessionUser? = null,
    val error: String? = null
)

data class DesktopScanEnvelope(
    val success: Boolean = false,
    val scan: DesktopScanTransport? = null,
    val error: String? = null
)

data class DesktopFullReportEnvelope(
    val success: Boolean = false,
    val reports: List<DesktopScanTransport> = emptyList(),
    val invalidIds: List<String> = emptyList(),
    val missingIds: List<String> = emptyList(),
    val error: String? = null
)

data class ReleaseManifestEnvelope(
    val success: Boolean = false,
    val generatedAt: Long = 0,
    val artifacts: List<ReleaseArtifact> = emptyList(),
    val error: String? = null
)

data class DesktopScanTransport(
    val id: String,
    val platform: String? = null,
    val mode: String? = null,
    val status: String = "QUEUED",
    val verdict: String? = null,
    val riskScore: Int? = null,
    val surfacedFindings: Int? = null,
    val hiddenFindings: Int? = null,
    val startedAt: Long? = null,
    val completedAt: Long? = null,
    val message: String? = null,
    val findings: List<DesktopFinding> = emptyList(),
    val timeline: List<String> = emptyList()
)
