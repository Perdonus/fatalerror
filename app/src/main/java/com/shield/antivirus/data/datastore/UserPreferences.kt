package com.shield.antivirus.data.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.io.IOException
import java.util.UUID

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "shield_prefs")

enum class PendingAuthFlow {
    LOGIN,
    REGISTER;

    companion object {
        fun fromRaw(value: String?): PendingAuthFlow? =
            entries.firstOrNull { it.name == value }
    }
}

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK;

    companion object {
        fun fromRaw(value: String?): ThemeMode =
            entries.firstOrNull { it.name == value } ?: SYSTEM
    }
}

class UserPreferences(private val context: Context) {

    companion object {
        val KEY_IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        val KEY_USER_NAME = stringPreferencesKey("user_name")
        val KEY_USER_EMAIL = stringPreferencesKey("user_email")
        val KEY_USER_ID = stringPreferencesKey("user_id")
        val KEY_VT_API_KEY = stringPreferencesKey("vt_api_key")
        val KEY_REALTIME_PROT = booleanPreferencesKey("realtime_protection")
        val KEY_SCAN_ON_INSTALL = booleanPreferencesKey("scan_on_install")
        val KEY_LAST_SCAN_TIME = longPreferencesKey("last_scan_time")
        val KEY_TOTAL_THREATS = intPreferencesKey("total_threats_found")
        val KEY_AUTH_TOKEN = stringPreferencesKey("auth_token")
        val KEY_DEVICE_ID = stringPreferencesKey("device_id")
        val KEY_IS_GUEST = booleanPreferencesKey("is_guest")
        val KEY_GUEST_SCAN_USED = booleanPreferencesKey("guest_scan_used")
        val KEY_PENDING_AUTH_FLOW = stringPreferencesKey("pending_auth_flow")
        val KEY_PENDING_AUTH_CHALLENGE_ID = stringPreferencesKey("pending_auth_challenge_id")
        val KEY_PENDING_AUTH_EMAIL = stringPreferencesKey("pending_auth_email")
        val KEY_PENDING_AUTH_EXPIRES_AT = longPreferencesKey("pending_auth_expires_at")
        val KEY_ACTIVE_DEEP_SCAN_WORK_ID = stringPreferencesKey("active_deep_scan_work_id")
        val KEY_ACTIVE_DEEP_SCAN_TYPE = stringPreferencesKey("active_deep_scan_type")
        val KEY_ACTIVE_SCAN_TYPE = stringPreferencesKey("active_scan_type")
        val KEY_ACTIVE_SCAN_CURRENT_APP = stringPreferencesKey("active_scan_current_app")
        val KEY_ACTIVE_SCAN_PROGRESS = intPreferencesKey("active_scan_progress")
        val KEY_ACTIVE_SCAN_STARTED_AT = longPreferencesKey("active_scan_started_at")
        val KEY_THEME_MODE = stringPreferencesKey("theme_mode")
        val KEY_DYNAMIC_COLORS_ENABLED = booleanPreferencesKey("dynamic_colors_enabled")
        val KEY_IS_DEVELOPER_MODE = booleanPreferencesKey("is_developer_mode")
        val KEY_IS_PREMIUM = booleanPreferencesKey("is_premium")
    }

