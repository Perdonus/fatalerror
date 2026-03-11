package com.shield.antivirus.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.work.WorkInfo
import androidx.work.WorkManager
import com.shield.antivirus.data.datastore.UserPreferences
import com.shield.antivirus.data.model.ThreatInfo
import com.shield.antivirus.data.model.ScanResult
import com.shield.antivirus.data.repository.InsightRepository
import com.shield.antivirus.data.repository.ScanProgress
import com.shield.antivirus.data.repository.ScanRepository
import com.shield.antivirus.worker.DeepScanWorker
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

data class ScanExplainUiState(
    val isLoading: Boolean = false,
    val title: String? = null,
    val explanation: String? = null,
    val error: String? = null
)

class ScanViewModel(private val context: Context) : ViewModel() {
    private val repo = ScanRepository(context)
    private val insightRepo = InsightRepository(context)
    private val prefs = UserPreferences(context)
    private val workManager = WorkManager.getInstance(context.applicationContext)

    private val _progress = MutableStateFlow<ScanProgress?>(null)
    val progress: StateFlow<ScanProgress?> = _progress.asStateFlow()

    private val _guestLimitReached = MutableStateFlow(false)
    val guestLimitReached: StateFlow<Boolean> = _guestLimitReached.asStateFlow()

    val isGuest = prefs.isGuest.stateIn(viewModelScope, SharingStarted.Lazily, false)
    val guestScanUsed = prefs.guestScanUsed.stateIn(viewModelScope, SharingStarted.Lazily, false)

    val allResults: StateFlow<List<ScanResult>> = repo.getAllResults()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    private val _currentResult = MutableStateFlow<ScanResult?>(null)
    val currentResult: StateFlow<ScanResult?> = _currentResult.asStateFlow()

    private val _explainState = MutableStateFlow(ScanExplainUiState())
    val explainState: StateFlow<ScanExplainUiState> = _explainState.asStateFlow()

    private var scanJob: Job? = null
    private var workObserverJob: Job? = null

    fun startScan(scanType: String, selectedPackages: List<String> = emptyList()) {
        scanJob?.cancel()
        workObserverJob?.cancel()
        scanJob = viewModelScope.launch {
            val guest = prefs.isGuest.first()
            var guestUsed = prefs.guestScanUsed.first()
            if (guest && guestUsed && !repo.hasLocalResults()) {
                prefs.clearGuestScanUsed()
                guestUsed = false
            }
            if (guest && guestUsed) {
                _guestLimitReached.value = true
                _progress.value = null
                return@launch
            }

            _guestLimitReached.value = false
            _progress.value = ScanProgress(totalCount = 1)

            if (!guest && scanType != "QUICK") {
                val existingWorkId = prefs.activeDeepScanWorkId.first()
                    .takeIf { it.isNotBlank() }
                    ?.let { runCatching { UUID.fromString(it) }.getOrNull() }
                val existingType = prefs.activeDeepScanType.first()
                val reusableWorkId = existingWorkId
                    ?.takeIf { existingType == scanType && isWorkReusable(it) }

                val workId = if (reusableWorkId != null) {
                    reusableWorkId
                } else {
                    if (existingWorkId != null) {
                        prefs.clearActiveDeepScan()
                    }
                    val newId = DeepScanWorker.enqueue(context.applicationContext, scanType, selectedPackages)
                    prefs.setActiveDeepScan(newId.toString(), scanType)
                    newId
                }
                observeDeepScan(workId)
                return@launch
            }

            var guestMarked = false
            repo.startScan(scanType, selectedPackages).collect { progress ->
                _progress.value = progress
                if (guest && !guestMarked && progress.isComplete && progress.savedId > 0L) {
                    prefs.markGuestScanUsed()
                    guestMarked = true
                }
            }
        }
    }

