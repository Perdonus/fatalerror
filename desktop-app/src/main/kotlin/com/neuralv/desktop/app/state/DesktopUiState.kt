package com.neuralv.desktop.app.state

import com.neuralv.desktop.app.navigation.AppScreen
import com.neuralv.desktop.app.theme.DesktopThemeMode
import com.neuralv.desktop.app.theme.NeuralVPalette
import com.neuralv.desktop.app.theme.NeuralVPalettes
import com.neuralv.desktop.core.model.ChallengeTicket
import com.neuralv.desktop.core.model.DesktopArtifactKind
import com.neuralv.desktop.core.model.DesktopPlatform
import com.neuralv.desktop.core.model.DesktopScanMode
import com.neuralv.desktop.core.model.DesktopScanResult
import com.neuralv.desktop.core.model.ReleaseArtifact
import com.neuralv.desktop.core.model.SessionState

data class DesktopUiState(
    val backendBaseUrl: String = "https://sosiskibot.ru/basedata",
    val selectedPlatform: DesktopPlatform = detectPlatform(),
    val currentScreen: AppScreen = AppScreen.WELCOME,
    val palette: NeuralVPalette = NeuralVPalettes.fallback,
    val useDynamicPalette: Boolean = true,
    val themeMode: DesktopThemeMode = DesktopThemeMode.SYSTEM,
    val session: SessionState? = null,
    val challengeTicket: ChallengeTicket? = null,
    val pendingAuthMode: AuthTab = AuthTab.LOGIN,
    val authNotice: String? = null,
    val isBusy: Boolean = false,
    val currentScanMode: DesktopScanMode = DesktopScanMode.FULL,
    val currentArtifactKind: DesktopArtifactKind = DesktopArtifactKind.EXECUTABLE,
    val activeScan: DesktopScanResult? = null,
    val scanHistory: List<DesktopScanResult> = emptyList(),
    val releaseArtifacts: List<ReleaseArtifact> = emptyList(),
    val lastError: String? = null,
    val wallpaperSource: String = NeuralVPalettes.fallback.source
)

enum class AuthTab {
    LOGIN,
    REGISTER,
    VERIFY
}

private fun detectPlatform(): DesktopPlatform {
    val os = System.getProperty("os.name", "").lowercase()
    return if (os.contains("win")) DesktopPlatform.WINDOWS else DesktopPlatform.LINUX
}