    val isLoggedIn: Flow<Boolean> = context.dataStore.data.preferenceFlow(KEY_IS_LOGGED_IN, false)
    val userName: Flow<String> = context.dataStore.data.preferenceFlow(KEY_USER_NAME, "")
    val userEmail: Flow<String> = context.dataStore.data.preferenceFlow(KEY_USER_EMAIL, "")
    val vtApiKey: Flow<String> = context.dataStore.data.preferenceFlow(KEY_VT_API_KEY, "")
    val realtimeProtection: Flow<Boolean> = context.dataStore.data.preferenceFlow(KEY_REALTIME_PROT, true)
    val scanOnInstall: Flow<Boolean> = context.dataStore.data.preferenceFlow(KEY_SCAN_ON_INSTALL, true)
    val authToken: Flow<String> = context.dataStore.data.preferenceFlow(KEY_AUTH_TOKEN, "")
    val userId: Flow<String> = context.dataStore.data.preferenceFlow(KEY_USER_ID, "")
    val lastScanTime: Flow<Long> = context.dataStore.data.preferenceFlow(KEY_LAST_SCAN_TIME, 0L)
    val isGuest: Flow<Boolean> = context.dataStore.data.preferenceFlow(KEY_IS_GUEST, false)
    val guestScanUsed: Flow<Boolean> = context.dataStore.data.preferenceFlow(KEY_GUEST_SCAN_USED, false)
    val pendingAuthFlow: Flow<PendingAuthFlow?> = context.dataStore.data
        .catchPreferences()
        .map { PendingAuthFlow.fromRaw(it[KEY_PENDING_AUTH_FLOW]) }
    val pendingAuthChallengeId: Flow<String> = context.dataStore.data.preferenceFlow(KEY_PENDING_AUTH_CHALLENGE_ID, "")
    val pendingAuthEmail: Flow<String> = context.dataStore.data.preferenceFlow(KEY_PENDING_AUTH_EMAIL, "")
    val pendingAuthExpiresAt: Flow<Long> = context.dataStore.data.preferenceFlow(KEY_PENDING_AUTH_EXPIRES_AT, 0L)
    val activeDeepScanWorkId: Flow<String> = context.dataStore.data.preferenceFlow(KEY_ACTIVE_DEEP_SCAN_WORK_ID, "")
    val activeDeepScanType: Flow<String> = context.dataStore.data.preferenceFlow(KEY_ACTIVE_DEEP_SCAN_TYPE, "")
    val activeScanType: Flow<String> = context.dataStore.data.preferenceFlow(KEY_ACTIVE_SCAN_TYPE, "")
    val activeScanCurrentApp: Flow<String> = context.dataStore.data.preferenceFlow(KEY_ACTIVE_SCAN_CURRENT_APP, "")
    val activeScanProgress: Flow<Int> = context.dataStore.data.preferenceFlow(KEY_ACTIVE_SCAN_PROGRESS, 0)
    val activeScanStartedAt: Flow<Long> = context.dataStore.data.preferenceFlow(KEY_ACTIVE_SCAN_STARTED_AT, 0L)
    val themeMode: Flow<ThemeMode> = context.dataStore.data
        .catchPreferences()
        .map { ThemeMode.fromRaw(it[KEY_THEME_MODE]) }
    val dynamicColorsEnabled: Flow<Boolean> =
        context.dataStore.data.preferenceFlow(KEY_DYNAMIC_COLORS_ENABLED, true)
    val isDeveloperMode: Flow<Boolean> =
        context.dataStore.data.preferenceFlow(KEY_IS_DEVELOPER_MODE, false)
    val isPremium: Flow<Boolean> =
        context.dataStore.data.preferenceFlow(KEY_IS_PREMIUM, false)

    suspend fun setLoggedIn(value: Boolean) {
        context.dataStore.edit { it[KEY_IS_LOGGED_IN] = value }
    }

    suspend fun saveUser(
        name: String,
        email: String,
        id: String,
        isPremium: Boolean = false,
        isDeveloperMode: Boolean = false
    ) {
        context.dataStore.edit {
            it[KEY_USER_NAME] = name
            it[KEY_USER_EMAIL] = email
            it[KEY_USER_ID] = id
            it[KEY_IS_LOGGED_IN] = true
            it[KEY_IS_GUEST] = false
            it[KEY_IS_PREMIUM] = isPremium
            it[KEY_IS_DEVELOPER_MODE] = isDeveloperMode
            it[KEY_REALTIME_PROT] = true
            it[KEY_SCAN_ON_INSTALL] = true
            it.remove(KEY_PENDING_AUTH_FLOW)
            it.remove(KEY_PENDING_AUTH_CHALLENGE_ID)
            it.remove(KEY_PENDING_AUTH_EMAIL)
            it.remove(KEY_PENDING_AUTH_EXPIRES_AT)
        }
    }

    suspend fun syncUserProfile(name: String, email: String, id: String) {
        context.dataStore.edit {
            it[KEY_USER_NAME] = name
            it[KEY_USER_EMAIL] = email
            it[KEY_USER_ID] = id
            it[KEY_IS_LOGGED_IN] = true
            it[KEY_IS_GUEST] = false
            it.remove(KEY_PENDING_AUTH_FLOW)
            it.remove(KEY_PENDING_AUTH_CHALLENGE_ID)
            it.remove(KEY_PENDING_AUTH_EMAIL)
            it.remove(KEY_PENDING_AUTH_EXPIRES_AT)
        }
    }

    suspend fun setAuthToken(token: String) {
        context.dataStore.edit { it[KEY_AUTH_TOKEN] = token }
    }

