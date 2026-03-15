package com.neuralv.desktop.app.theme

import androidx.compose.ui.graphics.Color

data class NeuralVPalette(
    val primary: Color,
    val primaryContainer: Color,
    val secondary: Color,
    val tertiary: Color,
    val background: Color,
    val surface: Color,
    val surfaceVariant: Color,
    val outline: Color,
    val danger: Color,
    val success: Color,
    val source: String
)

object NeuralVPalettes {
    val fallback = NeuralVPalette(
        primary = Color(0xFF00A99A),
        primaryContainer = Color(0xFFB6FFF6),
        secondary = Color(0xFF31435A),
        tertiary = Color(0xFFFF9F4A),
        background = Color(0xFFF4F7FB),
        surface = Color(0xFFFFFFFF),
        surfaceVariant = Color(0xFFDCE6F2),
        outline = Color(0xFF7A8798),
        danger = Color(0xFFCC2A3A),
        success = Color(0xFF1F8C55),
        source = "brand"
    )
}
