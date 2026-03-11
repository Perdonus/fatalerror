package com.shield.antivirus.util

import android.content.Context
import android.content.Intent
import android.os.Build
import com.shield.antivirus.data.datastore.UserPreferences
import com.shield.antivirus.service.AntivirusService
import kotlinx.coroutines.flow.first

object ProtectionServiceController {
    suspend fun sync(context: Context) {
        val prefs = UserPreferences(context.applicationContext)
        val shouldRun = prefs.isLoggedIn.first() && !prefs.isGuest.first() && prefs.realtimeProtection.first()
        if (shouldRun) {
            start(context)
        } else {
            stop(context)
        }
    }

    fun start(context: Context) {
        val appContext = context.applicationContext
        val intent = Intent(appContext, AntivirusService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            appContext.startForegroundService(intent)
        } else {
            appContext.startService(intent)
        }
    }

    fun stop(context: Context) {
        context.applicationContext.stopService(Intent(context.applicationContext, AntivirusService::class.java))
    }
}
