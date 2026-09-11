package com.flowdesk.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.RowScope
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.ui.theme.ControlShape
import com.flowdesk.app.ui.theme.FlowDeskColors

@Composable
fun StartButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        shape = ControlShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = FlowDeskColors.PrimaryIndigo,
            contentColor = FlowDeskColors.CardSurface,
            disabledContainerColor = FlowDeskColors.PrimaryIndigo.copy(alpha = 0.5f)
        ),
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 10.dp),
        modifier = modifier,
        content = content
    )
}

@Composable
fun StartButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    StartButton(onClick = onClick, modifier = modifier, enabled = enabled) {
        Text(text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun FixPlanButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isPrimarySolid: Boolean = false,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    if (isPrimarySolid) {
        Button(
            onClick = onClick,
            enabled = enabled,
            shape = ControlShape,
            colors = ButtonDefaults.buttonColors(
                containerColor = FlowDeskColors.PrimaryIndigo,
                contentColor = FlowDeskColors.CardSurface
            ),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
            modifier = modifier,
            content = content
        )
    } else {
        OutlinedButton(
            onClick = onClick,
            enabled = enabled,
            shape = ControlShape,
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = FlowDeskColors.PrimarySoft,
                contentColor = FlowDeskColors.PrimaryIndigo
            ),
            border = BorderStroke(1.dp, Color(0xFFC7D2FE)),
            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
            modifier = modifier,
            content = content
        )
    }
}

@Composable
fun FixPlanButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isPrimarySolid: Boolean = false,
    enabled: Boolean = true
) {
    FixPlanButton(onClick = onClick, modifier = modifier, isPrimarySolid = isPrimarySolid, enabled = enabled) {
        Text(text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun SecondaryButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        shape = ControlShape,
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = FlowDeskColors.CardSurface,
            contentColor = FlowDeskColors.TextPrimary
        ),
        border = BorderStroke(1.dp, FlowDeskColors.BorderDefault),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
        modifier = modifier,
        content = content
    )
}

@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    SecondaryButton(onClick = onClick, modifier = modifier, enabled = enabled) {
        Text(text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun DestructiveButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        shape = ControlShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = FlowDeskColors.P1Critical,
            contentColor = FlowDeskColors.CardSurface
        ),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
        modifier = modifier,
        content = content
    )
}

@Composable
fun DestructiveButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    DestructiveButton(onClick = onClick, modifier = modifier, enabled = enabled) {
        Text(text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}
