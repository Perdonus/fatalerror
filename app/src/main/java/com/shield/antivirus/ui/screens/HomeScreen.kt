package com.shield.antivirus.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.shield.antivirus.ui.components.ShieldActionCard
import com.shield.antivirus.ui.components.ShieldBackdrop
import com.shield.antivirus.ui.components.ShieldMetricTile
import com.shield.antivirus.ui.components.ShieldPanel
import com.shield.antivirus.ui.components.ShieldScreenScaffold
import com.shield.antivirus.ui.components.ShieldSectionHeader
import com.shield.antivirus.ui.components.ShieldStatusChip
import com.shield.antivirus.ui.theme.criticalTone
import com.shield.antivirus.ui.theme.safeTone
import com.shield.antivirus.ui.theme.signalTone
import com.shield.antivirus.ui.theme.warningTone
import com.shield.antivirus.viewmodel.HomeUiState
import com.shield.antivirus.viewmodel.HomeViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onStartScan: (String) -> Unit,
    onOpenHistory: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenLogin: () -> Unit,
    onOpenRegister: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val protectionScore = calculateProtectionScore(state)
    val statusColor = when {
        state.isGuest -> MaterialTheme.colorScheme.signalTone
        !state.isProtectionActive -> MaterialTheme.colorScheme.criticalTone
        state.totalThreatsEver > 0 -> MaterialTheme.colorScheme.warningTone
        else -> MaterialTheme.colorScheme.safeTone
    }

    ShieldBackdrop {
        ShieldScreenScaffold(
            title = "ShieldSecurity",
            subtitle = when {
                state.isGuest -> "Гостевой режим"
                state.userName.isBlank() -> "Пользователь"
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
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (state.isGuest) {
                    item {
                        ShieldPanel(accent = statusColor) {
                            Text(
                                text = if (state.guestScanUsed) "Гостевой доступ закончился" else "Доступна одна проверка",
                                style = MaterialTheme.typography.headlineSmall,
                                color = MaterialTheme.colorScheme.onSurface,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (state.guestScanUsed) "Лафа кончилась, пора регаться." else "История и фоновая защита недоступны.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    if (!state.guestScanUsed) {
                        item {
                            ShieldActionCard(
                                title = "Запустить проверку",
                                subtitle = "Один гостевой запуск",
                                meta = "Быстрый режим",
                                icon = Icons.Filled.FlashOn,
                                accent = MaterialTheme.colorScheme.primary,
                                onClick = { onStartScan("QUICK") }
                            )
                        }
                    } else {
                        item {
                            ShieldActionCard(
                                title = "Войти",
                                subtitle = "Чтобы продолжить",
                                meta = "Аккаунт",
                                icon = Icons.Filled.Security,
                                accent = MaterialTheme.colorScheme.primary,
                                onClick = onOpenLogin
                            )
                        }
                        item {
                            ShieldActionCard(
                                title = "Зарегистрироваться",
                                subtitle = "Открыть полный доступ",
                                meta = "Новый аккаунт",
                                icon = Icons.Filled.Security,
                                accent = MaterialTheme.colorScheme.tertiary,
                                onClick = onOpenRegister
                            )
                        }
                    }
                    return@LazyColumn
                }

                item {
                    ShieldPanel(accent = statusColor) {
                        ShieldSectionHeader(
                            eyebrow = "Статус",
                            title = when {
                                !state.isProtectionActive -> "Защита выключена"
                                state.totalThreatsEver > 0 -> "Есть угрозы"
                                else -> "Устройство защищено"
                            },
                            subtitle = "Последняя проверка ${formatTime(state.lastScanTime)}"
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            ShieldStatusChip(
                                label = if (state.isProtectionActive) "Защита включена" else "Защита выключена",
                                icon = Icons.Filled.Security,
                                color = statusColor
                            )
                            ShieldStatusChip(
                                label = "Индекс $protectionScore",
                                icon = Icons.Filled.TrackChanges,
                                color = MaterialTheme.colorScheme.signalTone
                            )
                        }
                        Text(
                            text = protectionScore.toString(),
                            style = MaterialTheme.typography.displayLarge,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ShieldMetricTile(
                            modifier = Modifier.weight(1f),
                            title = "Приложений",
                            value = state.installedAppsCount.toString(),
                            support = "В проверке",
                            icon = Icons.Filled.Security,
                            accent = MaterialTheme.colorScheme.primary
                        )
                        ShieldMetricTile(
                            modifier = Modifier.weight(1f),
                            title = "Угроз",
                            value = state.totalThreatsEver.toString(),
                            support = if (state.totalThreatsEver == 0) "Не найдено" else "Нужно проверить",
                            icon = Icons.Filled.BugReport,
                            accent = if (state.totalThreatsEver == 0) MaterialTheme.colorScheme.safeTone else MaterialTheme.colorScheme.warningTone
                        )
                    }
                }

                item {
                    ShieldMetricTile(
                        modifier = Modifier.fillMaxWidth(),
                        title = "Проверок",
                        value = state.totalScans.toString(),
                        support = if (state.totalScans == 0) "История пуста" else "Сохранено локально",
                        icon = Icons.Filled.History,
                        accent = MaterialTheme.colorScheme.signalTone
                    )
                }

                item {
                    ShieldSectionHeader(
                        eyebrow = "Сканирование",
                        title = "Новая проверка",
                        subtitle = "Выберите режим"
                    )
                }

                item {
                    ShieldActionCard(
                        title = "Быстрая проверка",
                        subtitle = "Недавние приложения",
                        meta = "До 30 пакетов",
                        icon = Icons.Filled.FlashOn,
                        accent = MaterialTheme.colorScheme.primary,
                        onClick = { onStartScan("QUICK") }
                    )
                }
                item {
                    ShieldActionCard(
                        title = "Полная проверка",
                        subtitle = "Все приложения",
                        meta = "Вся система",
                        icon = Icons.Filled.Security,
                        accent = MaterialTheme.colorScheme.tertiary,
                        onClick = { onStartScan("FULL") }
                    )
                }
                item {
                    ShieldActionCard(
                        title = "Выборочная проверка",
                        subtitle = "Отдельные приложения",
                        meta = "Ручной выбор",
                        icon = Icons.Filled.Tune,
                        accent = MaterialTheme.colorScheme.signalTone,
                        onClick = { onStartScan("SELECTIVE") }
                    )
                }

                item {
                    ShieldSectionHeader(
                        eyebrow = "История",
                        title = "Последние проверки",
                        subtitle = if (state.recentResults.isEmpty()) "История пуста" else "Последние результаты"
                    )
                }

                if (state.recentResults.isEmpty()) {
                    item {
                        ShieldPanel(accent = MaterialTheme.colorScheme.surfaceVariant) {
                            Text(
                                text = "Пока пусто",
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Запустите первую проверку",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    items(state.recentResults, key = { it.id }) { result ->
                        val accent = if (result.threatsFound > 0) MaterialTheme.colorScheme.warningTone else MaterialTheme.colorScheme.safeTone
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
    "QUICK" -> "Быстрая проверка"
    "FULL" -> "Полная проверка"
    "SELECTIVE" -> "Выборочная проверка"
    else -> scanType
}
