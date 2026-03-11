package com.shield.antivirus.navigation

sealed class Screen(val route: String) {
    data object Welcome : Screen("welcome")
    data object Login : Screen("login")
    data object Register : Screen("register")
    data object Home : Screen("home")
    data object Scan : Screen("scan/{scanType}") {
        fun createRoute(scanType: String) = "scan/$scanType"
    }
    data object Results : Screen("results/{scanId}") {
        fun createRoute(scanId: Long) = "results/$scanId"
    }
    data object History : Screen("history")
    data object Settings : Screen("settings")
}
