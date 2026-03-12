package com.shield.antivirus.navigation

import android.net.Uri

sealed class Screen(val route: String) {
    data object Welcome : Screen("welcome")
    data object Login : Screen("login")
    data object Register : Screen("register")
    data object Home : Screen("home")
    data object ResetPassword : Screen("reset-password?token={token}&email={email}") {
        fun createRoute(token: String, email: String) = "reset-password?token=$token&email=$email"
    }
    data object Scan : Screen("scan/{scanType}?selectedPackage={selectedPackage}&apkUri={apkUri}") {
        fun createRoute(
            scanType: String,
            selectedPackage: String? = null,
            apkUri: String? = null
        ): String {
            val encodedPackage = Uri.encode(selectedPackage.orEmpty())
            val encodedApkUri = Uri.encode(apkUri.orEmpty())
            return "scan/$scanType?selectedPackage=$encodedPackage&apkUri=$encodedApkUri"
        }
    }
    data object Results : Screen("results/{scanId}") {
        fun createRoute(scanId: Long) = "results/$scanId"
    }
    data object History : Screen("history")
    data object Settings : Screen("settings")
}
