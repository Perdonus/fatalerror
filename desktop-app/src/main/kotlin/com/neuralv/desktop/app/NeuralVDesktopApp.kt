package com.neuralv.desktop.app

import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Api
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Computer
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Security
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.UploadFile
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.FrameWindowScope
import com.neuralv.desktop.app.theme.NeuralVDesktopTheme
import com.neuralv.desktop.core.api.NeuralVApiClient
import com.neuralv.desktop.core.model.AuthChallengeMode
import com.neuralv.desktop.core.model.ChallengeTicket
import com.neuralv.desktop.core.model.DesktopArtifactKind
import com.neuralv.desktop.core.model.DesktopPlatform
import com.neuralv.desktop.core.model.DesktopScanMode
import com.neuralv.desktop.core.model.DesktopScanResult
import com.neuralv.desktop.core.model.ReleaseArtifact
import com.neuralv.desktop.core.model.SessionState
import com.neuralv.desktop.core.repository.AuthRepository
import com.neuralv.desktop.core.repository.DesktopScanRepository
import com.neuralv.desktop.core.service.SessionStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.awt.FileDialog
import java.awt.Frame
import java.io.File
import java.text.DateFormat
import java.util.Date

private enum class DesktopScreen {
    WELCOME,
    AUTH,
    HOME,
    SCAN,
    RESULTS,
    HISTORY,
    SETTINGS
}

private enum class ThemeChoice { SYSTEM, LIGHT, DARK }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FrameWindowScope.NeuralVDesktopApp() {
    var backendUrl by rememberSaveable { mutableStateOf("https://sosiskibot.ru/basedata") }
    var themeChoice by rememberSaveable { mutableStateOf(ThemeChoice.SYSTEM) }
    var dynamicAccentEnabled by rememberSaveable { mutableStateOf(true) }
    var screen by rememberSaveable { mutableStateOf(DesktopScreen.WELCOME) }
    var authMode by rememberSaveable { mutableStateOf(AuthChallengeMode.LOGIN) }
    var authName by rememberSaveable { mutableStateOf("") }
    var authEmail by rememberSaveable { mutableStateOf("") }
    var authPassword by rememberSaveable { mutableStateOf("") }
    var authCode by rememberSaveable { mutableStateOf("") }
    var challengeTicket by remember { mutableStateOf<ChallengeTicket?>(null) }
    var session by remember { mutableStateOf<SessionState?>(null) }
    var activeScan by remember { mutableStateOf<DesktopScanResult?>(null) }
    var selectedArtifact by remember { mutableStateOf<File?>(null) }
    var selectedMode by rememberSaveable { mutableStateOf(DesktopScanMode.FULL) }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showThemeDialog by remember { mutableStateOf(false) }
    var isBusy by remember { mutableStateOf(false) }
    val history = remember { mutableStateListOf<DesktopScanResult>() }
    val manifestArtifacts = remember { mutableStateListOf<ReleaseArtifact>() }
    val scope = rememberCoroutineScope()

    val apiClient = remember(backendUrl) { NeuralVApiClient(baseUrl = backendUrl) }
    val sessionStore = remember { SessionStore() }
    val authRepository = remember(backendUrl) { AuthRepository(apiClient, sessionStore, backendUrl) }
    val scanRepository = remember(backendUrl) { DesktopScanRepository(apiClient) }

    LaunchedEffect(backendUrl) {
        session = authRepository.readCachedSession()
        runCatching { scanRepository.releaseManifest() }
            .onSuccess {
                manifestArtifacts.clear()
                manifestArtifacts.addAll(it)
            }
    }

