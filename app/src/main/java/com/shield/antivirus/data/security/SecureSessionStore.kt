package com.shield.antivirus.data.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONObject
import java.io.File

data class StoredSession(
    val accessToken: String,
    val refreshToken: String,
    val sessionId: String,
    val accessTokenExpiresAt: Long,
    val refreshTokenExpiresAt: Long,
    val userId: String? = null,
    val userName: String? = null,
    val userEmail: String? = null,
    val isPremium: Boolean? = null,
    val premiumExpiresAt: Long? = null,
    val isDeveloperMode: Boolean? = null
) {
    fun isAccessTokenFresh(now: Long = System.currentTimeMillis(), skewMs: Long = 60_000L): Boolean {
        return accessToken.isNotBlank() && accessTokenExpiresAt > now + skewMs
    }

    fun isRefreshTokenAlive(now: Long = System.currentTimeMillis()): Boolean {
        return refreshToken.isNotBlank() && refreshTokenExpiresAt > now
    }
}

class SecureSessionStore(context: Context) {
    private val appContext = context.applicationContext
    private val legacyPreferences: SharedPreferences by lazy {
        val masterKey = MasterKey.Builder(appContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            appContext,
            PREF_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }
    private val sessionFile: File by lazy {
        File(appContext.filesDir, "session/shield.session")
    }
    private val legacySessionFile: File by lazy {
        File(appContext.filesDir, "session/shield_session.json")
    }

    fun getSession(): StoredSession? {
        readSessionFile(sessionFile)?.let { return it }

        readSessionFile(legacySessionFile)?.let { legacyFileSession ->
            writeSessionFile(legacyFileSession)
            runCatching { legacySessionFile.delete() }
            clearLegacyPreferences()
            return legacyFileSession
        }

        val legacyPreferenceSession = readLegacyPreferenceSession() ?: return null
        writeSessionFile(legacyPreferenceSession)
        clearLegacyPreferences()
        return legacyPreferenceSession
    }

    fun saveSession(session: StoredSession) {
        writeSessionFile(session)
        clearLegacyPreferences()
    }

    fun clear() {
        clearLegacyPreferences()
        runCatching { sessionFile.delete() }
        runCatching { legacySessionFile.delete() }
    }

    private fun readLegacyPreferenceSession(): StoredSession? {
        val accessToken = legacyPreferences.getString(KEY_ACCESS_TOKEN, "").orEmpty()
        val refreshToken = legacyPreferences.getString(KEY_REFRESH_TOKEN, "").orEmpty()
        val sessionId = legacyPreferences.getString(KEY_SESSION_ID, "").orEmpty()
        if (accessToken.isBlank() || refreshToken.isBlank() || sessionId.isBlank()) {
            return null
        }

        return StoredSession(
            accessToken = accessToken,
            refreshToken = refreshToken,
            sessionId = sessionId,
            accessTokenExpiresAt = legacyPreferences.getLong(KEY_ACCESS_TOKEN_EXPIRES_AT, 0L),
            refreshTokenExpiresAt = legacyPreferences.getLong(KEY_REFRESH_TOKEN_EXPIRES_AT, 0L),
            userId = legacyPreferences.getString(KEY_USER_ID, "").orEmpty().ifBlank { null },
            userName = legacyPreferences.getString(KEY_USER_NAME, "").orEmpty().ifBlank { null },
            userEmail = legacyPreferences.getString(KEY_USER_EMAIL, "").orEmpty().ifBlank { null },
            isPremium = if (legacyPreferences.contains(KEY_IS_PREMIUM)) {
                legacyPreferences.getBoolean(KEY_IS_PREMIUM, false)
            } else {
                null
            },
            premiumExpiresAt = if (legacyPreferences.contains(KEY_PREMIUM_EXPIRES_AT)) {
                legacyPreferences.getLong(KEY_PREMIUM_EXPIRES_AT, 0L)
            } else {
                null
            },
            isDeveloperMode = if (legacyPreferences.contains(KEY_IS_DEVELOPER_MODE)) {
                legacyPreferences.getBoolean(KEY_IS_DEVELOPER_MODE, false)
            } else {
                null
            }
        )
    }

    private fun readSessionFile(file: File): StoredSession? = runCatching {
        if (!file.exists()) {
            return@runCatching null
        }
        val payload = JSONObject(file.readText(Charsets.UTF_8))
        val accessToken = payload.optString(KEY_ACCESS_TOKEN, "")
        val refreshToken = payload.optString(KEY_REFRESH_TOKEN, "")
        val sessionId = payload.optString(KEY_SESSION_ID, "")
        if (accessToken.isBlank() || refreshToken.isBlank() || sessionId.isBlank()) {
            return@runCatching null
        }

        StoredSession(
            accessToken = accessToken,
            refreshToken = refreshToken,
            sessionId = sessionId,
            accessTokenExpiresAt = payload.optLong(KEY_ACCESS_TOKEN_EXPIRES_AT, 0L),
            refreshTokenExpiresAt = payload.optLong(KEY_REFRESH_TOKEN_EXPIRES_AT, 0L),
            userId = payload.optString(KEY_USER_ID, "").ifBlank { null },
            userName = payload.optString(KEY_USER_NAME, "").ifBlank { null },
            userEmail = payload.optString(KEY_USER_EMAIL, "").ifBlank { null },
            isPremium = payload.takeIf { it.has(KEY_IS_PREMIUM) }?.optBoolean(KEY_IS_PREMIUM),
            premiumExpiresAt = payload.takeIf { it.has(KEY_PREMIUM_EXPIRES_AT) }?.optLong(KEY_PREMIUM_EXPIRES_AT),
            isDeveloperMode = payload.takeIf { it.has(KEY_IS_DEVELOPER_MODE) }?.optBoolean(KEY_IS_DEVELOPER_MODE)
        )
    }.getOrNull()

    private fun writeSessionFile(session: StoredSession) {
        runCatching {
            sessionFile.parentFile?.mkdirs()
            val tempFile = File(sessionFile.parentFile, "${sessionFile.name}.tmp")
            val payload = JSONObject().apply {
                put(KEY_ACCESS_TOKEN, session.accessToken)
                put(KEY_REFRESH_TOKEN, session.refreshToken)
                put(KEY_SESSION_ID, session.sessionId)
                put(KEY_ACCESS_TOKEN_EXPIRES_AT, session.accessTokenExpiresAt)
                put(KEY_REFRESH_TOKEN_EXPIRES_AT, session.refreshTokenExpiresAt)
                put(KEY_USER_ID, session.userId.orEmpty())
                put(KEY_USER_NAME, session.userName.orEmpty())
                put(KEY_USER_EMAIL, session.userEmail.orEmpty())
                session.isPremium?.let { put(KEY_IS_PREMIUM, it) }
                session.premiumExpiresAt?.let { put(KEY_PREMIUM_EXPIRES_AT, it) }
                session.isDeveloperMode?.let { put(KEY_IS_DEVELOPER_MODE, it) }
            }
            tempFile.writeText(payload.toString(), Charsets.UTF_8)
            if (!tempFile.renameTo(sessionFile)) {
                tempFile.copyTo(sessionFile, overwrite = true)
                tempFile.delete()
            }
        }
    }

    private fun clearLegacyPreferences() {
        legacyPreferences.edit().clear().apply()
    }

    companion object {
        private const val PREF_NAME = "shield_secure_session"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_SESSION_ID = "session_id"
        private const val KEY_ACCESS_TOKEN_EXPIRES_AT = "access_token_expires_at"
        private const val KEY_REFRESH_TOKEN_EXPIRES_AT = "refresh_token_expires_at"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_IS_PREMIUM = "is_premium"
        private const val KEY_PREMIUM_EXPIRES_AT = "premium_expires_at"
        private const val KEY_IS_DEVELOPER_MODE = "is_developer_mode"
    }
}
