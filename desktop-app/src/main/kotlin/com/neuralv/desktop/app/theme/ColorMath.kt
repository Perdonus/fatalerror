package com.neuralv.desktop.app.theme

import androidx.compose.ui.graphics.Color

fun Color.mix(other: Color, ratio: Float): Color {
    val t = ratio.coerceIn(0f, 1f)
    return Color(
        red = red + (other.red - red) * t,
        green = green + (other.green - green) * t,
        blue = blue + (other.blue - blue) * t,
        alpha = 1f
    )
}

fun Color.boost(saturation: Float, value: Float): Color {
    val hsv = FloatArray(3)
    java.awt.Color.RGBtoHSB((red * 255).toInt(), (green * 255).toInt(), (blue * 255).toInt(), hsv)
    return Color(java.awt.Color.HSBtoRGB(hsv[0], (hsv[1] * saturation).coerceIn(0f, 1f), value.coerceIn(0f, 1f)))
}

fun Color.rotateWarm(): Color {
    val hsv = FloatArray(3)
    java.awt.Color.RGBtoHSB((red * 255).toInt(), (green * 255).toInt(), (blue * 255).toInt(), hsv)
    return Color(java.awt.Color.HSBtoRGB((hsv[0] + 0.08f) % 1f, (hsv[1] * 0.85f).coerceIn(0f, 1f), 0.95f))
}