    NeuralVDesktopTheme(
        darkTheme = when (themeChoice) {
            ThemeChoice.SYSTEM -> isSystemInDarkTheme()
            ThemeChoice.LIGHT -> false
            ThemeChoice.DARK -> true
        },
        dynamicAccentEnabled = dynamicAccentEnabled
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.surfaceContainerHighest,
                            MaterialTheme.colorScheme.surface,
                            MaterialTheme.colorScheme.background
                        )
                    )
                )
        ) {
            Scaffold(
                containerColor = Color.Transparent,
                topBar = {
                    TopAppBar(
                        title = {
                            Column {
                                Text("NeuralV", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                Text(
                                    text = when (screen) {
                                        DesktopScreen.WELCOME -> "Windows и Linux GUI"
                                        DesktopScreen.AUTH -> if (challengeTicket == null) "Единая авторизация" else "Подтверждение по коду"
                                        DesktopScreen.HOME -> "Панель управления"
                                        DesktopScreen.SCAN -> "Server-driven desktop scan"
                                        DesktopScreen.RESULTS -> "Результаты проверки"
                                        DesktopScreen.HISTORY -> "История"
                                        DesktopScreen.SETTINGS -> "Настройки"
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        },
                        actions = {
                            if (session != null) {
                                IconButton(onClick = { screen = DesktopScreen.HISTORY }) {
                                    Icon(Icons.Rounded.History, contentDescription = "История")
                                }
                                IconButton(onClick = { showThemeDialog = true }) {
                                    Icon(Icons.Rounded.DarkMode, contentDescription = "Тема")
                                }
                                IconButton(onClick = { screen = DesktopScreen.SETTINGS }) {
                                    Icon(Icons.Rounded.Settings, contentDescription = "Настройки")
                                }
                            }
                        }
                    )
                }
            ) { padding ->
                when (screen) {
                    DesktopScreen.WELCOME -> WelcomeView(
                        modifier = Modifier.padding(padding),
                        releaseArtifacts = manifestArtifacts,
                        onContinue = {
                            screen = if (session == null) DesktopScreen.AUTH else DesktopScreen.HOME
                        }
                    )
                    DesktopScreen.AUTH -> AuthView(
                        modifier = Modifier.padding(padding),
                        authMode = authMode,
                        name = authName,
                        email = authEmail,
                        password = authPassword,
                        code = authCode,
                        challengePending = challengeTicket != null,
                        isBusy = isBusy,
                        errorMessage = errorMessage,
                        infoMessage = statusMessage,
                        onModeChange = { authMode = it },
                        onNameChange = { authName = it },
                        onEmailChange = { authEmail = it },
                        onPasswordChange = { authPassword = it },
                        onCodeChange = { authCode = it },
                        onSubmit = {
                            scope.launch {
                                isBusy = true
                                errorMessage = null
                                runCatching {
                                    if (challengeTicket == null) {
                                        challengeTicket = when (authMode) {
                                            AuthChallengeMode.LOGIN -> authRepository.startLogin(authEmail, authPassword)
                                            AuthChallengeMode.REGISTER -> authRepository.startRegister(authName, authEmail, authPassword)
                                        }
                                        statusMessage = "Код отправлен на почту."
                                    } else {
                                        session = authRepository.verifyChallenge(requireNotNull(challengeTicket), authCode)
                                        challengeTicket = null
                                        authCode = ""
                                        screen = DesktopScreen.HOME
                                        statusMessage = "Сессия восстановлена."
                                    }
                                }.onFailure { errorMessage = it.message ?: "Не удалось завершить авторизацию" }
                                isBusy = false
                            }
                        },
                        onBack = {
                            challengeTicket = null
                            authCode = ""
                            screen = DesktopScreen.WELCOME
                        }
                    )
                    DesktopScreen.HOME -> HomeView(
                        modifier = Modifier.padding(padding),
                        session = session,
                        releaseArtifacts = manifestArtifacts,
                        activeScan = activeScan,
                        history = history,
                        onOpenScan = { screen = DesktopScreen.SCAN },
                        onOpenHistory = { screen = DesktopScreen.HISTORY },
                        onOpenSettings = { screen = DesktopScreen.SETTINGS },
                        onResumeActive = { screen = DesktopScreen.RESULTS },
                        onOpenResult = {
                            activeScan = it
                            screen = DesktopScreen.RESULTS
                        }
                    )
                    DesktopScreen.SCAN -> ScanView(
                        modifier = Modifier.padding(padding),
                        selectedMode = selectedMode,
                        selectedArtifact = selectedArtifact,
                        activeScan = activeScan,
                        isBusy = isBusy,
                        onModeChange = { selectedMode = it },
                        onChooseArtifact = {
                            selectedArtifact = chooseFile(this@NeuralVDesktopApp.window)
                        },
                        onStart = {
                            val currentSession = session ?: return@ScanView
                            scope.launch {
                                isBusy = true
                                errorMessage = null
                                statusMessage = "Отправляем задачу на сервер"
                                runCatching {
                                    val platform = currentPlatform()
                                    val artifact = selectedArtifact
                                    val request = com.neuralv.desktop.core.model.DesktopStartScanRequest(
                                        platform = platform,
                                        mode = selectedMode,
                                        artifactKind = artifact?.toArtifactKind() ?: DesktopArtifactKind.UNKNOWN,
                                        sha256 = null,
                                        localFindings = emptyList(),
                                        artifactMetadata = buildMap {
                                            put("target_name", artifact?.name ?: platform.name.lowercase())
                                            put("target_path", artifact?.absolutePath ?: System.getProperty("user.home"))
                                            put("file_size_bytes", artifact?.length())
                                            put("upload_required", selectedMode == DesktopScanMode.ARTIFACT || selectedMode == DesktopScanMode.SELECTIVE)
                                            put("package_manager", guessPackageManager())
                                            put("origin_path", artifact?.parent)
                                        }
                                    )
                                    var result = scanRepository.startScan(currentSession, request)
                                    if ((selectedMode == DesktopScanMode.ARTIFACT || selectedMode == DesktopScanMode.SELECTIVE) && artifact != null && result.summary.status == "AWAITING_UPLOAD") {
                                        result = scanRepository.uploadArtifact(currentSession, result.summary.scanId, artifact)
                                    }
                                    activeScan = result
                                    if (result.summary.status == "QUEUED" || result.summary.status == "RUNNING" || result.summary.status == "AWAITING_UPLOAD") {
                                        pollDesktopScan(scanRepository, currentSession, result.summary.scanId) { polled ->
                                            activeScan = polled
                                            if (polled.summary.status == "COMPLETED") {
                                                history.removeAll { it.summary.scanId == polled.summary.scanId }
                                                history.add(0, polled)
                                                statusMessage = "Проверка завершена"
                                                screen = DesktopScreen.RESULTS
                                            }
                                        }
                                    } else {
                                        history.removeAll { it.summary.scanId == result.summary.scanId }
                                        history.add(0, result)
                                        screen = DesktopScreen.RESULTS
                                    }
                                }.onFailure { errorMessage = it.message ?: "Не удалось запустить проверку" }
                                isBusy = false
                            }
                        },
                        onCancel = {
                            val currentSession = session ?: return@ScanView
                            scope.launch {
                                runCatching { scanRepository.cancelActive(currentSession) }
                                    .onSuccess {
                                        activeScan = it
                                        statusMessage = "Активная серверная проверка отменена"
                                    }
                                    .onFailure { errorMessage = it.message ?: "Не удалось отменить проверку" }
                            }
                        }
                    )
                    DesktopScreen.RESULTS -> ResultsView(
                        modifier = Modifier.padding(padding),
                        result = activeScan,
                        onBack = { screen = DesktopScreen.HOME },
                        onFullReport = {
                            val currentSession = session ?: return@ResultsView
                            val result = activeScan ?: return@ResultsView
                            scope.launch {
                                runCatching { scanRepository.fullReport(currentSession, listOf(result.summary.scanId)) }
                                    .onSuccess { reports ->
                                        if (reports.isNotEmpty()) {
                                            activeScan = reports.first()
                                            history.removeAll { it.summary.scanId == reports.first().summary.scanId }
                                            history.add(0, reports.first())
                                            statusMessage = "Полный отчёт синхронизирован"
                                        }
                                    }
                                    .onFailure { errorMessage = it.message ?: "Не удалось загрузить полный отчёт" }
                            }
                        }
                    )
                    DesktopScreen.HISTORY -> HistoryView(
                        modifier = Modifier.padding(padding),
                        history = history,
                        onOpen = {
                            activeScan = it
                            screen = DesktopScreen.RESULTS
                        }
                    )
                    DesktopScreen.SETTINGS -> SettingsView(
                        modifier = Modifier.padding(padding),
                        backendUrl = backendUrl,
                        themeChoice = themeChoice,
                        dynamicAccentEnabled = dynamicAccentEnabled,
                        session = session,
                        onBackendUrlChange = { backendUrl = it },
                        onThemeDialog = { showThemeDialog = true },
                        onDynamicAccentChange = { dynamicAccentEnabled = it },
                        onLogout = {
                            scope.launch {
                                authRepository.logout()
                                session = null
                                history.clear()
                                activeScan = null
                                screen = DesktopScreen.AUTH
                            }
                        }
                    )
                }
            }

            if (isBusy) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background.copy(alpha = 0.60f)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }
            if (showThemeDialog) {
                ThemeDialog(
                    choice = themeChoice,
                    onChoice = {
                        themeChoice = it
                        showThemeDialog = false
                    },
                    onDismiss = { showThemeDialog = false }
                )
            }
            if (!errorMessage.isNullOrBlank()) {
                AlertDialog(
                    onDismissRequest = { errorMessage = null },
                    confirmButton = { TextButton(onClick = { errorMessage = null }) { Text("Ок") } },
                    title = { Text("NeuralV") },
                    text = { Text(errorMessage!!) }
                )
            }
        }
    }
}

@Composable
private fun WelcomeView(modifier: Modifier, releaseArtifacts: List<ReleaseArtifact>, onContinue: () -> Unit) {
    LazyColumn(
        modifier = modifier.fillMaxSize().padding(horizontal = 28.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = Color.Transparent
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Spacer(Modifier.height(12.dp))
                    Surface(
                        modifier = Modifier.size(112.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.16f)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Rounded.Security, contentDescription = null, modifier = Modifier.size(52.dp))
                        }
                    }
                    Text("NeuralV", style = MaterialTheme.typography.displayLarge, maxLines = 1)
                    Text(
                        "Один backend /basedata для Android, Windows GUI, Linux GUI и Linux shell. Desktop-ветка уже подготовлена под server-driven проверки, unified auth и release manifest.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    ElevatedButton(onClick = onContinue) {
                        Icon(Icons.Rounded.PlayArrow, contentDescription = null)
                        Spacer(Modifier.width(10.dp))
                        Text("Открыть NeuralV")
                    }
                }
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
                Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("Release manifest", style = MaterialTheme.typography.titleLarge)
                    if (releaseArtifacts.isEmpty()) {
                        Text("Манифест пока не опубликован. После первого CI desktop/site артефакты подтянутся автоматически.")
                    } else {
                        releaseArtifacts.forEach { artifact ->
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.Download, contentDescription = null)
                                Column {
                                    Text(artifact.platform.uppercase(), fontWeight = FontWeight.SemiBold)
                                    Text(
                                        artifact.downloadUrl?.takeUnless { it.isBlank() } ?: artifact.installCommand.orEmpty(),
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AuthView(
    modifier: Modifier,
    authMode: AuthChallengeMode,
    name: String,
    email: String,
    password: String,
    code: String,
    challengePending: Boolean,
    isBusy: Boolean,
    errorMessage: String?,
    infoMessage: String?,
    onModeChange: (AuthChallengeMode) -> Unit,
    onNameChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onCodeChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onBack: () -> Unit
) {
    Box(modifier.fillMaxSize().padding(28.dp), contentAlignment = Alignment.Center) {
        Card(modifier = Modifier.width(620.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
            Column(Modifier.padding(28.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(if (challengePending) "Код подтверждения" else "Единая авторизация", style = MaterialTheme.typography.headlineLarge)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    FilterChip(selected = authMode == AuthChallengeMode.LOGIN, onClick = { onModeChange(AuthChallengeMode.LOGIN) }, label = { Text("Вход") })
                    FilterChip(selected = authMode == AuthChallengeMode.REGISTER, onClick = { onModeChange(AuthChallengeMode.REGISTER) }, label = { Text("Регистрация") })
                }
                if (!challengePending && authMode == AuthChallengeMode.REGISTER) {
                    OutlinedTextField(value = name, onValueChange = onNameChange, label = { Text("Имя") }, modifier = Modifier.fillMaxWidth())
                }
                OutlinedTextField(value = email, onValueChange = onEmailChange, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
                if (!challengePending) {
                    OutlinedTextField(value = password, onValueChange = onPasswordChange, label = { Text("Пароль") }, modifier = Modifier.fillMaxWidth())
                } else {
                    OutlinedTextField(value = code, onValueChange = onCodeChange, label = { Text("Код из письма") }, modifier = Modifier.fillMaxWidth())
                }
                if (!infoMessage.isNullOrBlank()) {
                    Text(infoMessage, color = MaterialTheme.colorScheme.primary)
                }
                if (!errorMessage.isNullOrBlank()) {
                    Text(errorMessage, color = MaterialTheme.colorScheme.error)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(onClick = onBack) { Text("Назад") }
                    Button(onClick = onSubmit, enabled = !isBusy) {
                        Icon(Icons.Rounded.VerifiedUser, contentDescription = null)
                        Spacer(Modifier.width(10.dp))
                        Text(if (challengePending) "Подтвердить" else "Продолжить")
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeView(
    modifier: Modifier,
    session: SessionState?,
    releaseArtifacts: List<ReleaseArtifact>,
    activeScan: DesktopScanResult?,
    history: List<DesktopScanResult>,
    onOpenScan: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenSettings: () -> Unit,
    onResumeActive: () -> Unit,
    onOpenResult: (DesktopScanResult) -> Unit
) {
    LazyColumn(
        modifier = modifier.fillMaxSize().padding(horizontal = 28.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
                Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("${session?.user?.name ?: "Офлайн"}, рабочая станция готова", style = MaterialTheme.typography.headlineLarge)
                    Text("Desktop GUI использует единый backend `/basedata`, release manifest и server-side фильтрацию false positive перед выдачей пользователю.")
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        ElevatedButton(onClick = onOpenScan) {
                            Icon(Icons.Rounded.Security, contentDescription = null)
                            Spacer(Modifier.width(10.dp))
                            Text("Проверка")
                        }
                        OutlinedButton(onClick = onOpenHistory) {
                            Icon(Icons.Rounded.History, contentDescription = null)
                            Spacer(Modifier.width(10.dp))
                            Text("История")
                        }
                        OutlinedButton(onClick = onOpenSettings) {
                            Icon(Icons.Rounded.Settings, contentDescription = null)
                            Spacer(Modifier.width(10.dp))
                            Text("Настройки")
                        }
                    }
                }
            }
        }
        if (activeScan != null) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                    Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Активная серверная проверка", style = MaterialTheme.typography.titleLarge)
                        Text(activeScan.summary.message ?: activeScan.summary.status)
                        ElevatedButton(onClick = onResumeActive) {
                            Icon(Icons.Rounded.Bolt, contentDescription = null)
                            Spacer(Modifier.width(10.dp))
                            Text("Открыть результат")
                        }
                    }
                }
            }
        }
        item {
            Text("Последние результаты", style = MaterialTheme.typography.titleLarge)
        }
        items(history.take(4)) { result ->
            HistoryItem(result = result, onOpen = { onOpenResult(result) })
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Доступные артефакты", style = MaterialTheme.typography.titleLarge)
                    releaseArtifacts.forEach { artifact ->
                        Text("${artifact.platform}: ${artifact.version}")
                    }
                }
            }
        }
    }
}

@Composable
private fun ScanView(
    modifier: Modifier,
    selectedMode: DesktopScanMode,
    selectedArtifact: File?,
    activeScan: DesktopScanResult?,
    isBusy: Boolean,
    onModeChange: (DesktopScanMode) -> Unit,
    onChooseArtifact: () -> Unit,
    onStart: () -> Unit,
    onCancel: () -> Unit
) {
    Column(
        modifier = modifier.fillMaxSize().padding(28.dp).verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Text("Режимы", style = MaterialTheme.typography.headlineLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            listOf(DesktopScanMode.FULL, DesktopScanMode.SELECTIVE, DesktopScanMode.ARTIFACT).forEach { mode ->
                FilterChip(selected = selectedMode == mode, onClick = { onModeChange(mode) }, label = { Text(modeLabel(mode)) })
            }
        }
        if (selectedMode == DesktopScanMode.SELECTIVE || selectedMode == DesktopScanMode.ARTIFACT) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Артефакт", style = MaterialTheme.typography.titleLarge)
                    Text(selectedArtifact?.absolutePath ?: "Файл ещё не выбран")
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = onChooseArtifact) {
                            Icon(Icons.Rounded.UploadFile, contentDescription = null)
                            Spacer(Modifier.width(10.dp))
                            Text("Выбрать")
                        }
                        if (selectedArtifact != null) {
                            Text("${selectedArtifact.length()} bytes", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }
        if (activeScan != null) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Текущий job", style = MaterialTheme.typography.titleLarge)
                    Text("${activeScan.summary.scanId} · ${activeScan.summary.status}")
                    if (!activeScan.summary.message.isNullOrBlank()) Text(activeScan.summary.message!!)
                    OutlinedButton(onClick = onCancel) {
                        Text("Отменить проверку")
                    }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            ElevatedButton(onClick = onStart, enabled = !isBusy) {
                Icon(Icons.Rounded.PlayArrow, contentDescription = null)
                Spacer(Modifier.width(10.dp))
                Text("Запустить серверную проверку")
            }
        }
    }
}

@Composable
private fun ResultsView(modifier: Modifier, result: DesktopScanResult?, onBack: () -> Unit, onFullReport: () -> Unit) {
    if (result == null) {
        Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Результат ещё не загружен")
        }
        return
    }
    LazyColumn(
        modifier = modifier.fillMaxSize().padding(horizontal = 28.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
                Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("${modeLabel(result.summary.mode)} · ${result.summary.platform.name}", style = MaterialTheme.typography.titleLarge)
                    Text(result.summary.message ?: result.summary.status)
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = onBack) { Text("Назад") }
                        ElevatedButton(onClick = onFullReport) {
                            Icon(Icons.Rounded.Description, contentDescription = null)
                            Spacer(Modifier.width(10.dp))
                            Text("Синхронизировать полный отчёт")
                        }
                    }
                }
            }
        }
        items(result.findings) { finding ->
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(finding.title, style = MaterialTheme.typography.titleMedium)
                    Text(finding.summary)
                    finding.artifact?.let { artifact ->
                        Text("${artifact.displayName} · ${artifact.path}", style = MaterialTheme.typography.bodySmall)
                    }
                    if (finding.evidence.isNotEmpty()) {
                        Text(finding.evidence.joinToString(separator = "\n• ", prefix = "• "), style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

@Composable
private fun HistoryView(modifier: Modifier, history: List<DesktopScanResult>, onOpen: (DesktopScanResult) -> Unit) {
    LazyColumn(
        modifier = modifier.fillMaxSize().padding(horizontal = 28.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        if (history.isEmpty()) {
            item {
                Box(Modifier.fillMaxSize().height(260.dp), contentAlignment = Alignment.Center) {
                    Text("История пуста")
                }
            }
        } else {
            items(history) { result ->
                HistoryItem(result = result, onOpen = { onOpen(result) })
            }
        }
    }
}

@Composable
private fun HistoryItem(result: DesktopScanResult, onOpen: () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(18.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("${modeLabel(result.summary.mode)} · ${result.summary.platform.name}", fontWeight = FontWeight.SemiBold)
                Text(result.summary.message ?: result.summary.status)
                Text(DateFormat.getDateTimeInstance().format(Date(result.summary.startedAt)), style = MaterialTheme.typography.bodySmall)
            }
            ElevatedButton(onClick = onOpen) {
                Text("Открыть")
            }
        }
    }
}

@Composable
private fun SettingsView(
    modifier: Modifier,
    backendUrl: String,
    themeChoice: ThemeChoice,
    dynamicAccentEnabled: Boolean,
    session: SessionState?,
    onBackendUrlChange: (String) -> Unit,
    onThemeDialog: () -> Unit,
    onDynamicAccentChange: (Boolean) -> Unit,
    onLogout: () -> Unit
) {
    Column(
        modifier = modifier.fillMaxSize().padding(28.dp).verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
            Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Подключение", style = MaterialTheme.typography.titleLarge)
                OutlinedTextField(value = backendUrl, onValueChange = onBackendUrlChange, modifier = Modifier.fillMaxWidth(), label = { Text("Backend URL") })
                Text("Desktop-клиент использует единый backend `/basedata` и file-backed session store в ~/.config/neuralv/session.json")
            }
        }
        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
            Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Оформление", style = MaterialTheme.typography.titleLarge)
                OutlinedButton(onClick = onThemeDialog) {
                    Text("Тема: ${themeLabel(themeChoice)}")
                }
                FilterChip(selected = dynamicAccentEnabled, onClick = { onDynamicAccentChange(!dynamicAccentEnabled) }, label = { Text(if (dynamicAccentEnabled) "Dynamic palette включена" else "Dynamic palette выключена") })
            }
        }
        session?.let {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) {
                Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Сессия", style = MaterialTheme.typography.titleLarge)
                    Text(it.user.email)
                    Text(if (it.user.isDeveloperMode) "Режим разработчика активен" else "Обычный доступ")
                    OutlinedButton(onClick = onLogout) { Text("Выйти") }
                }
            }
        }
    }
}

