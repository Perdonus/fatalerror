package com.shield.antivirus.ui.screens

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import com.shield.antivirus.ui.components.ShieldBackdrop
import com.shield.antivirus.ui.components.ShieldBrandMark
import com.shield.antivirus.ui.components.ShieldPanel
import com.shield.antivirus.ui.components.ShieldPrimaryButtonColors
import com.shield.antivirus.ui.components.ShieldSectionHeader
import com.shield.antivirus.ui.components.ShieldStatusChip
import com.shield.antivirus.ui.theme.safeTone
import com.shield.antivirus.ui.theme.signalTone

@Composable
fun WelcomeScreen(
    onLoginClick: () -> Unit,
    onRegisterClick: () -> Unit
) {
    val heroMotion = rememberInfiniteTransition(label = "welcomeHero")
    val heroScale = heroMotion.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(4200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "heroScale"
    )

    ShieldBackdrop {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .imePadding()
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            Column(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .fillMaxWidth()
                    .padding(top = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                ShieldBrandMark(
                    modifier = Modifier.graphicsLayer {
                        scaleX = heroScale.value
                        scaleY = heroScale.value
                    }
                )
                ShieldSectionHeader(
                    eyebrow = "Shield cockpit",
                    title = "Shield Antivirus",
                    subtitle = "Локальное сканирование, фоновая защита 24/7 и синхронизация инцидентов без потери Material 3 dynamic colors."
                )
                Column(verticalArrangement = Arrangement.spacedBy(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    ShieldStatusChip(
                        label = "REALTIME 24/7",
                        icon = Icons.Filled.NotificationsActive,
                        color = MaterialTheme.colorScheme.safeTone
                    )
                    ShieldStatusChip(
                        label = "SYNCED AUTH",
                        icon = Icons.Filled.Security,
                        color = MaterialTheme.colorScheme.signalTone
                    )
                    ShieldStatusChip(
                        label = "MD3 EXPRESSIVE",
                        icon = Icons.Filled.AutoAwesome,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            ShieldPanel(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .navigationBarsPadding(),
                accent = MaterialTheme.colorScheme.primary
            ) {
                ShieldSectionHeader(
                    eyebrow = "Access",
                    title = "Вход в защитный кабинет",
                    subtitle = "Войди, чтобы вернуть синхронизированную историю, или создай нового оператора."
                )
                Button(
                    onClick = onLoginClick,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ShieldPrimaryButtonColors(),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text("Войти")
                }
                OutlinedButton(
                    onClick = onRegisterClick,
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text("Зарегистрироваться")
                }
                ShieldStatusChip(
                    label = "AUTOSTART ENABLED",
                    icon = Icons.Filled.Security,
                    color = MaterialTheme.colorScheme.tertiary
                )
            }
        }
    }
}
