package com.neuralv.desktop.app.state

import com.neuralv.desktop.app.navigation.AppScreen
import com.neuralv.desktop.app.theme.DesktopThemeMode
import com.neuralv.desktop.app.theme.WallpaperPaletteService
import com.neuralv.desktop.core.api.NeuralVApiClient
import com.neuralv.desktop.core.model.AuthChallengeMode
import com.neuralv.desktop.core.model.DesktopArtifactKind
import com.neuralv.desktop.core.model.DesktopPlatform
import com.neuralv.desktop.core.model.DesktopScanMode
import com.neuralv.desktop.core.model.DesktopStartScanRequest
import com.neuralv.desktop.core.repository.AuthRepository
import com.neuralv.desktop.core.repository.DesktopScanRepository
import com.neuralv.desktop.core.service.SessionStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File

class DesktopAppController(
    initialBackendUrl: String = "https://sosiskibot.ru/basedata"
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val sessionStore = SessionStore()
    private var apiClient = NeuralVApiClient(initialBackendUrl)
    private var authRepository = AuthRepository(apiClient, sessionStore, initialBackendUrl)
    private var scanRepository = DesktopScanRepository(apiClient)
    private val paletteService = WallpaperPaletteService

    private val _state = MutableStateFlow(DesktopUiState(backendBaseUrl = initialBackendUrl))
    val state: StateFlow<DesktopUiState> = _state.asStateFlow()

    fun bootstrap() {
        scope.launch {
            val palette = paletteService.load()
            val session = authRepository.getActiveSession()
            val releases = runCatching { scanRepository.releaseManifest() }.getOrDefault(emptyList())
            _state.update {
                it.copy(
                    palette = if (it.useDynamicPalette) palette else it.palette,
                    wallpaperSource = palette.source,
                    session = session,
                    currentScreen = if (session != null) AppScreen.HOME else AppScreen.WELCOME,
                    releaseArtifacts = releases
                )
            }
        }
    }

    fun navigate(screen: AppScreen) = _state.update { it.copy(currentScreen = screen, lastError = null) }

    fun selectPlatform(platform: DesktopPlatform) = _state.update { it.copy(selectedPlatform = platform) }

    fun setThemeMode(mode: DesktopThemeMode) = _state.update { it.copy(themeMode = mode) }

    fun setDynamicPalette(enabled: Boolean) {
        _state.update { current ->
            current.copy(
                useDynamicPalette = enabled,
                palette = if (enabled) paletteService.load() else current.palette,
                wallpaperSource = if (enabled) paletteService.load().source else current.wallpaperSource
            )
        }
    }

    fun updateBackend(url: String) {
        val normalized = url.trim().removeSuffix("/")
        apiClient = NeuralVApiClient(normalized)
        authRepository = AuthRepository(apiClient, sessionStore, normalized)
        scanRepository = DesktopScanRepository(apiClient)
        _state.update { it.copy(backendBaseUrl = normalized, authNotice = "Backend обновлён") }
    }

    fun openAuth(tab: AuthTab) = _state.update { it.copy(currentScreen = AppScreen.AUTH, pendingAuthMode = tab) }

    fun startAuth(name: String, email: String, password: String, tab: AuthTab) {
        scope.launch {
            _state.update { it.copy(isBusy = true, authNotice = null, lastError = null, pendingAuthMode = tab) }
            runCatching {
                when (tab) {
                    AuthTab.REGISTER -> authRepository.startRegister(name, email, password)
                    else -> authRepository.startLogin(email, password)
                }
            }.onSuccess { ticket ->
                _state.update {
                    it.copy(
                        isBusy = false,
                        challengeTicket = ticket,
                        pendingAuthMode = AuthTab.VERIFY,
                        authNotice = "Код отправлен на ${ticket.email}"
                    )
                }
            }.onFailure { error ->
                _state.update { it.copy(isBusy = false, lastError = error.message ?: "Не удалось начать авторизацию") }
            }
        }
    }

    fun verifyCode(code: String) {
        val ticket = _state.value.challengeTicket ?: return
        scope.launch {
            _state.update { it.copy(isBusy = true, lastError = null) }
            runCatching { authRepository.verifyChallenge(ticket, code) }
                .onSuccess { session ->
                    _state.update {
                        it.copy(
                            isBusy = false,
                            session = session,
                            currentScreen = AppScreen.HOME,
                            authNotice = if (ticket.mode == AuthChallengeMode.REGISTER) "Аккаунт создан" else "Сессия восстановлена",
                            challengeTicket = null,
                            pendingAuthMode = AuthTab.LOGIN
                        )
                    }
                }
                .onFailure { error ->
                    _state.update { it.copy(isBusy = false, lastError = error.message ?: "Неверный код") }
                }
        }
    }

    fun logout() {
        scope.launch {
            authRepository.logout()
            _state.update {
                it.copy(
                    session = null,
                    currentScreen = AppScreen.WELCOME,
                    authNotice = "Сессия закрыта",
                    activeScan = null
                )
            }
        }
    }

    fun startDesktopScan(mode: DesktopScanMode, artifactKind: DesktopArtifactKind = DesktopArtifactKind.EXECUTABLE) {
        val session = _state.value.session ?: return
        scope.launch {
            _state.update { it.copy(isBusy = true, currentScreen = AppScreen.SCAN, currentScanMode = mode, currentArtifactKind = artifactKind) }
            runCatching {
                scanRepository.startScan(
                    session = session,
                    request = DesktopStartScanRequest(
                        platform = _state.value.selectedPlatform,
                        mode = mode,
                        artifactKind = artifactKind,
                        artifactMetadata = mapOf(
                            "device_name" to System.getProperty("user.name"),
                            "platform_name" to System.getProperty("os.name"),
                            "resident_requested" to true
                        )
                    )
                )
            }.onSuccess { result ->
                _state.update {
                    it.copy(
                        isBusy = false,
                        activeScan = result,
                        scanHistory = listOf(result) + it.scanHistory,
                        currentScreen = AppScreen.RESULTS
                    )
                }
            }.onFailure { error ->
                _state.update { it.copy(isBusy = false, lastError = error.message ?: "Проверка не запущена") }
            }
        }
    }

    fun uploadArtifact(file: File) {
        val session = _state.value.session ?: return
        val scanId = _state.value.activeScan?.summary?.scanId ?: return
        scope.launch {
            _state.update { it.copy(isBusy = true) }
            runCatching { scanRepository.uploadArtifact(session, scanId, file) }
                .onSuccess { result ->
                    _state.update { it.copy(isBusy = false, activeScan = result, currentScreen = AppScreen.RESULTS) }
                }
                .onFailure { error ->
                    _state.update { it.copy(isBusy = false, lastError = error.message ?: "Не удалось загрузить артефакт") }
                }
        }
    }

    fun refreshActiveScan() {
        val session = _state.value.session ?: return
        val scanId = _state.value.activeScan?.summary?.scanId ?: return
        scope.launch {
            _state.update { it.copy(isBusy = true) }
            runCatching { scanRepository.pollScan(session, scanId) }
                .onSuccess { result ->
                    _state.update { current ->
                        current.copy(
                            isBusy = false,
                            activeScan = result,
                            scanHistory = listOf(result) + current.scanHistory.filterNot { it.summary.scanId == result.summary.scanId }
                        )
                    }
                }
                .onFailure { error ->
                    _state.update { it.copy(isBusy = false, lastError = error.message ?: "Не удалось обновить статус") }
                }
        }
    }

    fun cancelActiveScan() {
        val session = _state.value.session ?: return
        scope.launch {
            runCatching { scanRepository.cancelActive(session) }
            _state.update { it.copy(activeScan = null, currentScreen = AppScreen.HOME, authNotice = "Активная проверка остановлена") }
        }
    }
}