@Composable
private fun ThemeDialog(choice: ThemeChoice, onChoice: (ThemeChoice) -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {},
        title = { Text("Тема NeuralV") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                ThemeChoice.entries.forEach { item ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = choice == item, onClick = { onChoice(item) })
                        Spacer(Modifier.width(8.dp))
                        Text(themeLabel(item))
                    }
                }
            }
        }
    )
}

private suspend fun pollDesktopScan(
    repository: DesktopScanRepository,
    session: SessionState,
    scanId: String,
    onResult: (DesktopScanResult) -> Unit
) {
    repeat(120) {
        val result = repository.pollScan(session, scanId)
        onResult(result)
        if (result.summary.status == "COMPLETED" || result.summary.status == "FAILED" || result.summary.status == "CANCELLED") {
            return
        }
        delay(2_000)
    }
}

private fun currentPlatform(): DesktopPlatform = if (System.getProperty("os.name", "").lowercase().contains("win")) {
    DesktopPlatform.WINDOWS
} else {
    DesktopPlatform.LINUX
}

private fun modeLabel(mode: DesktopScanMode): String = when (mode) {
    DesktopScanMode.QUICK -> "Быстрая"
    DesktopScanMode.FULL -> "Глубокая"
    DesktopScanMode.SELECTIVE -> "Выборочная"
    DesktopScanMode.ARTIFACT -> "Проверка файла"
}

