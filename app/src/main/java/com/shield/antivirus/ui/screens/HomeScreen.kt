package com.shield.antivirus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.shield.antivirus.ui.components.ShieldBackdrop
import com.shield.antivirus.ui.components.ShieldLoadingState
import com.shield.antivirus.ui.components.ShieldMetricTile
import com.shield.antivirus.ui.components.ShieldPanel
import com.shield.antivirus.ui.components.ShieldPrimaryButtonColors
import com.shield.antivirus.ui.components.ShieldScreenScaffold
import com.shield.antivirus.ui.components.ShieldSectionHeader
import com.shield.antivirus.ui.components.ShieldStatusChip
import com.shield.antivirus.ui.theme.criticalTone
import com.shield.antivirus.ui.theme.safeTone
import com.shield.antivirus.ui.theme.signalTone
import com.shield.antivirus.ui.theme.warningTone
import com.shield.antivirus.viewmodel.HomeUiState
import com.shield.antivirus.viewmodel.HomeViewModel
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    sessionGateIsGuest: Boolean,
    onStartScan: (String) -> Unit,
    onOpenHistory: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenLogin: () -> Unit,
    onOpenRegister: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    ShieldBackdrop {
        val current = state
        if (sessionGateIsGuest && (current == null || !current.isGuest)) {
            ShieldLoadingState(
                title = "Готовим режим гостя",
                subtitle = "Поднимаем одноразовую проверку",
                modifier = Modifier.fillMaxSize()
            )
            return@ShieldBackdrop
        }

        if (current == null) {
            ShieldLoadingState(
                title = "Загружаем защиту",
                subtitle = "Проверяем состояние сессии",
                modifier = Modifier.fillMaxSize()
            )
            return@ShieldBackdrop
        }

        HomeContent(
            state = current,
            onStartScan = onStartScan,
            onOpenHistory = onOpenHistory,
            onOpenSettings = onOpenSettings,
            onOpenLogin = onOpenLogin,
            onOpenRegister = onOpenRegister
        )
    }
}

