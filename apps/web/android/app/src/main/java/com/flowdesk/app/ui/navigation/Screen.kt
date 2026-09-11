package com.flowdesk.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.vector.ImageVector

enum class Screen(
    val route: String,
    val title: String,
    val icon: ImageVector,
    val isBottomNav: Boolean = false
) {
    // 4 Bottom Navigation Destinations
    TODAY("today", "Today", Icons.Outlined.RadioButtonChecked, isBottomNav = true),
    PLAN("plan", "Plan", Icons.Outlined.CalendarMonth, isBottomNav = true),
    INSIGHTS("insights", "Insights", Icons.Outlined.TrendingUp, isBottomNav = true),
    MORE("more", "More", Icons.Outlined.Menu, isBottomNav = true),

    // High-Focus Immersion Mode
    FOCUS_MODE("focus_mode", "Focus Mode", Icons.Outlined.Timer),

    // Brain Dump & AI Neural Pipeline
    BRAIN_DUMP("brain_dump", "Brain Dump", Icons.Outlined.Bolt),
    AI_PIPELINE("ai_pipeline", "AI Pipeline", Icons.Outlined.AutoAwesome),

    // Planning & Review Flows
    PLAN_REVIEW("plan_review", "Plan Review", Icons.Outlined.FactCheck),
    ALL_TASKS("all_tasks", "All Tasks", Icons.Outlined.FormatListBulleted),
    DAILY_REVIEW("daily_review", "Daily Review", Icons.Outlined.RateReview),

    // System Utility Screens
    SETTINGS("settings", "Settings", Icons.Outlined.Tune),
    BACKUP("backup", "Backup & Ledger", Icons.Outlined.Storage)
}