    suspend fun enterGuestMode() {
        context.dataStore.edit {
            it[KEY_IS_GUEST] = true
            it[KEY_IS_LOGGED_IN] = false
            it[KEY_IS_DEVELOPER_MODE] = false
            it[KEY_IS_PREMIUM] = false
            it[KEY_REALTIME_PROT] = false
            it[KEY_SCAN_ON_INSTALL] = false
            it[KEY_USER_NAME] = ""
            it[KEY_USER_EMAIL] = ""
            it[KEY_USER_ID] = ""
            it[KEY_AUTH_TOKEN] = ""
            it.remove(KEY_ACTIVE_DEEP_SCAN_WORK_ID)
            it.remove(KEY_ACTIVE_DEEP_SCAN_TYPE)
            it.remove(KEY_ACTIVE_SCAN_TYPE)
            it.remove(KEY_ACTIVE_SCAN_CURRENT_APP)
            it.remove(KEY_ACTIVE_SCAN_PROGRESS)
            it.remove(KEY_ACTIVE_SCAN_STARTED_AT)
        }
    }

    suspend fun enterGuestModeForDeveloper() {
        context.dataStore.edit {
            it[KEY_IS_GUEST] = true
            it[KEY_IS_LOGGED_IN] = true
            it[KEY_IS_DEVELOPER_MODE] = true
            it[KEY_REALTIME_PROT] = false
            it[KEY_SCAN_ON_INSTALL] = false
            it.remove(KEY_ACTIVE_DEEP_SCAN_WORK_ID)
            it.remove(KEY_ACTIVE_DEEP_SCAN_TYPE)
            it.remove(KEY_ACTIVE_SCAN_TYPE)
            it.remove(KEY_ACTIVE_SCAN_CURRENT_APP)
            it.remove(KEY_ACTIVE_SCAN_PROGRESS)
            it.remove(KEY_ACTIVE_SCAN_STARTED_AT)
        }
    }

    suspend fun exitGuestMode() {
        context.dataStore.edit { it[KEY_IS_GUEST] = false }
    }

    suspend fun markGuestScanUsed() {
        context.dataStore.edit { it[KEY_GUEST_SCAN_USED] = true }
    }

    suspend fun clearGuestScanUsed() {
        context.dataStore.edit { it[KEY_GUEST_SCAN_USED] = false }
    }

    suspend fun logout() {
        context.dataStore.edit {
            it[KEY_IS_LOGGED_IN] = false
            it[KEY_IS_GUEST] = false
            it[KEY_USER_NAME] = ""
            it[KEY_USER_EMAIL] = ""
            it[KEY_USER_ID] = ""
            it[KEY_AUTH_TOKEN] = ""
            it.remove(KEY_IS_DEVELOPER_MODE)
            it.remove(KEY_IS_PREMIUM)
            it.remove(KEY_PENDING_AUTH_FLOW)
            it.remove(KEY_PENDING_AUTH_CHALLENGE_ID)
            it.remove(KEY_PENDING_AUTH_EMAIL)
            it.remove(KEY_PENDING_AUTH_EXPIRES_AT)
            it.remove(KEY_ACTIVE_DEEP_SCAN_WORK_ID)
            it.remove(KEY_ACTIVE_DEEP_SCAN_TYPE)
            it.remove(KEY_ACTIVE_SCAN_TYPE)
            it.remove(KEY_ACTIVE_SCAN_CURRENT_APP)
            it.remove(KEY_ACTIVE_SCAN_PROGRESS)
            it.remove(KEY_ACTIVE_SCAN_STARTED_AT)
        }
    }

    suspend fun savePendingAuth(flow: PendingAuthFlow, challengeId: String, email: String, expiresAt: Long) {
        context.dataStore.edit {
            it[KEY_PENDING_AUTH_FLOW] = flow.name
            it[KEY_PENDING_AUTH_CHALLENGE_ID] = challengeId
            it[KEY_PENDING_AUTH_EMAIL] = email
            it[KEY_PENDING_AUTH_EXPIRES_AT] = expiresAt
        }
    }

    suspend fun clearPendingAuth(flow: PendingAuthFlow? = null) {
        context.dataStore.edit {
            val current = PendingAuthFlow.fromRaw(it[KEY_PENDING_AUTH_FLOW])
            if (flow == null || current == flow) {
                it.remove(KEY_PENDING_AUTH_FLOW)
                it.remove(KEY_PENDING_AUTH_CHALLENGE_ID)
                it.remove(KEY_PENDING_AUTH_EMAIL)
                it.remove(KEY_PENDING_AUTH_EXPIRES_AT)
            }
        }
    }

