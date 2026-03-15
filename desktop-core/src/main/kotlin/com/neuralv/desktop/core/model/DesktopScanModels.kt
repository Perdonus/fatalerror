package com.neuralv.desktop.core.model

enum class DesktopPlatform {
    WINDOWS,
    LINUX
}

enum class DesktopScanMode {
    QUICK,
    FULL,
    SELECTIVE,
    ARTIFACT
}

enum class DesktopArtifactKind {
    EXECUTABLE,
    LIBRARY,
    PACKAGE,
    SCRIPT,
    ARCHIVE,
    UNKNOWN
}

enum class ThreatVerdict {
    CLEAN,
    LOW_RISK,
    SUSPICIOUS,
    MALICIOUS,
    UNKNOWN
}

data class DesktopArtifactSummary(
    val id: String,
    val displayName: String,
    val path: String,
    val sha256: String? = null,
    val sizeBytes: Long? = null,
    val signer: String? = null,
    val packageOrigin: String? = null,
    val isSystemManaged: Boolean = false,
    val riskScore: Int = 0,
    val verdict: ThreatVerdict = ThreatVerdict.UNKNOWN,
    val reasons: List<String> = emptyList()
)

data class DesktopFinding(
    val id: String,
    val title: String,
    val verdict: ThreatVerdict,
    val riskScore: Int,
    val summary: String,
    val evidence: List<String> = emptyList(),
    val artifact: DesktopArtifactSummary? = null,
    val engines: List<String> = emptyList()
)

data class DesktopScanSummary(
    val scanId: String,
    val platform: DesktopPlatform,
    val mode: DesktopScanMode,
    val status: String,
    val startedAt: Long,
    val completedAt: Long? = null,
    val totalArtifacts: Int = 0,
    val surfacedFindings: Int = 0,
    val hiddenFindings: Int = 0,
    val message: String? = null
)

data class DesktopScanResult(
    val summary: DesktopScanSummary,
    val findings: List<DesktopFinding>,
    val timeline: List<String> = emptyList()
)

data class ReleaseArtifact(
    val platform: String,
    val channel: String,
    val version: String,
    val sha256: String? = null,
    val downloadUrl: String? = null,
    val installCommand: String? = null,
    val notes: String? = null,
    val metadata: Map<String, Any?> = emptyMap()
)
