package com.shield.antivirus.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat
import com.shield.antivirus.data.datastore.ThemeMode

private val ShieldLightColorScheme = lightColorScheme(
    primary = ShieldMint,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFB7FFF7),
    onPrimaryContainer = Color(0xFF00201E),
    secondary = ShieldInk,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFD5E4F7),
    onSecondaryContainer = Color(0xFF102030),
    tertiary = ShieldAmber,
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFFFDCC2),
    onTertiaryContainer = Color(0xFF311300),
    error = ShieldCoral,
    onError = Color.White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    background = ShieldCanvas,
    onBackground = Color(0xFF161C22),
    surface = Color(0xFFFFFBFE),
    onSurface = Color(0xFF161C22),
    surfaceVariant = Color(0xFFDCE4EA),
    onSurfaceVariant = Color(0xFF3F4850),
    outline = Color(0xFF6F7981),
    outlineVariant = Color(0xFFBEC8CF),
    inverseSurface = Color(0xFF2B3138),
    inverseOnSurface = Color(0xFFEDF1F5),
    inversePrimary = Color(0xFF7CE9DF),
    surfaceBright = Color(0xFFFFFBFE),
    surfaceContainerLowest = Color(0xFFFFFFFF),
    surfaceContainerLow = Color(0xFFF8FAFD),
    surfaceContainer = Color(0xFFF0F4F7),
    surfaceContainerHigh = Color(0xFFEAF0F3),
    surfaceContainerHighest = Color(0xFFE3E9ED)
)

private val ShieldDarkColorScheme = darkColorScheme(
    primary = Color(0xFF7CE9DF),
    onPrimary = Color(0xFF003734),
    primaryContainer = Color(0xFF00504C),
    onPrimaryContainer = Color(0xFF97FFF3),
    secondary = Color(0xFFB8C8DB),
    onSecondary = Color(0xFF223140),
    secondaryContainer = Color(0xFF394858),
    onSecondaryContainer = Color(0xFFD4E4F7),
    tertiary = Color(0xFFFFB77A),
    onTertiary = Color(0xFF4E2600),
    tertiaryContainer = Color(0xFF703A00),
    onTertiaryContainer = Color(0xFFFFDCC2),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    background = ShieldNight,
    onBackground = Color(0xFFE4E8EC),
    surface = ShieldNightSurface,
    onSurface = Color(0xFFE4E8EC),
    surfaceVariant = ShieldNightAccent,
    onSurfaceVariant = Color(0xFFBCC7CF),
    outline = Color(0xFF88929B),
    outlineVariant = Color(0xFF404A53),
    inverseSurface = Color(0xFFE4E8EC),
    inverseOnSurface = Color(0xFF2B3138),
    inversePrimary = ShieldMint,
    surfaceBright = Color(0xFF31383F),
    surfaceContainerLowest = Color(0xFF050C12),
    surfaceContainerLow = Color(0xFF10181F),
    surfaceContainer = Color(0xFF151E26),
    surfaceContainerHigh = Color(0xFF202931),
    surfaceContainerHighest = Color(0xFF2A343D)
)

private val ShieldShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(18.dp),
    medium = RoundedCornerShape(26.dp),
    large = RoundedCornerShape(34.dp),
    extraLarge = RoundedCornerShape(42.dp)
)

@Composable
fun ShieldAntivirusTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val darkTheme = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }
    val context = LocalContext.current
    val colorScheme: ColorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> ShieldDarkColorScheme
        else -> ShieldLightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                window.isNavigationBarContrastEnforced = false
            }
            WindowCompat.setDecorFitsSystemWindows(window, false)
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        shapes = ShieldShapes,
        typography = Typography,
        content = content
    )
}
