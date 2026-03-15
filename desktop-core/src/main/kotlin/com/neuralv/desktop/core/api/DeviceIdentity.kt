package com.neuralv.desktop.core.api

import java.net.InetAddress
import java.util.UUID

object DeviceIdentity {
    fun bestEffortDeviceName(): String = runCatching {
        val host = InetAddress.getLocalHost().hostName
        if (host.isNullOrBlank()) "desktop" else host
    }.getOrDefault("desktop")

    fun generateDeviceId(): String = "desktop-" + UUID.randomUUID().toString()
}
