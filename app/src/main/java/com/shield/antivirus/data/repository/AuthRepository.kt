package com.shield.antivirus.data.repository

import android.content.Context
import com.shield.antivirus.data.api.ApiClient
import com.shield.antivirus.data.datastore.UserPreferences
import com.shield.antivirus.data.model.LoginRequest
import com.shield.antivirus.data.model.RegisterRequest
import com.shield.antivirus.data.model.User
import com.shield.antivirus.data.security.ShieldSessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.net.ssl.SSLException

sealed class AuthResult {
    data class Success(val user: User) : AuthResult()
    data class Error(val message: String) : AuthResult()
}

class AuthRepository(context: Context) {
    private val prefs = UserPreferences(context)
    private val sessionManager = ShieldSessionManager(context)

    suspend fun register(name: String, email: String, password: String): AuthResult =
        withContext(Dispatchers.IO) {
            try {
                if (name.isBlank() || email.isBlank() || password.isBlank()) {
                    return@withContext AuthResult.Error("All fields are required")
                }
                if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                    return@withContext AuthResult.Error("Invalid email address")
                }
                if (password.length < 6) {
                    return@withContext AuthResult.Error("Password must be at least 6 characters")
                }

                val response = ApiClient.executeShieldCall { api ->
                    api.register(
                        RegisterRequest(
                            name = name.trim(),
                            email = email.trim().lowercase(),
                            password = password,
                            deviceId = prefs.getOrCreateDeviceId()
                        )
                    )
                }
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true && body.user != null && sessionManager.persistAuth(body)) {
                        AuthResult.Success(User(body.user.id, body.user.name, body.user.email))
                    } else {
                        AuthResult.Error(body?.error ?: "Registration failed")
                    }
                } else {
                    val message = parseError(response.errorBody()?.string())
                        ?: if (response.code() == 404) {
                            "Auth API path is missing on the active backend. Check the deployed /api/auth routes."
                        } else {
                            "Registration failed (${response.code()})"
                        }
                    AuthResult.Error(message)
                }
            } catch (error: Exception) {
                AuthResult.Error(error.toUserMessage())
            }
        }

    suspend fun login(email: String, password: String): AuthResult =
        withContext(Dispatchers.IO) {
            try {
                if (email.isBlank() || password.isBlank()) {
                    return@withContext AuthResult.Error("Email and password required")
                }

                val response = ApiClient.executeShieldCall { api ->
                    api.login(
                        LoginRequest(
                            email = email.trim().lowercase(),
                            password = password,
                            deviceId = prefs.getOrCreateDeviceId()
                        )
                    )
                }
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true && body.user != null && sessionManager.persistAuth(body)) {
                        AuthResult.Success(User(body.user.id, body.user.name, body.user.email))
                    } else {
                        AuthResult.Error(body?.error ?: "Login failed")
                    }
                } else {
                    val message = parseError(response.errorBody()?.string())
                        ?: if (response.code() == 404) {
                            "Auth API path is missing on the active backend."
                        } else {
                            "Invalid email or password"
                        }
                    AuthResult.Error(message)
                }
            } catch (error: Exception) {
                AuthResult.Error(error.toUserMessage())
            }
        }

    suspend fun logout() {
        sessionManager.logoutRemoteIfPossible()
        sessionManager.clearLocalSession()
    }

    suspend fun verifyToken(): Boolean {
        return try {
            val token = sessionManager.getValidAccessToken()
            if (token.isNullOrBlank()) return false
            ApiClient.executeShieldCall { api ->
                api.getMe("Bearer $token")
            }.isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    private fun parseError(body: String?): String? {
        if (body.isNullOrBlank()) return null
        return try {
            val json = com.google.gson.JsonParser.parseString(body).asJsonObject
            when {
                json.get("error")?.isJsonPrimitive == true -> json.get("error").asString
                json.get("detail")?.isJsonPrimitive == true -> json.get("detail").asString
                json.get("message")?.isJsonPrimitive == true -> json.get("message").asString
                else -> null
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun Exception.toUserMessage(): String = when (this) {
        is ConnectException -> "Cannot connect to auth server. Check internet access or backend port 5001."
        is UnknownHostException -> "Shield domain could not be resolved. Check DNS or the direct VPS fallback."
        is SocketTimeoutException -> "Server timed out while authorizing. Try again in a moment."
        is SSLException -> "Secure connection failed. Check the SSL certificate on the primary domain."
        else -> message?.takeIf { it.isNotBlank() }?.let { "Error: $it" }
            ?: "Authorization request failed"
    }
}
