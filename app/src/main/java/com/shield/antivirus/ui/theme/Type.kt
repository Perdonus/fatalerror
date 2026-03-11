package com.shield.antivirus.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val DisplayFamily = FontFamily.Serif
private val BodyFamily = FontFamily.SansSerif
private val MetricFamily = FontFamily.Monospace

val Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = DisplayFamily,
        fontWeight = FontWeight.Black,
        fontSize = 56.sp,
        lineHeight = 60.sp,
        letterSpacing = (-1.2).sp
    ),
    displayMedium = TextStyle(
        fontFamily = DisplayFamily,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 44.sp,
        lineHeight = 48.sp,
        letterSpacing = (-0.7).sp
    ),
    headlineLarge = TextStyle(
        fontFamily = DisplayFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 34.sp,
        lineHeight = 40.sp,
        letterSpacing = (-0.4).sp
    ),
    headlineMedium = TextStyle(
        fontFamily = DisplayFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 34.sp
    ),
    titleLarge = TextStyle(
        fontFamily = BodyFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 26.sp
    ),
    titleMedium = TextStyle(
        fontFamily = BodyFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = BodyFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = BodyFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 21.sp
    ),
    labelLarge = TextStyle(
        fontFamily = MetricFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 18.sp,
        letterSpacing = 0.3.sp
    ),
    labelMedium = TextStyle(
        fontFamily = MetricFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.35.sp
    ),
    labelSmall = TextStyle(
        fontFamily = MetricFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        letterSpacing = 0.4.sp
    )
)
