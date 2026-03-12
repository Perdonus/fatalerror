package com.shield.antivirus.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.shield.antivirus.data.datastore.UserPreferences
import com.shield.antivirus.util.AppLogger
import com.shield.antivirus.worker.ScanWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class AppInstallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val packageName = intent.data?.schemeSpecificPart ?: return
        val action = intent.action ?: return

        if (action == Intent.ACTION_PACKAGE_ADDED || action == Intent.ACTION_PACKAGE_REPLACED) {
            val pendingResult = goAsync()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val prefs = UserPreferences(context)
                    val scanOnInstall = prefs.scanOnInstall.first()
                    val isGuest = prefs.isGuest.first()
                    val isLoggedIn = prefs.isLoggedIn.first()
                    if (scanOnInstall && isLoggedIn && !isGuest) {
                        ScanWorker.enqueueInstallScan(context, packageName)
                        AppLogger.log(
                            tag = "install_receiver",
                            message = "Queued install scan",
                            metadata = mapOf(
                                "package" to packageName,
                                "action" to action
                            )
                        )
                    }
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}
