package com.neuralv.desktop.core.repository

import com.neuralv.desktop.core.api.DeviceIdentity
import com.neuralv.desktop.core.api.NeuralVApiClient
import com.neuralv.desktop.core.model.AuthChallengeMode
import com.neuralv.desktop.core.model.AuthResponse
import com.neuralv.desktop.core.model.ChallengeTicket
import com.neuralv.desktop.core.model.LoginStartRequest
import com.neuralv.desktop.core.model.RefreshSessionRequest
import com.neuralv.desktop.core.model.RegisterStartRequest
import com.neuralv.desktop.core.model.SessionState
import com.neuralv.desktop.core.model.VerifyChallengeRequest
import com.neuralv.desktop.core.service.SessionStore

class AuthRepository(
    private val apiClient: NeuralVApiClient,
    private val sessionStore: SessionStore,
    private val backendBaseUrl: String,
    private val deviceId: String = DeviceIdentity.generateDeviceId()
) {
    fun readCachedSession(): SessionState? = sessionStore.read()

    fun startRegister(name: String, email: String, password: String): ChallengeTicket {
        val response = apiClient.postChallenge(
            "/api/auth/register/start",
            RegisterStartRequest(name = name, email = email, password = password, deviceId = deviceId)
        )
        return ChallengeTicket(
            challengeId = requireNotNull(response.challengeId),
            expiresAt = requireNotNull(response.expiresAt),
            email = email,
            mode = AuthChallengeMode.REGISTER
        )
    }

    fun startLogin(email: String, password: String): ChallengeTicket {
        val response = apiClient.postChallenge(
            "/api/auth/login/start",
            LoginStartRequest(email = email, password = password, deviceId = deviceId)
        )
        return ChallengeTicket(
            challengeId = requireNotNull(response.challengeId),
            expiresAt = requireNotNull(response.expiresAt),
            email = email,
            mode = AuthChallengeMode.LOGIN
        )
    }

    fun verifyChallenge(ticket: ChallengeTicket, code: String): SessionState {
        val path = when (ticket.mode) {
            AuthChallengeMode.REGISTER -> "/api/auth/register/verify"
            AuthChallengeMode.LOGIN -> "/api/auth/login/verify"
        }
        val envelope = apiClient.postSession(
            path = path,
            payload = VerifyChallengeRequest(
                challengeId = ticket.challengeId,
                email = ticket.email,
                code = code,
                deviceId = deviceId
            )
        )
        return persist(envelope.toSessionState(deviceId, backendBaseUrl))
    }

    fun refreshOrNull(): SessionState? {
        val current = sessionStore.read() ?: return null
        return runCatching {
            val envelope = apiClient.postSession(
                path = "/api/auth/refresh",
                payload = RefreshSessionRequest(
                    refreshToken = current.refreshToken,
                    sessionId = current.sessionId,
                    deviceId = current.deviceId
                )
            )
            persist(envelope.toSessionState(current.deviceId, current.backendBaseUrl))
        }.getOrNull()
    }

    fun getActiveSession(): SessionState? = refreshOrNull() ?: sessionStore.read()

    fun logout() {
        sessionStore.read()?.let { current ->
            runCatching {
                apiClient.postSession(
                    path = "/api/auth/logout",
                    payload = emptyMap<String, String>(),
                    accessToken = current.accessToken
                )
            }
        }
        sessionStore.clear()
    }

    private fun persist(state: SessionState): SessionState = state.also(sessionStore::write)
}

private fun com.neuralv.desktop.core.model.SessionEnvelope.toSessionState(
    deviceId: String,
    backendBaseUrl: String
): SessionState = SessionState(
    accessToken = requireNotNull(token),
    refreshToken = requireNotNull(refreshToken),
    sessionId = requireNotNull(sessionId),
    accessTokenExpiresAt = requireNotNull(accessTokenExpiresAt),
    refreshTokenExpiresAt = requireNotNull(refreshTokenExpiresAt),
    user = requireNotNull(user),
    deviceId = deviceId,
    backendBaseUrl = backendBaseUrl
)
