package com.neuralv.desktop.core.repository

import com.neuralv.desktop.core.api.NeuralVApiClient
import com.neuralv.desktop.core.model.DesktopScanMode
import com.neuralv.desktop.core.model.DesktopScanResult
import com.neuralv.desktop.core.model.DesktopScanSummary
import com.neuralv.desktop.core.model.DesktopScanTransport
import com.neuralv.desktop.core.model.DesktopStartScanRequest
import com.neuralv.desktop.core.model.ReleaseArtifact
import com.neuralv.desktop.core.model.SessionState
import com.neuralv.desktop.core.model.ThreatVerdict
import java.io.File

class DesktopScanRepository(
    private val apiClient: NeuralVApiClient
) {
    fun startScan(session: SessionState, request: DesktopStartScanRequest): DesktopScanResult {
        val transport = requireNotNull(apiClient.startDesktopScan(request, session.accessToken).scan)
        return transport.toDomain(request.mode)
    }

    fun pollScan(session: SessionState, scanId: String): DesktopScanResult {
        val transport = requireNotNull(apiClient.getDesktopScan(scanId, session.accessToken).scan)
        return transport.toDomain()
    }

    fun cancelActive(session: SessionState): DesktopScanResult? {
        return apiClient.cancelDesktopScan(session.accessToken).scan?.toDomain()
    }

    fun uploadArtifact(session: SessionState, scanId: String, file: File): DesktopScanResult {
        val transport = requireNotNull(apiClient.uploadArtifact(scanId, file, session.accessToken).scan)
        return transport.toDomain()
    }

    fun fullReport(session: SessionState, ids: List<String>): List<DesktopScanResult> {
        return apiClient.getDesktopFullReport(ids, session.accessToken).reports.map { it.toDomain() }
    }

    fun releaseManifest(): List<ReleaseArtifact> = apiClient.getReleaseManifest().artifacts
}

private fun DesktopScanTransport.toDomain(fallbackMode: DesktopScanMode? = null): DesktopScanResult {
    val normalizedMode = when ((mode ?: fallbackMode?.name ?: "FULL").uppercase()) {
        "QUICK" -> DesktopScanMode.QUICK
        "SELECTIVE" -> DesktopScanMode.SELECTIVE
        "ARTIFACT" -> DesktopScanMode.ARTIFACT
        "RESIDENT_EVENT" -> DesktopScanMode.QUICK
        "ON_DEMAND", "FULL" -> DesktopScanMode.FULL
        else -> fallbackMode ?: DesktopScanMode.FULL
    }
    val normalizedPlatform = runCatching {
        com.neuralv.desktop.core.model.DesktopPlatform.valueOf((platform ?: "LINUX").uppercase())
    }.getOrDefault(com.neuralv.desktop.core.model.DesktopPlatform.LINUX)
    return DesktopScanResult(
        summary = DesktopScanSummary(
            scanId = id,
            platform = normalizedPlatform,
            mode = normalizedMode,
            status = status,
            startedAt = startedAt ?: System.currentTimeMillis(),
            completedAt = completedAt,
            totalArtifacts = findings.size,
            surfacedFindings = surfacedFindings ?: findings.size,
            hiddenFindings = hiddenFindings ?: 0,
            message = message
        ),
        findings = findings.map { finding ->
            finding.copy(
                verdict = finding.verdict.takeUnless { it == ThreatVerdict.UNKNOWN } ?: runCatching {
                    ThreatVerdict.valueOf((verdict ?: "UNKNOWN").uppercase())
                }.getOrDefault(ThreatVerdict.UNKNOWN)
            )
        },
        timeline = timeline
    )
}
