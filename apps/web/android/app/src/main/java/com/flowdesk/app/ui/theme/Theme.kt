package com.flowdesk.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = FlowDeskColors.PrimaryIndigo,
    onPrimary = FlowDeskColors.CardSurface,
    primaryContainer = FlowDeskColors.PrimarySoft,
    onPrimaryContainer = FlowDeskColors.PrimaryActive,
    secondary = FlowDeskColors.TextSecondary,
    onSecondary = FlowDeskColors.CardSurface,
    background = FlowDeskColors.CanvasBackground,
    onBackground = FlowDeskColors.TextPrimary,
    surface = FlowDeskColors.CardSurface,
    onSurface = FlowDeskColors.TextPrimary,
    surfaceVariant = FlowDeskColors.InsetWell,
    onSurfaceVariant = FlowDeskColors.TextSecondary,
    outline = FlowDeskColors.BorderDefault,
    outlineVariant = FlowDeskColors.BorderSubtle,
    error = FlowDeskColors.StateError,
    onError = FlowDeskColors.CardSurface
)

@Composable
fun FlowDeskTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = FlowDeskTypography,
        shapes = FlowDeskShapes,
        content = content
    )
}
