package com.flowdesk.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp

enum class WindowSizeClass {
    COMPACT,
    MEDIUM,
    EXPANDED
}

@Composable
fun rememberWindowSizeClass(): WindowSizeClass {
    val config = LocalConfiguration.current
    val widthDp = config.screenWidthDp.dp

    return when {
        widthDp < 600.dp -> WindowSizeClass.COMPACT
        widthDp < 840.dp -> WindowSizeClass.MEDIUM
        else -> WindowSizeClass.EXPANDED
    }
}
