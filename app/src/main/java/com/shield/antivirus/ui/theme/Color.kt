package com.shield.antivirus.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance

val ShieldMint = Color(0xFF006B68)
val ShieldMintBright = Color(0xFF00A99A)
val ShieldInk = Color(0xFF122130)
val ShieldSky = Color(0xFF5F7CFF)
val ShieldAmber = Color(0xFFC86A15)
val ShieldCoral = Color(0xFFBA1A1A)
val ShieldSafe = Color(0xFF1C8C46)
val ShieldWarning = Color(0xFFB75B00)
val ShieldCritical = Color(0xFFC62828)
val ShieldCanvas = Color(0xFFF3F6F8)
val ShieldCanvasWarm = Color(0xFFF8F1E8)
val ShieldNight = Color(0xFF08131D)
val ShieldNightSurface = Color(0xFF122231)
val ShieldNightAccent = Color(0xFF16374D)

val ColorScheme.safeTone: Color
    get() = if (background.luminance() > 0.5f) ShieldSafe else Color(0xFF6BDC90)

val ColorScheme.warningTone: Color
    get() = if (background.luminance() > 0.5f) ShieldWarning else Color(0xFFFFB870)

val ColorScheme.criticalTone: Color
    get() = if (background.luminance() > 0.5f) ShieldCritical else Color(0xFFFF8A80)

val ColorScheme.signalTone: Color
    get() = if (background.luminance() > 0.5f) ShieldSky else Color(0xFFB5C4FF)
