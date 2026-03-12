package com.shield.antivirus.data.scanner

import android.content.Context
import com.google.gson.Gson
import com.shield.antivirus.R
import com.shield.antivirus.data.model.AppInfo
import com.shield.antivirus.data.model.ThreatInfo
import com.shield.antivirus.data.model.ThreatSeverity
import com.shield.antivirus.util.HashUtils
import java.io.File

data class LocalThreatIntel(
    val trustedInstallers: List<String> = emptyList(),
    val suspiciousKeywords: List<String> = emptyList(),
    val riskyPermissions: List<String> = emptyList(),
    val highRiskPermissionCombos: List<List<String>> = emptyList(),
    val blockedPackagePrefixes: List<String> = emptyList(),
    val blockedHashes: List<String> = emptyList()
)

class LocalThreatDetector(context: Context) {
    private val appContext = context.applicationContext
    private val intel: LocalThreatIntel by lazy {
        appContext.resources.openRawResource(R.raw.local_threat_intel).bufferedReader().use { reader ->
            Gson().fromJson(reader, LocalThreatIntel::class.java)
        }
    }

    fun scan(app: AppInfo): ThreatInfo? {
        if (app.isSystemApp) return null

        val normalizedPackage = app.packageName.lowercase()
        val normalizedName = app.appName.lowercase()
        val permissions = app.requestedPermissions.toSet()
        val trustedInstallers = intel.trustedInstallers.map { it.lowercase() }.toSet()
        val installer = app.installerPackage?.lowercase().orEmpty()
        val hasTrustedInstaller = installer.isNotBlank() && installer in trustedInstallers
        val apkHash = if (intel.blockedHashes.isNotEmpty()) {
            app.sha256.ifBlank { HashUtils.sha256(File(app.apkPath)).orEmpty() }
        } else {
            ""
        }

        if (apkHash.isNotBlank() && intel.blockedHashes.any { it.equals(apkHash, ignoreCase = true) }) {
            return ThreatInfo(
                packageName = app.packageName,
                appName = app.appName,
                threatName = "Локальная сигнатура",
                severity = ThreatSeverity.CRITICAL,
                detectionEngine = "Shield локальные правила",
                detectionCount = 1,
                totalEngines = 1,
                summary = "Хэш APK совпал с локально заблокированной сигнатурой."
            )
        }

        if (intel.blockedPackagePrefixes.any { normalizedPackage.startsWith(it.lowercase()) }) {
            return ThreatInfo(
                packageName = app.packageName,
                appName = app.appName,
                threatName = "Запрещённое семейство пакетов",
                severity = ThreatSeverity.HIGH,
                detectionEngine = "Shield локальные правила",
                detectionCount = 1,
                totalEngines = 1,
                summary = "Имя пакета попало под локальное правило по известному семейству."
            )
        }

        val keywordHits = intel.suspiciousKeywords.filter { keyword ->
            normalizedPackage.contains(keyword) || normalizedName.contains(keyword)
        }
        val riskyPermissions = permissions.intersect(intel.riskyPermissions.toSet())
        val matchedCombos = intel.highRiskPermissionCombos.filter { combo ->
            combo.all { permissions.contains(it) }
        }
        val hasAccessibilityOverlay = permissions.contains("android.permission.BIND_ACCESSIBILITY_SERVICE") &&
            permissions.contains("android.permission.SYSTEM_ALERT_WINDOW")
        val hasSmsTriad = permissions.contains("android.permission.RECEIVE_SMS") &&
            permissions.contains("android.permission.READ_SMS") &&
            permissions.contains("android.permission.SEND_SMS")
        val hasInstallerQueryCombo = permissions.contains("android.permission.REQUEST_INSTALL_PACKAGES") &&
            permissions.contains("android.permission.QUERY_ALL_PACKAGES")
        val hasBehaviorRedFlags = app.isDebuggable || app.usesCleartextTraffic
        val untrustedInstaller = installer.isBlank() || !hasTrustedInstaller
        val hasStrongSignal = matchedCombos.isNotEmpty() || hasAccessibilityOverlay || hasSmsTriad || hasInstallerQueryCombo

        // Keyword-only hits from official apps often produce false positives.
        if (!hasStrongSignal && keywordHits.isNotEmpty() && hasTrustedInstaller && !hasBehaviorRedFlags) {
            return null
        }

        val score = buildRiskScore(
            keywordHits = keywordHits.size,
            riskyPermissionCount = riskyPermissions.size,
            comboCount = matchedCombos.size,
            hasStrongSignal = hasStrongSignal,
            untrustedInstaller = untrustedInstaller,
            hasBehaviorRedFlags = hasBehaviorRedFlags
        )
        if (score < 7) return null

        val severity = when {
            score >= 14 -> ThreatSeverity.HIGH
            score >= 10 -> ThreatSeverity.MEDIUM
            else -> ThreatSeverity.LOW
        }

        val threatName = when {
            matchedCombos.isNotEmpty() -> "Эвристика: опасные разрешения"
            keywordHits.isNotEmpty() -> "Эвристика: подозрительные признаки"
            else -> "Эвристика: рискованная установка"
        }

        return ThreatInfo(
            packageName = app.packageName,
            appName = app.appName,
            threatName = threatName,
            severity = severity,
            detectionEngine = "Shield локальные правила",
            detectionCount = (keywordHits.size + matchedCombos.size + if (hasStrongSignal) 1 else 0).coerceAtLeast(1),
            totalEngines = (riskyPermissions.size + if (hasBehaviorRedFlags) 1 else 0).coerceAtLeast(1),
            summary = buildString {
                if (keywordHits.isNotEmpty()) {
                    append("Ключевые слова: ${keywordHits.joinToString()}. ")
                }
                if (matchedCombos.isNotEmpty()) {
                    append("Опасные комбинации разрешений: ${matchedCombos.size}. ")
                }
                if (hasBehaviorRedFlags) {
                    append("Есть признаки небезопасной сборки (debug/cleartext). ")
                }
                if (untrustedInstaller) {
                    append("Источник установки не доверенный.")
                }
            }.trim()
        )
    }

    private fun buildRiskScore(
        keywordHits: Int,
        riskyPermissionCount: Int,
        comboCount: Int,
        hasStrongSignal: Boolean,
        untrustedInstaller: Boolean,
        hasBehaviorRedFlags: Boolean
    ): Int {
        var score = 0
        score += (keywordHits.coerceAtMost(2) * 1)
        score += (riskyPermissionCount.coerceAtMost(4) * 1)
        score += (comboCount * 5)
        if (hasStrongSignal) score += 3
        if (hasBehaviorRedFlags) score += 2
        if (untrustedInstaller && (hasStrongSignal || hasBehaviorRedFlags || keywordHits > 0)) score += 1
        return score
    }
}
