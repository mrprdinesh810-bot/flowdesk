package com.flowdesk.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.ui.theme.CardShape
import com.flowdesk.app.ui.theme.FlowDeskColors

@Composable
fun SystemStateCard(
    title: String,
    message: String,
    type: StateType,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null
) {
    val (bgColor, borderColor, accentColor) = when (type) {
        StateType.SUCCESS -> Triple(FlowDeskColors.P4Soft, FlowDeskColors.P4Border, FlowDeskColors.P4Low)
        StateType.WARNING -> Triple(FlowDeskColors.P2Soft, FlowDeskColors.P2Border, FlowDeskColors.P2High)
        StateType.ERROR -> Triple(FlowDeskColors.P1Soft, FlowDeskColors.P1Border, FlowDeskColors.P1Critical)
        StateType.INFO -> Triple(FlowDeskColors.PrimarySoft, Color(0xFFC7D2FE), FlowDeskColors.PrimaryIndigo)
        StateType.LOADING -> Triple(FlowDeskColors.CardSurface, FlowDeskColors.BorderDefault, FlowDeskColors.PrimaryIndigo)
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(bgColor, CardShape)
            .border(1.dp, borderColor, CardShape)
            .padding(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            when (type) {
                StateType.LOADING -> {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.5.dp,
                        color = accentColor
                    )
                }
                StateType.SUCCESS -> {
                    Icon(
                        imageVector = Icons.Outlined.CheckCircle,
                        contentDescription = "Success",
                        tint = accentColor,
                        modifier = Modifier.size(20.dp)
                    )
                }
                StateType.WARNING, StateType.ERROR -> {
                    Icon(
                        imageVector = Icons.Outlined.Warning,
                        contentDescription = "Alert",
                        tint = accentColor,
                        modifier = Modifier.size(20.dp)
                    )
                }
                StateType.INFO -> {
                    Icon(
                        imageVector = Icons.Outlined.Info,
                        contentDescription = "Info",
                        tint = accentColor,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    color = FlowDeskColors.TextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = message,
                    color = FlowDeskColors.TextSecondary,
                    fontSize = 12.sp,
                    lineHeight = 16.sp,
                    modifier = Modifier.padding(top = 2.dp)
                )
                if (action != null) {
                    Box(modifier = Modifier.padding(top = 8.dp)) {
                        action()
                    }
                }
            }
        }
    }
}

enum class StateType {
    SUCCESS,
    WARNING,
    ERROR,
    INFO,
    LOADING
}

@Composable
fun SystemEmptyStateCard(
    title: String,
    message: String,
    modifier: Modifier = Modifier
) {
    SystemStateCard(
        title = title,
        message = message,
        type = StateType.INFO,
        modifier = modifier
    )
}
