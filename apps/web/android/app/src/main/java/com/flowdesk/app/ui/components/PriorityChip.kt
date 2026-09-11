package com.flowdesk.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.ui.theme.ChipShape
import com.flowdesk.app.ui.theme.FlowDeskColors

@Composable
fun PriorityChip(
    priority: String,
    modifier: Modifier = Modifier,
    compact: Boolean = false
) {
    val (bgColor, borderColor, textColor, labelText) = when (priority.uppercase()) {
        "P1" -> Quad(FlowDeskColors.P1Soft, FlowDeskColors.P1Border, FlowDeskColors.P1Critical, if (compact) "P1" else "P1 CRITICAL")
        "P2" -> Quad(FlowDeskColors.P2Soft, FlowDeskColors.P2Border, FlowDeskColors.P2High, if (compact) "P2" else "P2 HIGH")
        "P3" -> Quad(FlowDeskColors.P3Soft, FlowDeskColors.P3Border, FlowDeskColors.P3Useful, if (compact) "P3" else "P3 USEFUL")
        else -> Quad(FlowDeskColors.P4Soft, FlowDeskColors.P4Border, FlowDeskColors.P4Low, if (compact) "P4" else "P4 LOW")
    }

    Box(
        modifier = modifier
            .background(bgColor, ChipShape)
            .border(1.dp, borderColor, ChipShape)
            .padding(horizontal = if (compact) 6.dp else 8.dp, vertical = if (compact) 2.dp else 4.dp)
    ) {
        Text(
            text = labelText,
            color = textColor,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.SemiBold,
            fontSize = if (compact) 10.sp else 11.sp,
            letterSpacing = 0.02.sp
        )
    }
}

private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
