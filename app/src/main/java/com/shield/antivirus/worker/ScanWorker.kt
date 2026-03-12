package com.shield.antivirus.worker

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.shield.antivirus.data.repository.ScanRepository
import com.shield.antivirus.util.AppLogger
import kotlinx.coroutines.flow.collect
import java.util.concurrent.TimeUnit

class ScanWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val packageName = inputData.getString(KEY_PACKAGE_NAME)?.trim().orEmpty()
        return try {
            val repo = ScanRepository(applicationContext)
            repo.startScan(
                scanType = "QUICK",
                selectedPackages = if (packageName.isNotBlank()) listOf(packageName) else emptyList(),
                resultScanTypeOverride = "QUICK_BG"
            ).collect()
            if (packageName.isNotBlank()) {
                AppLogger.log(
                    tag = "install_scan_worker",
                    message = "Install-triggered quick scan completed",
                    metadata = mapOf("package" to packageName)
                )
            }
            Result.success()
        } catch (e: Exception) {
            AppLogger.logError(
                tag = "install_scan_worker",
                message = "Install-triggered quick scan failed",
                error = e,
                metadata = mapOf("package" to packageName)
            )
            Result.failure()
        }
    }

    companion object {
        private const val KEY_PACKAGE_NAME = "package_name"
        private const val UNIQUE_PREFIX_INSTALL_SCAN = "install_scan_"

        fun enqueueInstallScan(context: Context, packageName: String) {
            val normalizedPackage = packageName.trim()
            if (normalizedPackage.isBlank()) return
            val request = OneTimeWorkRequestBuilder<ScanWorker>()
                .setInputData(
                    workDataOf(
                        KEY_PACKAGE_NAME to normalizedPackage
                    )
                )
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.NOT_REQUIRED)
                        .build()
                )
                .build()
            WorkManager.getInstance(context.applicationContext).enqueueUniqueWork(
                "$UNIQUE_PREFIX_INSTALL_SCAN$normalizedPackage",
                ExistingWorkPolicy.REPLACE,
                request
            )
        }

        fun schedulePeriodicScan(context: Context) {
            val request = PeriodicWorkRequestBuilder<ScanWorker>(24, TimeUnit.HOURS)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "periodic_scan",
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}
