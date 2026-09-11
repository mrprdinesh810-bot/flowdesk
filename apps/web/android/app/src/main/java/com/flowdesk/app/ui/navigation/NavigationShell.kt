package com.flowdesk.app.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.analytics.AnalyticsScreen
import com.flowdesk.app.ui.backup.BackupScreen
import com.flowdesk.app.ui.braindump.AiProcessingPipelineScreen
import com.flowdesk.app.ui.braindump.BrainDumpScreen
import com.flowdesk.app.ui.components.QuickAddActionSheet
import com.flowdesk.app.ui.dailyreview.DailyReviewScreen
import com.flowdesk.app.ui.execution.TaskExecutionScreen
import com.flowdesk.app.ui.planreview.PlanReviewScreen
import com.flowdesk.app.ui.schedule.PracticalScheduleScreen
import com.flowdesk.app.ui.settings.SettingsScreen
import com.flowdesk.app.ui.tasks.AllTasksScreen
import com.flowdesk.app.ui.theme.*
import com.flowdesk.app.ui.today.TodayDashboardScreen
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NavigationShell(
    repository: FlowDeskRepository
) {
    val coroutineScope = rememberCoroutineScope()
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.TODAY.route

    val windowSizeClass = rememberWindowSizeClass()
    var isQuickAddOpen by remember { mutableStateOf(false) }

    val bottomNavScreens = listOf(
        Screen.TODAY,
        Screen.PLAN,
        Screen.INSIGHTS,
        Screen.MORE
    )

    // Check if bottom bar should be visible (hidden in Focus Mode)
    val showBottomBar = currentRoute != Screen.FOCUS_MODE.route

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                Surface(
                    color = CardSurface,
                    tonalElevation = 8.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, GlacierBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .height(64.dp)
                            .padding(horizontal = 8.dp),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Today Tab
                        BottomNavItem(
                            screen = Screen.TODAY,
                            isSelected = currentRoute == Screen.TODAY.route,
                            onClick = {
                                if (currentRoute != Screen.TODAY.route) {
                                    navController.navigate(Screen.TODAY.route) {
                                        popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            }
                        )

                        // Plan Tab
                        BottomNavItem(
                            screen = Screen.PLAN,
                            isSelected = currentRoute == Screen.PLAN.route,
                            onClick = {
                                if (currentRoute != Screen.PLAN.route) {
                                    navController.navigate(Screen.PLAN.route) {
                                        popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            }
                        )

                        // Central Floating Quick Add Action Button (+)
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(ElectricCobalt)
                                .clickable { isQuickAddOpen = true },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Add,
                                contentDescription = "Quick Add",
                                tint = Color.White,
                                modifier = Modifier.size(26.dp)
                            )
                        }

                        // Insights Tab
                        BottomNavItem(
                            screen = Screen.INSIGHTS,
                            isSelected = currentRoute == Screen.INSIGHTS.route,
                            onClick = {
                                if (currentRoute != Screen.INSIGHTS.route) {
                                    navController.navigate(Screen.INSIGHTS.route) {
                                        popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            }
                        )

                        // More Tab
                        BottomNavItem(
                            screen = Screen.MORE,
                            isSelected = currentRoute == Screen.MORE.route,
                            onClick = {
                                if (currentRoute != Screen.MORE.route) {
                                    navController.navigate(Screen.MORE.route) {
                                        popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            }
                        )
                    }
                }
            }
        },
        containerColor = GlacierBg
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            AppNavHost(navController = navController, repository = repository)
        }
    }

    // Automatic Update Check on Launch
    var pendingUpdate by remember { mutableStateOf<com.flowdesk.app.data.model.UpdateCheckResponse?>(null) }
    LaunchedEffect(Unit) {
        val update = repository.checkForUpdates()
        if (update != null && update.updateAvailable) {
            pendingUpdate = update
        }
    }

    // App Update Dialog
    pendingUpdate?.let { updateInfo ->
        com.flowdesk.app.ui.components.AppUpdateDialog(
            updateInfo = updateInfo,
            repository = repository,
            onDismiss = { pendingUpdate = null }
        )
    }

    // Modal Quick Add Sheet
    if (isQuickAddOpen) {
        QuickAddActionSheet(
            onDismiss = { isQuickAddOpen = false },
            onNavigateToBrainDump = {
                navController.navigate(Screen.BRAIN_DUMP.route)
            },
            onNavigateToFocus = {
                navController.navigate(Screen.FOCUS_MODE.route)
            },
            onAddTask = { task ->
                coroutineScope.launch {
                    repository.addTask(task)
                }
            }
        )
    }
}

@Composable
private fun BottomNavItem(
    screen: Screen,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = screen.icon,
            contentDescription = screen.title,
            tint = if (isSelected) ElectricCobalt else TechMuted,
            modifier = Modifier.size(22.dp)
        )
        Text(
            text = screen.title,
            fontFamily = FontFamily.Monospace,
            fontSize = 9.sp,
            fontWeight = if (isSelected) FontWeight.Black else FontWeight.SemiBold,
            color = if (isSelected) ElectricCobalt else TechMuted
        )
    }
}