@Composable
private fun HomeContent(
    state: HomeUiState,
    onStartScan: (String) -> Unit,
    onOpenHistory: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenLogin: () -> Unit,
    onOpenRegister: () -> Unit
) {
    val protectionScore = calculateProtectionScore(state)
    val statusColor = when {
        state.isGuest -> MaterialTheme.colorScheme.signalTone
        !state.isProtectionActive -> MaterialTheme.colorScheme.criticalTone
        state.totalThreatsEver > 0 -> MaterialTheme.colorScheme.warningTone
        else -> MaterialTheme.colorScheme.safeTone
    }

    var guestIntroLoading by rememberSaveable(state.isGuest) { mutableStateOf(state.isGuest) }
    LaunchedEffect(state.isGuest) {
        if (state.isGuest) {
            guestIntroLoading = true
            delay(1100)
            guestIntroLoading = false
        } else {
            guestIntroLoading = false
        }
    }

    ShieldScreenScaffold(
        title = "ShieldSecurity",
        subtitle = when {
            state.isGuest -> "Гостевой режим"
            state.userName.isBlank() -> null
            else -> state.userName
        },
        actions = {
            if (!state.isGuest) {
                IconButton(onClick = onOpenHistory) {
                    Icon(Icons.Filled.History, contentDescription = "История")
                }
                IconButton(onClick = onOpenSettings) {
                    Icon(Icons.Filled.Settings, contentDescription = "Настройки")
                }
            }
        }
    ) { padding ->
        if (state.isGuest && guestIntroLoading) {
            ShieldLoadingState(
                title = "Готовим режим гостя",
                subtitle = "Поднимаем одноразовую проверку",
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            )
            return@ShieldScreenScaffold
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                ShieldPanel(accent = statusColor) {
                    ShieldSectionHeader(
                        eyebrow = if (state.isGuest) "Гость" else "Статус",
                        title = when {
                            state.isGuest && state.guestScanUsed -> "Лимит исчерпан"
                            state.isGuest -> "Одна проверка"
                            !state.isProtectionActive -> "Защита выключена"
                            state.totalThreatsEver > 0 -> "Нужна проверка"
                            else -> "Устройство защищено"
                        },
                        subtitle = when {
                            state.isGuest && state.guestScanUsed -> "Чтобы продолжить, нужен аккаунт"
                            state.isGuest -> "Доступна только быстрая проверка"
                            else -> "Последняя проверка ${formatTime(state.lastScanTime)}"
                        }
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ShieldStatusChip(
                            label = when {
                                state.isGuest && state.guestScanUsed -> "Лимит исчерпан"
                                state.isGuest -> "1 запуск"
                                state.isProtectionActive -> "24/7 включена"
                                else -> "24/7 выключена"
                            },
                            icon = if (state.isGuest) Icons.Filled.FlashOn else Icons.Filled.Security,
                            color = statusColor
                        )
                        ShieldStatusChip(
                            label = if (state.isGuest) "Без истории" else "Индекс $protectionScore",
                            icon = if (state.isGuest) Icons.Filled.Security else Icons.Filled.BugReport,
                            color = if (state.isGuest) MaterialTheme.colorScheme.outline else MaterialTheme.colorScheme.signalTone
                        )
                    }
                    if (!state.isGuest) {
                        Text(
                            text = protectionScore.toString(),
                            style = MaterialTheme.typography.displayLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            if (!state.isGuest) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ShieldMetricTile(
                            modifier = Modifier.weight(1f),
                            title = "Приложений",
                            value = state.installedAppsCount.toString(),
                            support = "В пуле сканирования",
                            icon = Icons.Filled.Security,
                            accent = MaterialTheme.colorScheme.primary
                        )
                        ShieldMetricTile(
                            modifier = Modifier.weight(1f),
                            title = "Угроз",
                            value = state.totalThreatsEver.toString(),
                            support = if (state.totalThreatsEver == 0) "Пока чисто" else "Есть совпадения",
                            icon = Icons.Filled.BugReport,
                            accent = if (state.totalThreatsEver == 0) {
                                MaterialTheme.colorScheme.safeTone
                            } else {
                                MaterialTheme.colorScheme.warningTone
                            }
                        )
                    }
                }
            }

            item {
                ShieldSectionHeader(
                    eyebrow = "Режимы",
                    title = "Сканирование",
                    subtitle = if (state.isGuest) "Гостю доступен только быстрый режим" else "Выберите режим"
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    ModeGridCard(
                        modifier = Modifier.weight(1f),
                        title = "Быстрая",
                        subtitle = if (state.isGuest) {
                            if (state.guestScanUsed) "Лимит исчерпан" else "1 запуск"
                        } else {
                            "Локально"
                        },
                        icon = Icons.Filled.FlashOn,
                        accent = MaterialTheme.colorScheme.primary,
                        enabled = !state.isGuest || !state.guestScanUsed,
                        actionLabel = if (state.isGuest && state.guestScanUsed) "Войти" else "Старт",
                        onAction = {
                            if (state.isGuest && state.guestScanUsed) {
                                onOpenLogin()
                            } else {
                                onStartScan("QUICK")
                            }
                        }
                    )
                    ModeGridCard(
                        modifier = Modifier.weight(1f),
                        title = "Глубокая",
                        subtitle = if (state.isGuest) "Нужен вход" else "Сервер + локально",
                        icon = Icons.Filled.Security,
                        accent = MaterialTheme.colorScheme.tertiary,
                        enabled = !state.isGuest,
                        actionLabel = if (state.isGuest) "Войти" else "Старт",
                        onAction = {
                            if (state.isGuest) {
                                onOpenLogin()
                            } else {
                                onStartScan("FULL")
                            }
                        }
                    )
                }
            }

            if (state.isGuest && state.guestScanUsed) {
                item {
                    ShieldPanel(accent = MaterialTheme.colorScheme.secondary) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            TextButton(onClick = onOpenLogin) {
                                Text("Войти")
                            }
                            TextButton(onClick = onOpenRegister) {
                                Text("Регистрация")
                            }
                        }
                    }
                }
            }

            if (!state.isGuest) {
                item {
                    ShieldSectionHeader(
                        eyebrow = "История",
                        title = "Последние проверки",
                        subtitle = if (state.recentResults.isEmpty()) "Пока пусто" else "Свежие результаты"
                    )
                }

                if (state.recentResults.isEmpty()) {
                    item {
                        ShieldPanel(accent = MaterialTheme.colorScheme.surfaceVariant) {
                            Text(
                                text = "История пуста",
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Запустите быструю или глубокую проверку",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    items(state.recentResults, key = { it.id }) { result ->
                        val accent = if (result.threatsFound > 0) {
                            MaterialTheme.colorScheme.warningTone
                        } else {
                            MaterialTheme.colorScheme.safeTone
                        }
                        ShieldPanel(accent = accent) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = scanTypeLabel(result.scanType),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.Bold
                                )
                                ShieldStatusChip(
                                    label = if (result.threatsFound > 0) "Угроз: ${result.threatsFound}" else "Чисто",
                                    icon = if (result.threatsFound > 0) Icons.Filled.BugReport else Icons.Filled.Security,
                                    color = accent
                                )
                            }
                            Text(
                                text = "${result.totalScanned} пакетов • ${formatAbsoluteTime(result.completedAt)}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ModeGridCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accent: Color,
    enabled: Boolean,
    actionLabel: String,
    onAction: () -> Unit,
    modifier: Modifier = Modifier
) {
    val contentColor = if (enabled) accent else MaterialTheme.colorScheme.outline
    val containerColor = if (enabled) {
        accent.copy(alpha = 0.10f)
    } else {
        MaterialTheme.colorScheme.surface.copy(alpha = 0.82f)
    }

    Card(
        modifier = modifier.aspectRatio(1f),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = MaterialTheme.shapes.large
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(contentColor.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = contentColor)
            }
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.weight(1f))
            Button(
                onClick = onAction,
                modifier = Modifier.fillMaxWidth(),
                colors = ShieldPrimaryButtonColors(if (enabled) accent else MaterialTheme.colorScheme.outline),
                shape = MaterialTheme.shapes.medium
            ) {
                Text(actionLabel)
            }
        }
    }
}

private fun calculateProtectionScore(state: HomeUiState): Int {
    var score = 44
    if (state.isProtectionActive) score += 28 else score -= 18
    if (state.lastScanTime > System.currentTimeMillis() - 86_400_000L) score += 18
    if (state.totalThreatsEver == 0) score += 10 else score -= (state.totalThreatsEver * 4).coerceAtMost(28)
    if (state.totalScans > 2) score += 6
    return score.coerceIn(7, 99)
}

private fun formatTime(timestamp: Long): String {
    if (timestamp == 0L) return "ещё не запускалась"
    val delta = System.currentTimeMillis() - timestamp
    return when {
        delta < 60_000L -> "только что"
        delta < 3_600_000L -> "${delta / 60_000L} мин назад"
        delta < 86_400_000L -> "${delta / 3_600_000L} ч назад"
        else -> SimpleDateFormat("dd MMM, HH:mm", Locale("ru")).format(Date(timestamp))
    }
}

private fun formatAbsoluteTime(timestamp: Long): String =
    SimpleDateFormat("dd MMM, HH:mm", Locale("ru")).format(Date(timestamp))

private fun scanTypeLabel(scanType: String): String = when (scanType.uppercase()) {
    "QUICK" -> "Быстрая"
    "FULL" -> "Глубокая"
    "SELECTIVE" -> "Глубокая"
    else -> scanType
}