    private fun observeDeepScan(workId: UUID) {
        workObserverJob?.cancel()
        workObserverJob = viewModelScope.launch {
            while (true) {
                val info = runCatching { workManager.getWorkInfoById(workId).get() }.getOrNull()
                if (info == null) {
                    prefs.clearActiveDeepScan()
                    _progress.value = _progress.value?.copy(
                        currentApp = "Глубокая проверка была прервана. Запустите её заново."
                    )
                    break
                }
                val data = if (info.state.isFinished) info.outputData else info.progress
                val totalCount = data.getInt(DeepScanWorker.KEY_TOTAL_COUNT, _progress.value?.totalCount ?: 1)
                val scannedCount = data.getInt(DeepScanWorker.KEY_SCANNED_COUNT, _progress.value?.scannedCount ?: 0)
                val savedId = data.getLong(DeepScanWorker.KEY_SAVED_ID, 0L)
                val errorMessage = data.getString(DeepScanWorker.KEY_ERROR_MESSAGE).orEmpty()
                _progress.value = ScanProgress(
                    currentApp = if (errorMessage.isNotBlank()) errorMessage else data.getString(DeepScanWorker.KEY_CURRENT_APP).orEmpty(),
                    scannedCount = scannedCount,
                    totalCount = totalCount.coerceAtLeast(1),
                    threats = _progress.value?.threats.orEmpty(),
                    isComplete = data.getBoolean(DeepScanWorker.KEY_IS_COMPLETE, info.state.isFinished),
                    savedId = savedId
                )
                if (info.state.isFinished) {
                    prefs.clearActiveDeepScan()
                    if (savedId > 0L) {
                        _currentResult.value = repo.getResultById(savedId)
                    }
                    break
                }
                delay(400)
            }
        }
    }

    fun cancelScan() {
        scanJob?.cancel()
        workObserverJob?.cancel()
        DeepScanWorker.cancel(context.applicationContext)
        viewModelScope.launch { prefs.clearActiveDeepScan() }
        _progress.value = null
    }

    fun loadResult(id: Long) {
        viewModelScope.launch {
            _currentResult.value = repo.getResultById(id)
        }
    }

    fun explainCurrentResult() {
        viewModelScope.launch {
            val result = _currentResult.value ?: run {
                _explainState.value = ScanExplainUiState(error = "Сначала откройте готовый отчёт")
                return@launch
            }
            _explainState.value = ScanExplainUiState(
                isLoading = true,
                title = result.threats.firstOrNull()?.appName ?: "Отчёт"
            )
            insightRepo.explainResult(
                result = result,
                isGuest = prefs.isGuest.first()
            ).onSuccess { explanation ->
                _explainState.value = ScanExplainUiState(
                    title = result.threats.firstOrNull()?.appName ?: "Отчёт",
                    explanation = explanation
                )
            }.onFailure { error ->
                _explainState.value = ScanExplainUiState(
                    title = result.threats.firstOrNull()?.appName ?: "Отчёт",
                    error = error.message ?: "Не удалось получить объяснение"
                )
            }
        }
    }

    fun explainThreat(threat: ThreatInfo) {
        viewModelScope.launch {
            val result = _currentResult.value ?: run {
                _explainState.value = ScanExplainUiState(error = "Сначала откройте готовый отчёт")
                return@launch
            }
            _explainState.value = ScanExplainUiState(isLoading = true, title = threat.appName)
            val scopedResult = result.copy(
                threats = listOf(threat),
                threatsFound = 1
            )
            insightRepo.explainResult(
                result = scopedResult,
                isGuest = prefs.isGuest.first()
            ).onSuccess { explanation ->
                _explainState.value = ScanExplainUiState(
                    title = threat.appName,
                    explanation = explanation
                )
            }.onFailure { error ->
                _explainState.value = ScanExplainUiState(
                    title = threat.appName,
                    error = error.message ?: "Не удалось получить объяснение"
                )
            }
        }
    }

    fun clearExplanation() {
        _explainState.value = ScanExplainUiState()
    }

    fun clearHistory() {
        viewModelScope.launch { repo.deleteAll() }
    }

    suspend fun exitGuestMode() {
        prefs.exitGuestMode()
    }

    suspend fun shouldExitGuestModeAfterResult(): Boolean =
        prefs.isGuest.first() && prefs.guestScanUsed.first()

    private suspend fun isWorkReusable(workId: UUID): Boolean {
        val info = runCatching { workManager.getWorkInfoById(workId).get() }.getOrNull() ?: return false
        return info.state == WorkInfo.State.RUNNING || info.state == WorkInfo.State.ENQUEUED
    }

    class Factory(private val context: Context) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>) =
            ScanViewModel(context.applicationContext) as T
    }
}