    suspend fun setVtApiKey(key: String) {
        context.dataStore.edit { it[KEY_VT_API_KEY] = key }
    }

    suspend fun setRealtimeProtection(enabled: Boolean) {
        context.dataStore.edit { it[KEY_REALTIME_PROT] = enabled }
    }

    suspend fun setScanOnInstall(enabled: Boolean) {
        context.dataStore.edit { it[KEY_SCAN_ON_INSTALL] = enabled }
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.dataStore.edit { it[KEY_THEME_MODE] = mode.name }
    }

    suspend fun setDynamicColorsEnabled(enabled: Boolean) {
        context.dataStore.edit { it[KEY_DYNAMIC_COLORS_ENABLED] = enabled }
    }

    suspend fun syncDeveloperModeFromServer(enabled: Boolean) {
        context.dataStore.edit { it[KEY_IS_DEVELOPER_MODE] = enabled }
    }

    suspend fun syncPremiumFromServer(enabled: Boolean) {
        context.dataStore.edit { it[KEY_IS_PREMIUM] = enabled }
    }

    suspend fun updateLastScanTime() {
        context.dataStore.edit { it[KEY_LAST_SCAN_TIME] = System.currentTimeMillis() }
    }

    suspend fun setActiveDeepScan(workId: String, scanType: String) {
        context.dataStore.edit {
            it[KEY_ACTIVE_DEEP_SCAN_WORK_ID] = workId
            it[KEY_ACTIVE_DEEP_SCAN_TYPE] = scanType
        }
    }

    suspend fun clearActiveDeepScan() {
        context.dataStore.edit {
            it.remove(KEY_ACTIVE_DEEP_SCAN_WORK_ID)
            it.remove(KEY_ACTIVE_DEEP_SCAN_TYPE)
        }
    }

    suspend fun tryAcquireActiveScan(scanType: String, initialApp: String = "Подготовка"): Boolean {
        var acquired = false
        context.dataStore.edit {
            val existing = it[KEY_ACTIVE_SCAN_TYPE].orEmpty()
            if (existing.isBlank()) {
                it[KEY_ACTIVE_SCAN_TYPE] = scanType
                it[KEY_ACTIVE_SCAN_CURRENT_APP] = initialApp
                it[KEY_ACTIVE_SCAN_PROGRESS] = 0
                it[KEY_ACTIVE_SCAN_STARTED_AT] = System.currentTimeMillis()
                acquired = true
            }
        }
        return acquired
    }

    suspend fun updateActiveScan(scanType: String, currentApp: String, scanned: Int, total: Int) {
        context.dataStore.edit {
            if (it[KEY_ACTIVE_SCAN_TYPE].orEmpty() == scanType) {
                it[KEY_ACTIVE_SCAN_CURRENT_APP] = currentApp
                it[KEY_ACTIVE_SCAN_PROGRESS] = if (total <= 0) 0 else (((scanned.coerceAtLeast(0)).toFloat() / total.toFloat()) * 100f).toInt()
            }
        }
    }

    suspend fun clearActiveScan(scanType: String? = null) {
        context.dataStore.edit {
            val existing = it[KEY_ACTIVE_SCAN_TYPE].orEmpty()
            if (scanType == null || existing == scanType || existing.isBlank()) {
                it.remove(KEY_ACTIVE_SCAN_TYPE)
                it.remove(KEY_ACTIVE_SCAN_CURRENT_APP)
                it.remove(KEY_ACTIVE_SCAN_PROGRESS)
                it.remove(KEY_ACTIVE_SCAN_STARTED_AT)
            }
        }
    }

    suspend fun getOrCreateDeviceId(): String {
        val existing = context.dataStore.data.preferenceFlow(KEY_DEVICE_ID, "").first().trim()
        if (existing.isNotBlank()) return existing

        val generated = UUID.randomUUID().toString()
        context.dataStore.edit { it[KEY_DEVICE_ID] = generated }
        return generated
    }
}

private fun <T> Flow<Preferences>.preferenceFlow(key: Preferences.Key<T>, defaultValue: T): Flow<T> =
    catchPreferences().map { it[key] ?: defaultValue }

private fun Flow<Preferences>.catchPreferences(): Flow<Preferences> =
    catch { if (it is IOException) emit(emptyPreferences()) else throw it }