private fun themeLabel(choice: ThemeChoice): String = when (choice) {
    ThemeChoice.SYSTEM -> "Как в системе"
    ThemeChoice.LIGHT -> "Светлая"
    ThemeChoice.DARK -> "Тёмная"
}

private fun chooseFile(frame: java.awt.Window?): File? {
    val dialog = FileDialog(frame as? Frame, "Выберите файл", FileDialog.LOAD)
    dialog.isVisible = true
    val directory = dialog.directory ?: return null
    val fileName = dialog.file ?: return null
    return File(directory, fileName)
}

private fun File.toArtifactKind(): DesktopArtifactKind {
    val lower = name.lowercase()
    return when {
        lower.endsWith(".exe") || lower.endsWith(".dll") || lower.endsWith(".msi") -> DesktopArtifactKind.EXECUTABLE
        lower.endsWith(".so") -> DesktopArtifactKind.LIBRARY
        lower.endsWith(".deb") || lower.endsWith(".rpm") || lower.endsWith(".pkg.tar.zst") || lower.endsWith(".appimage") -> DesktopArtifactKind.PACKAGE
        lower.endsWith(".sh") || lower.endsWith(".py") || lower.endsWith(".desktop") -> DesktopArtifactKind.SCRIPT
        lower.endsWith(".zip") || lower.endsWith(".tar") || lower.endsWith(".gz") || lower.endsWith(".7z") -> DesktopArtifactKind.ARCHIVE
        else -> DesktopArtifactKind.UNKNOWN
    }
}

private fun guessPackageManager(): String = when {
    File("/usr/bin/dpkg").exists() -> "dpkg"
    File("/usr/bin/rpm").exists() -> "rpm"
    File("/usr/bin/pacman").exists() -> "pacman"
    File("/usr/bin/flatpak").exists() -> "flatpak"
    File("/usr/bin/snap").exists() -> "snap"
    else -> "unknown"
}
