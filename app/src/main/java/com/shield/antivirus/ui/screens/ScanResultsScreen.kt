package com.shield.antivirus.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.IconButton
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import com.shield.antivirus.data.model.ThreatInfo
import com.shield.antivirus.data.model.ThreatSeverity
import com.shield.antivirus.ui.components.ShieldBackdrop
import com.shield.antivirus.ui.components.ShieldBlockingLoadingOverlay
import com.shield.antivirus.ui.components.ShieldEmptyState
import com.shield.antivirus.ui.components.ShieldPanel
import com.shield.antivirus.ui.components.ShieldScreenScaffold
import com.shield.antivirus.ui.components.ShieldSectionHeader
import com.shield.antivirus.ui.components.ShieldLoadingState
import com.shield.antivirus.ui.components.ShieldStatusChip
import com.shield.antivirus.ui.theme.criticalTone
import com.shield.antivirus.ui.theme.safeTone
import com.shield.antivirus.ui.theme.signalTone
import com.shield.antivirus.ui.theme.warningTone
import com.shield.antivirus.viewmodel.ScanViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanResultsScreen(
    viewModel: ScanViewModel,
    scanId: Long,
    onOpenLogin: () -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val result by viewModel.currentResult.collectAsState()
    val isGuest by viewModel.isGuest.collectAsState()
    val isDeveloperMode by viewModel.isDeveloperMode.collectAsState()
    val reportDownloadState by viewModel.reportDownloadState.collectAsState()

    LaunchedEffect(scanId) {
        viewModel.loadResult(scanId)
    }
    LaunchedEffect(reportDownloadState.nonce) {
        val state = reportDownloadState
        if (state.nonce == 0L) return@LaunchedEffect
        val text = state.error ?: state.message
        if (!text.isNullOrBlank()) {
            Toast.makeText(context, text, Toast.LENGTH_SHORT).show()
        }
        viewModel.clearReportDownloadState()
    }

    ShieldBackdrop {
        ShieldScreenScaffold(
            title = "Результат",
            onBack = onBack
        ) { padding ->
            val current = result
            if (current == null) {
                ShieldLoadingState(modifier = Modifier.fillMaxSize())
                return@ShieldScreenScaffold
            }

            val accent = if (current.threatsFound > 0) {
                MaterialTheme.colorScheme.warningTone
            } else {
                MaterialTheme.colorScheme.safeTone
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                item {
                    ShieldPanel(accent = accent) {
                        ShieldSectionHeader(
                            eyebrow = "Итог",
                            title = if (current.threatsFound == 0) "Угроз не найдено" else "Найдены угрозы"
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            ShieldStatusChip(
                                label = if (current.threatsFound == 0) "Чисто" else "Угроз: ${current.threatsFound}",
                                icon = if (current.threatsFound == 0) Icons.Filled.CheckCircle else Icons.Filled.Warning,
                                color = accent
                            )
                            ShieldStatusChip(
                                label = formatResultsTime(current.completedAt),
                                icon = Icons.Filled.Security,
                                color = MaterialTheme.colorScheme.signalTone
                            )
                            }
                            if (isDeveloperMode) {
                                IconButton(
                                    onClick = { viewModel.downloadCurrentFullReport() },
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.signalTone.copy(alpha = 0.16f))
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Download,
                                        contentDescription = "Скачать полный отчёт",
                                        tint = MaterialTheme.colorScheme.signalTone
                                    )
                                }
                            }
                        }
                    }
                }

                if (current.threats.isEmpty()) {
                    item {
                        ShieldEmptyState(
                            icon = Icons.Filled.Security,
                            title = "Всё чисто",
                            subtitle = if (isGuest) "Гостевая проверка завершена" else "Защита активна"
                        )
                    }
                } else {
                    item {
                        ShieldSectionHeader(
                            eyebrow = "Угрозы",
                            title = "Найденные приложения"
                        )
                    }
                    itemsIndexed(
                        items = current.threats,
                        key = { index, threat ->
                            "${threat.packageName}|${threat.threatName}|$index"
                        }
                    ) { _, threat ->
                        ThreatCard(threat = threat)
                    }
                }
            }
                ShieldBlockingLoadingOverlay(
                    visible = reportDownloadState.isLoading,
                    dimmed = true
                )
            }
        }
    }
}

@Composable
private fun ThreatCard(
    threat: ThreatInfo
) {
    val accent = when (threat.severity) {
        ThreatSeverity.CRITICAL -> MaterialTheme.colorScheme.criticalTone
        ThreatSeverity.HIGH -> MaterialTheme.colorScheme.warningTone
        ThreatSeverity.MEDIUM -> MaterialTheme.colorScheme.tertiary
        ThreatSeverity.LOW -> MaterialTheme.colorScheme.signalTone
    }
    ShieldPanel(accent = accent) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = threat.appName,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            ShieldStatusChip(
                label = null,
                icon = severityIcon(threat.severity),
                color = accent
            )
        }
        Text(
            text = threat.threatName,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        if (!threat.summary.isNullOrBlank()) {
            Text(
                text = threat.summary.orEmpty(),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Text(
            text = threat.packageName,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun formatResultsTime(timestamp: Long): String =
    SimpleDateFormat("dd MMM, HH:mm", Locale("ru")).format(Date(timestamp))

private fun scanTypeLabel(scanType: String): String = when (scanType.uppercase()) {
    "QUICK" -> "Быстрая проверка"
    "QUICK_BG", "BACKGROUND_QUICK" -> "Быстрая проверка (фон)"
    "FULL" -> "Глубокая проверка"
    "SELECTIVE" -> "Выборочная проверка"
    "APK" -> "Проверка APK"
    else -> scanType
}

private fun severityIcon(severity: ThreatSeverity) = when (severity) {
    ThreatSeverity.CRITICAL -> Icons.Filled.Error
    ThreatSeverity.HIGH -> Icons.Filled.Warning
    ThreatSeverity.MEDIUM -> Icons.Filled.BugReport
    ThreatSeverity.LOW -> Icons.Filled.Info
}