@Composable
private fun AppNavHost(
    navController: androidx.navigation.NavHostController,
    repository: FlowDeskRepository
) {
    NavHost(
        navController = navController,
        startDestination = Screen.TODAY.route
    ) {
        composable(Screen.TODAY.route) {
            TodayDashboardScreen(
                repository = repository,
                onNavigateToBrainDump = { navController.navigate(Screen.BRAIN_DUMP.route) },
                onNavigateToSchedule = { navController.navigate(Screen.PLAN.route) },
                onNavigateToExecution = { _ -> navController.navigate(Screen.FOCUS_MODE.route) }
            )
        }

        composable(Screen.PLAN.route) {
            PracticalScheduleScreen(
                repository = repository,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToExecution = { navController.navigate(Screen.FOCUS_MODE.route) },
                onNavigateToPlanReview = { navController.navigate(Screen.PLAN_REVIEW.route) }
            )
        }

        composable(Screen.INSIGHTS.route) {
            AnalyticsScreen(
                repository = repository,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.MORE.route) {
            MoreMenuScreen(
                navController = navController
            )
        }

        composable(Screen.FOCUS_MODE.route) {
            TaskExecutionScreen(
                repository = repository,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToSchedule = { navController.navigate(Screen.PLAN.route) }
            )
        }

        composable(Screen.BRAIN_DUMP.route) {
            BrainDumpScreen(
                repository = repository,
                onNavigateToPipeline = { navController.navigate(Screen.AI_PIPELINE.route) },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.AI_PIPELINE.route) {
            AiProcessingPipelineScreen(
                repository = repository,
                onPlanConfirmed = { navController.navigate(Screen.PLAN.route) },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.PLAN_REVIEW.route) {
            PlanReviewScreen(
                repository = repository,
                onPlanFixed = { navController.navigate(Screen.PLAN.route) },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.ALL_TASKS.route) {
            AllTasksScreen(
                repository = repository,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToExecution = { _ -> navController.navigate(Screen.FOCUS_MODE.route) }
            )
        }

        composable(Screen.DAILY_REVIEW.route) {
            DailyReviewScreen(
                repository = repository,
                onNavigateBack = { navController.popBackStack() },
                onFinishReview = { navController.navigate(Screen.TODAY.route) }
            )
        }

        composable(Screen.SETTINGS.route) {
            SettingsScreen(
                repository = repository,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.BACKUP.route) {
            BackupScreen(
                repository = repository,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

@Composable
fun MoreMenuScreen(
    navController: androidx.navigation.NavHostController
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(GlacierBg)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "SYSTEM // MORE DESTINATIONS",
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = ElectricCobalt
            )

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Box(modifier = Modifier.size(6.dp).background(ArcticCyan, CircleShape))
                Text("SLOT #03", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TechMuted)
            }
        }

        // Identity Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(CardSurface)
                .border(1.dp, GlacierBorder, RoundedCornerShape(18.dp))
                .padding(14.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(AerospaceNavy)
                        .border(1.5.dp, ElectricCobalt, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("DK", color = Color.White, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text("Dinesh Kumar", fontSize = 15.sp, fontWeight = FontWeight.Black, color = AerospaceNavy)
                    Text("dinesh@flowdesk.internal", fontFamily = FontFamily.Monospace, fontSize = 10.sp, color = TechMuted)
                }

                Text(
                    text = "OLLAMA 3.2",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = ElectricCobalt,
                    modifier = Modifier
                        .background(CyanSoft, RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }

        // Telemetry Capsule
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(InsetWell)
                .border(1.dp, GlacierBorder, RoundedCornerShape(10.dp))
                .padding(horizontal = 12.dp, vertical = 7.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Box(modifier = Modifier.size(6.dp).background(StatusEmerald, CircleShape))
                Text("PORT:11434 • 4.2MB SQLITE", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = AerospaceSlate)
            }
            Text("ENCRYPTED", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Black, color = ElectricCobalt)
        }

        // Menu Routes List
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            MoreNavigationRow("All Tasks Ledger", "Filter by P1–P4, search & manage", Icons.Outlined.FormatListBulleted, "18 Nodes") {
                navController.navigate(Screen.ALL_TASKS.route)
            }

            MoreNavigationRow("Daily Review & Debrief", "Wrap up day, energy reflection & logs", Icons.Outlined.RateReview, "Pending") {
                navController.navigate(Screen.DAILY_REVIEW.route)
            }

            MoreNavigationRow("Brain Dump & AI Parser", "Capture raw thoughts with local LLM", Icons.Outlined.Bolt, "Ollama") {
                navController.navigate(Screen.BRAIN_DUMP.route)
            }

            MoreNavigationRow("Backup & Local Ledger", "Offline SQLite storage & snapshots", Icons.Outlined.Storage, "Encrypted") {
                navController.navigate(Screen.BACKUP.route)
            }

            MoreNavigationRow("Settings & Local Runtime", "Model engine, ports & preferences", Icons.Outlined.Tune, "v1.0.0") {
                navController.navigate(Screen.SETTINGS.route)
            }
        }
    }
}

@Composable
private fun MoreNavigationRow(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    badge: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(CardSurface)
            .border(1.dp, GlacierBorder, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(GlacierBg)
                .border(1.dp, GlacierBorder, RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = title, tint = AerospaceNavy, modifier = Modifier.size(18.dp))
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = AerospaceNavy)
            Text(text = subtitle, fontSize = 10.sp, color = TechMuted)
        }

        Text(
            text = badge,
            fontFamily = FontFamily.Monospace,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = ElectricCobalt,
            modifier = Modifier
                .background(CyanSoft, RoundedCornerShape(4.dp))
                .padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}
