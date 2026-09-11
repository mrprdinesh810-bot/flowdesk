package com.flowdesk.app.ui.today

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.data.model.Task
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.tasks.TaskDetailsSheet
import com.flowdesk.app.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun TodayDashboardScreen(
    repository: FlowDeskRepository,
    onNavigateToBrainDump: () -> Unit,
    onNavigateToSchedule: () -> Unit,
    onNavigateToExecution: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val todayTasks by repository.todayTasks.collectAsState()
    val activeTimer by repository.activeTimer.collectAsState()
    val feasibility by repository.feasibility.collectAsState()

    var selectedTaskForDetails by remember { mutableStateOf<Task?>(null) }

    LaunchedEffect(Unit) {
        repository.refreshTodayTasks()
        repository.refreshActiveTimer()
    }

    val activeTaskId = activeTimer.task_id
    val p1Task = todayTasks.find { it.priority == "P1" && it.status != "completed" }
    val currentFocusTask = todayTasks.find { it.id == activeTaskId }
        ?: p1Task
        ?: todayTasks.find { it.status == "in_progress" }
        ?: todayTasks.find { it.status == "planned" }

    val timelineTasks = todayTasks.filter { it.id != currentFocusTask?.id }

    val todayDateFormatted = remember {
        SimpleDateFormat("MMMM dd • EEE", Locale.getDefault()).format(Date()).uppercase()
    }
    val currentTimeFormatted = remember {
        SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(GlacierBg)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 96.dp)
    ) {
        // 1. Scandinavian Telemetry Header & Local AI Beacon
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Local AI Beacon Pill
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(9999.dp))
                            .background(CardSurface)
                            .border(1.dp, GlacierBorder, RoundedCornerShape(9999.dp))
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .background(ArcticCyan, CircleShape)
                        )
                        Text(
                            text = "OLLAMA 3.2 • LOCAL RUNTIME",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = AerospaceSlate
                        )
                    }

                    // Avatar & Flight Tag
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "FLIGHT.SYS",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = ElectricCobalt,
                            modifier = Modifier
                                .background(CardSurface, RoundedCornerShape(4.dp))
                                .border(1.dp, GlacierBorder, RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )

                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(AerospaceNavy)
                                .border(1.5.dp, ElectricCobalt, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("DK", color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // 2. Chassis Headline Card (Nordic Precision Container)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(20.dp))
                        .padding(18.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = "[CHRONO // ACTIVE]",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ElectricCobalt,
                                    modifier = Modifier
                                        .background(CyanSoft, RoundedCornerShape(4.dp))
                                        .padding(horizontal = 5.dp, vertical = 2.dp)
                                )
                                Text(
                                    text = todayDateFormatted,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TechMuted
                                )
                            }
                            Text(
                                text = "24.10",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Black,
                                color = GlacierSubtle
                            )
                        }

                        Text(
                            text = "Dinesh: Flow Mode",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = AerospaceNavy,
                            lineHeight = 26.sp
                        )

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(top = 2.dp)
                        ) {
                            Text(
                                text = "Calibration target fixed at",
                                fontSize = 12.sp,
                                color = TechMuted
                            )
                            Text(
                                text = "94% CALIBRATED",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                color = ElectricCobalt,
                                modifier = Modifier
                                    .background(CyanSoft, RoundedCornerShape(4.dp))
                                    .border(1.dp, ArcticCyan.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        // 3. Inset Capsule Metric Ribbon (Velocity 94%, Buffer 2h 30m, State LOCKED-IN)
        item {
            val feas = feasibility
            val bufferHours = (feas?.bufferMinutes ?: 150) / 60
            val bufferMins = (feas?.bufferMinutes ?: 150) % 60
            val bufferText = if (bufferHours > 0) "${bufferHours}h ${bufferMins}m" else "${bufferMins}m"

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Metric 1: Velocity
                MetricCapsule(
                    title = "VELOCITY",
                    value = "94%",
                    badge = "▲ +12%",
                    accentColor = ElectricCobalt,
                    modifier = Modifier.weight(1f)
                )

                // Metric 2: Buffer
                MetricCapsule(
                    title = "BUFFER",
                    value = bufferText,
                    badge = "STABLE",
                    accentColor = SignalCoral,
                    modifier = Modifier.weight(1f)
                )

                // Metric 3: State
                MetricCapsule(
                    title = "STATE",
                    value = if (activeTimer.active) "LOCKED" else "READY",
                    badge = if (activeTimer.active) "ACTIVE" else "STANDBY",
                    accentColor = StatusEmerald,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 4. Current Focus Hero Card (Primary Operational Directive)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "CURRENT FOCUS DIRECTIVE",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted,
                        letterSpacing = 0.5.sp
                    )

                    Text(
                        text = if (activeTimer.active) "TIMER ACTIVE" else "READY TO LAUNCH",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (activeTimer.active) ElectricCobalt else TechMuted
                    )
                }

                if (currentFocusTask != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(CardSurface)
                            .border(1.5.dp, ElectricCobalt, RoundedCornerShape(20.dp))
                            .padding(18.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            // Priority and Time Badge
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = "${currentFocusTask.priority} CRITICAL",
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = P1Red,
                                        modifier = Modifier
                                            .background(P1Bg, RoundedCornerShape(6.dp))
                                            .border(1.dp, P1Border, RoundedCornerShape(6.dp))
                                            .padding(horizontal = 7.dp, vertical = 2.dp)
                                    )
                                    Text(
                                        text = currentFocusTask.category.uppercase(),
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TechMuted
                                    )
                                }

                                Text(
                                    text = "${currentFocusTask.scheduled_time ?: "14:30 – 16:00"} // ${currentFocusTask.plannedDuration} MIN",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ElectricCobalt
                                )
                            }

                            // Task Title & Outcome
                            Column(
                                modifier = Modifier.clickable { selectedTaskForDetails = currentFocusTask },
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = currentFocusTask.title,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Black,
                                    color = AerospaceNavy,
                                    lineHeight = 24.sp
                                )
                                if (!currentFocusTask.expectedOutcome.isNullOrBlank()) {
                                    Text(
                                        text = currentFocusTask.expectedOutcome ?: "",
                                        fontSize = 12.sp,
                                        color = TechMuted,
                                        lineHeight = 17.sp,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            // Primary Action Button (START FOCUS with Cobalt Glow)
                            Button(
                                onClick = {
                                    coroutineScope.launch {
                                        repository.startTimer(currentFocusTask.id)
                                        onNavigateToExecution(currentFocusTask.id)
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.PlayArrow,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        text = if (activeTimer.active && activeTimer.task_id == currentFocusTask.id) "RESUME FOCUS SESSION" else "START FOCUS",
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 12.sp,
                                        letterSpacing = 0.5.sp
                                    )
                                }
                            }

                            // Quick Action Sub-Pills
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                ActionSubPill("Details", Modifier.weight(1f)) {
                                    selectedTaskForDetails = currentFocusTask
                                }
                                ActionSubPill("Checklist", Modifier.weight(1f)) {
                                    selectedTaskForDetails = currentFocusTask
                                }
                                ActionSubPill("Done", Modifier.weight(1f)) {
                                    coroutineScope.launch {
                                        repository.completeTask(currentFocusTask.id)
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // Empty Focus State
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(CardSurface)
                            .border(1.dp, GlacierBorder, RoundedCornerShape(20.dp))
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("ALL MAIN OBJECTIVES COMPLETED", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = StatusEmerald)
                            Text("Ready for daily wrap-up or capture thoughts in Brain Dump.", fontSize = 12.sp, color = TechMuted)
                        }
                    }
                }
            }
        }

        // 5. Real-Time Schedule Timeline Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "TODAY'S SCHEDULE TIMELINE",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TechMuted,
                    letterSpacing = 0.5.sp
                )

                Text(
                    text = "PLAN AUDIT →",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = ElectricCobalt,
                    modifier = Modifier.clickable(onClick = onNavigateToSchedule)
                )
            }
        }

        // 6. Timeline Task Items
        if (timelineTasks.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(16.dp))
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No additional tasks scheduled for today.", fontSize = 12.sp, color = TechMuted)
                }
            }
        } else {
            items(timelineTasks, key = { it.id }) { task ->
                val isDone = task.status == "completed"
                val (pBg, pCol, pBorder) = when (task.priority) {
                    "P1" -> Triple(P1Bg, P1Red, P1Border)
                    "P2" -> Triple(P2Bg, P2Orange, P2Border)
                    "P3" -> Triple(P3Bg, P3Yellow, P3Border)
                    else -> Triple(P4Bg, P4Green, P4Border)
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(CardSurface)
                        .border(1.dp, if (isDone) BorderSubtle else GlacierBorder, RoundedCornerShape(16.dp))
                        .clickable { selectedTaskForDetails = task }
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Checkbox Quick Toggle
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isDone) StatusEmerald else GlacierBg)
                            .border(1.5.dp, if (isDone) StatusEmerald else BorderStrong, RoundedCornerShape(6.dp))
                            .clickable {
                                coroutineScope.launch {
                                    repository.onTaskToggle(task.id, if (isDone) "planned" else "completed")
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isDone) {
                            Text("✓", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    // Content
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = task.priority,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = pCol,
                                modifier = Modifier
                                    .background(pBg, RoundedCornerShape(4.dp))
                                    .border(1.dp, pBorder, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 5.dp, vertical = 1.dp)
                            )
                            Text(
                                text = task.scheduled_time ?: "Flex",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TechMuted
                            )
                        }

                        Text(
                            text = task.title,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDone) TechMuted else AerospaceNavy,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    // Duration Badge
                    Text(
                        text = "${task.plannedDuration}m",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted,
                        modifier = Modifier
                            .background(GlacierBg, RoundedCornerShape(6.dp))
                            .border(1.dp, BorderSubtle, RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                }
            }
        }
    }

    // Modal Task Details Sheet if selected
    selectedTaskForDetails?.let { task ->
        TaskDetailsSheet(
            task = task,
            onDismiss = { selectedTaskForDetails = null },
            onStartFocus = { taskId ->
                coroutineScope.launch {
                    repository.startTimer(taskId)
                    onNavigateToExecution(taskId)
                }
            },
            onToggleComplete = { taskId ->
                coroutineScope.launch {
                    val current = repository.todayTasks.value.find { it.id == taskId }
                    val nextStatus = if (current?.status == "completed") "planned" else "completed"
                    repository.onTaskToggle(taskId, nextStatus)
                }
            },
            onToggleChecklist = { taskId, itemId ->
                coroutineScope.launch {
                    repository.toggleChecklist(taskId, itemId)
                }
            },
            onDeleteTask = { taskId ->
                coroutineScope.launch {
                    repository.deleteTask(taskId)
                }
            }
        )
    }
}

@Composable
private fun MetricCapsule(
    title: String,
    value: String,
    badge: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(CardSurface)
            .border(1.dp, GlacierBorder, RoundedCornerShape(16.dp))
            .padding(10.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = TechMuted
                )
                Box(
                    modifier = Modifier
                        .size(5.dp)
                        .background(accentColor, CircleShape)
                )
            }

            Text(
                text = value,
                fontFamily = FontFamily.Monospace,
                fontSize = 16.sp,
                fontWeight = FontWeight.Black,
                color = AerospaceNavy
            )

            Text(
                text = badge,
                fontFamily = FontFamily.Monospace,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = accentColor,
                modifier = Modifier
                    .background(accentColor.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                    .padding(horizontal = 4.dp, vertical = 1.dp)
            )
        }
    }
}

@Composable
private fun ActionSubPill(
    label: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(GlacierBg)
            .border(1.dp, GlacierBorder, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontFamily = FontFamily.Monospace,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = AerospaceSlate
        )
    }
}
