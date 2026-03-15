package com.neuralv.desktop.core.usecase

import com.neuralv.desktop.core.model.ReleaseArtifact
import com.neuralv.desktop.core.model.SessionState
import com.neuralv.desktop.core.repository.AuthRepository
import com.neuralv.desktop.core.repository.DesktopScanRepository

class RestoreSessionUseCase(
    private val authRepository: AuthRepository
) {
    operator fun invoke(): SessionState? = authRepository.getActiveSession()
}

class FetchReleaseManifestUseCase(
    private val scanRepository: DesktopScanRepository
) {
    operator fun invoke(): List<ReleaseArtifact> = scanRepository.releaseManifest()
}
