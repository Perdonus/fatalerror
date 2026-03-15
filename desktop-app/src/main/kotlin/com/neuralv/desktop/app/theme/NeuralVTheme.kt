package com.neuralv.desktop.app.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val NeuralVPrimary = Color(0xFF006B68)
private val NeuralVPrimaryBright = Color(0xFF00A99A)
private val NeuralVSignal = Color(0xFF5F7CFF)
private val NeuralVWarning = Color(0xFFB75B00)
private val NeuralVCritical = Color(0xFFC62828)
private val NeuralVInk = Color(0xFF122130)
private val NeuralVCanvas = Color(0xFFF3F6F8)
private val NeuralVNight = Color(0xFF08131D)
private val NeuralVNightSurface = Color(0xFF122231)
private val NeuralVNightAccent = Color(0xFF16374D)

private val appTypography = Typography(
    displayLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Black, fontSize = 48.sp, lineHeight = 52.sp),
    headlineLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 32.sp, lineHeight = 38.sp),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 26.sp),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = 16.sp, lineHeight = 22.sp),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 14.sp, lineHeight = 21.sp),
    labelLarge = TextStyle(fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Medium, fontSize = 13.sp)
)

private val appShapes = Shapes(
    extraSmall = androidx.compose.foundation.shape.RoundedCornerShape(10.dp),
    small = androidx.compose.foundation.shape.RoundedCornerShape(18.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(26.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(34.dp),
    extraLarge = androidx.compose.foundation.shape.RoundedCornerShape(42.dp)
)

private fun lightScheme(primary: Color): ColorScheme = lightColorScheme(
    primary = primary,
    onPrimary = Color.White,
    primaryContainer = primary.copy(alpha = 0.16f),
    onPrimaryContainer = NeuralVInk,
    secondary = NeuralVSignal,
    onSecondary = Color.White,
    secondaryContainer = NeuralVSignal.copy(alpha = 0.12f),
    tertiary = NeuralVWarning,
    onTertiary = Color.White,
    tertiaryContainer = NeuralVWarning.copy(alpha = 0.12f),
    error = NeuralVCritical,
    onError = Color.White,
    errorContainer = NeuralVCritical.copy(alpha = 0.14f),
    background = NeuralVCanvas,
    onBackground = NeuralVInk,
    surface = Color.White,
    onSurface = NeuralVInk,
    surfaceVariant = Color(0xFFE3E9ED),
    onSurfaceVariant = Color(0xFF41505B),
    outline = Color(0xFF6F7981),
    outlineVariant = Color(0xFFBEC8CF)
)

private fun darkScheme(primary: Color): ColorScheme = darkColorScheme(
    primary = primary.copy(alpha = 0.92f),
    onPrimary = NeuralVNight,
    primaryContainer = NeuralVPrimaryBright.copy(alpha = 0.22f),
    onPrimaryContainer = Color(0xFFE8FFFC),
    secondary = Color(0xFFB5C4FF),
    onSecondary = NeuralVNight,
    secondaryContainer = NeuralVSignal.copy(alpha = 0.28f),
    onSecondaryContainer = Color.White,
    tertiary = Color(0xFFFFB870),
    onTertiary = NeuralVNight,
    tertiaryContainer = NeuralVWarning.copy(alpha = 0.28f),
    onTertiaryContainer = Color.White,
    error = Color(0xFFFFB4AB),
    onError = NeuralVNight,
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    background = NeuralVNight,
    onBackground = Color(0xFFE4E8EC),
    surface = NeuralVNightSurface,
    onSurface = Color(0xFFE4E8EC),
    surfaceVariant = NeuralVNightAccent,
    onSurfaceVariant = Color(0xFFBCC7CF),
    outline = Color(0xFF88929B),
    outlineVariant = Color(0xFF404A53)
)

@Composable
fun NeuralVDesktopTheme(
    darkTheme: Boolean,
    dynamicAccentEnabled: Boolean,
    content: @Composable () -> Unit
) {
    val accent = remember(dynamicAccentEnabled) {
        if (dynamicAccentEnabled) WallpaperPaletteService.resolveDominantAccent() ?: NeuralVPrimary else NeuralVPrimary
    }
    MaterialTheme(
        colorScheme = if (darkTheme) darkScheme(accent) else lightScheme(accent),
        typography = appTypography,
        shapes = appShapes,
        content = content
    )
}
