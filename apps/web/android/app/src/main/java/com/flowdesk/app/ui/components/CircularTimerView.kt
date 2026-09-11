package com.flowdesk.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.ui.theme.FlowDeskColors

@Composable
fun CircularTimerView(
    elapsedSeconds: Int,
    totalPlannedMinutes: Int,
    isRunning: Boolean,
    modifier: Modifier = Modifier,
    size: Dp = 140.dp
) {
    val totalPlannedSeconds = (totalPlannedMinutes * 60).coerceAtLeast(1)
    val remainingSeconds = (totalPlannedSeconds - elapsedSeconds).coerceAtLeast(0)

    val progress = (remainingSeconds.toFloat() / totalPlannedSeconds.toFloat()).coerceIn(0f, 1f)

    val hours = remainingSeconds / 3600
    val minutes = (remainingSeconds % 3600) / 60
    val seconds = remainingSeconds % 60

    val timeString = if (hours > 0) {
        String.format("%02d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format("%02d:%02d", minutes, seconds)
    }

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier.size(size)
    ) {
        Canvas(modifier = Modifier.fillMaxSize().padding(8.dp)) {
            val strokeWidth = 8.dp.toPx()
            // Background track
            drawCircle(
                color = FlowDeskColors.InsetWell,
                style = Stroke(width = strokeWidth)
            )
            // Progress arc
            drawArc(
                color = if (isRunning) FlowDeskColors.PrimaryIndigo else FlowDeskColors.StateWarning,
                startAngle = -90f,
                sweepAngle = 360f * progress,
                useCenter = false,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = timeString,
                color = FlowDeskColors.TextPrimary,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                fontSize = if (size > 160.dp) 28.sp else 20.sp,
                letterSpacing = (-0.02).sp
            )
            Text(
                text = if (isRunning) "remaining" else "paused",
                color = FlowDeskColors.TextMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun CircularTimerView(
    progress: Float,
    timeDisplay: String,
    size: Dp = 140.dp,
    strokeWidth: Dp = 8.dp,
    progressColor: androidx.compose.ui.graphics.Color = FlowDeskColors.PrimaryIndigo,
    modifier: Modifier = Modifier
) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier.size(size)
    ) {
        Canvas(modifier = Modifier.fillMaxSize().padding(8.dp)) {
            val sw = strokeWidth.toPx()
            // Background track
            drawCircle(
                color = FlowDeskColors.InsetWell,
                style = Stroke(width = sw)
            )
            // Progress arc
            drawArc(
                color = progressColor,
                startAngle = -90f,
                sweepAngle = 360f * progress.coerceIn(0f, 1f),
                useCenter = false,
                style = Stroke(width = sw, cap = StrokeCap.Round)
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = timeDisplay,
                color = FlowDeskColors.TextPrimary,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                fontSize = if (size > 160.dp) 28.sp else 20.sp,
                letterSpacing = (-0.02).sp
            )
            Text(
                text = "remaining",
                color = FlowDeskColors.TextMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

