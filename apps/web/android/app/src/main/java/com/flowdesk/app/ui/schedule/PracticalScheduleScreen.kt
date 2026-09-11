package com.flowdesk.app.ui.schedule

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

@Composable
fun PracticalScheduleScreen(
    repository: FlowDeskRepository,
    onNavigateBack: () -> Unit,
    onNavigateToExecution: () -> Unit,
    onNavigateToPlanReview: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val todayTasks by repository.todayTasks.collectAsState()
    val feasibility by repository.feasibility.collectAsState()
    val intelligencePlan by repository.intelligencePlan.collectAsState()

    var selectedViewMode by remember { mutableStateOf("Today") }
    var selectedTaskForDetails by remember { mutableStateOf<Task?>(null) }

    val activeTasks = todayTasks.filter { it.status != "completed" }
    val totalPlannedMinutes = activeTasks.sumOf { it.plannedDuration }
    val plannedHours = totalPlannedMinutes / 60
    val plannedMins = totalPlannedMinutes % 60

    val availableMinutes = feasibility?.availableMinutes ?: 360
    val bufferMinutes = feasibility?.bufferMinutes ?: maxOf(0, availableMinutes - totalPlannedMinutes)
    val bufferHours = bufferMinutes / 60
    val bufferMins = bufferMinutes % 60

    val feasStatus = feasibility?.status ?: "achievable"
    val isOverloaded = feasStatus == "overloaded"
    val isWarning = feasStatus == "warning"

    val (statusBg, statusBorder, statusTextCol, statusLabel) = when {
        isOverloaded -> Quad(P1Bg, P1Border, P1Red, "SYSTEM: OVERLOADED // DEFICIT")
        isWarning -> Quad(P3Bg, P3Border, P3Yellow, "SYSTEM: NEAR CAPACITY // 15% BUFFER")
        else -> Quad(MintSoft, StatusEmerald.copy(alpha = 0.4f), StatusEmerald, "SYSTEM: FEASIBLE & BALANCED")
    }

    val planState = intelligencePlan?.planState ?: "APPROVED"

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(GlacierBg)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 96.dp)
    ) {
        // 1. Top Section Title & Screen Code
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "[AUDIT MODULE // CHRONO 24.10]",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = ElectricCobalt
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = planState,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (planState == "APPROVED") StatusEmerald else ElectricCobalt,
                            modifier = Modifier
                                .background(if (planState == "APPROVED") MintSoft else CyanSoft, RoundedCornerShape(4.dp))
                                .border(1.dp, if (planState == "APPROVED") StatusEmerald.copy(alpha = 0.3f) else ArcticCyan.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                        Text(
                            text = "P1-STABLE",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = TechMuted,
                            modifier = Modifier
                                .background(CardSurface, RoundedCornerShape(4.dp))
                                .border(1.dp, BorderSubtle, RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                Text(
                    text = "Feasibility & Buffer Audit",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = AerospaceNavy
                )

                // Date Navigation Pills (Today / Week / Month)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Today", "Week", "Month").forEach { mode ->
                        val isSel = selectedViewMode == mode
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSel) ElectricCobalt else CardSurface)
                                .border(1.dp, if (isSel) ElectricCobalt else GlacierBorder, RoundedCornerShape(8.dp))
                                .clickable { selectedViewMode = mode }
                                .padding(vertical = 7.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = mode.uppercase(),
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSel) Color.White else AerospaceNavy
                            )
                        }
                    }
                }
            }
        }

        // 2. Feasibility Verdict HUD Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Status Badge Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(statusBg)
                                .border(1.dp, statusBorder, RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(modifier = Modifier.size(7.dp).background(statusTextCol, CircleShape))
                            Text(
                                text = statusLabel,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                color = statusTextCol
                            )
                        }

                        Text(
                            text = "14:30 – 20:00",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = TechMuted
                        )
                    }

                    // Metric 3-Grid
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Planned Focus
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(GlacierBg)
                                .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
                                .padding(8.dp),
                            verticalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Text("PLANNED", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TechMuted)
                            Text("${plannedHours}h ${plannedMins}m", fontFamily = FontFamily.Monospace, fontSize = 14.sp, fontWeight = FontWeight.Black, color = AerospaceNavy)
                            Text("Target ≤ 5h", fontFamily = FontFamily.Monospace, fontSize = 8.sp, color = TechMuted)
                        }

                        // Dynamic Buffer
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isOverloaded) P1Bg else MintSoft)
                                .border(1.dp, if (isOverloaded) P1Border else StatusEmerald.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                .padding(8.dp),
                            verticalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Text("BUFFER", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = if (isOverloaded) P1Red else StatusEmerald)
                            Text("${bufferHours}h ${bufferMins}m", fontFamily = FontFamily.Monospace, fontSize = 14.sp, fontWeight = FontWeight.Black, color = if (isOverloaded) P1Red else StatusEmerald)
                            Text("Safety Margin", fontFamily = FontFamily.Monospace, fontSize = 8.sp, color = if (isOverloaded) P1Red else StatusEmerald)
                        }

                        // Window Cap
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(GlacierBg)
                                .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
                                .padding(8.dp),
                            verticalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Text("WINDOW", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TechMuted)
                            Text("6h 00m", fontFamily = FontFamily.Monospace, fontSize = 14.sp, fontWeight = FontWeight.Black, color = AerospaceNavy)
                            Text("Cognitive Cap", fontFamily = FontFamily.Monospace, fontSize = 8.sp, color = ElectricCobalt)
                        }
                    }

                    // Segmented Chrono-Distribution Bar
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("CHRONO-BUDGET DISTRIBUTION", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TechMuted)
                            Text("${feasibility?.workloadPercent ?: 58}% ALLOCATED", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = if (isOverloaded) P1Red else StatusEmerald)
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(10.dp)
                                .clip(RoundedCornerShape(5.dp))
                                .background(GlacierSubtle),
                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            val focusWeight = minOf(1f, totalPlannedMinutes.toFloat() / availableMinutes.toFloat())
                            val bufferWeight = maxOf(0f, 1f - focusWeight)

                            Box(
                                modifier = Modifier
                                    .weight(maxOf(0.01f, focusWeight))
                                    .fillMaxHeight()
                                    .background(if (isOverloaded) P1Red else ElectricCobalt)
                            )
                            if (bufferWeight > 0.01f) {
                                Box(
                                    modifier = Modifier
                                        .weight(bufferWeight)
                                        .fillMaxHeight()
                                        .background(StatusEmerald)
                                )
                            }
                        }
                    }

                    // Primary Action Button for Plan Review
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onNavigateToPlanReview,
                            colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f).height(44.dp)
                        ) {
                            Text("PLAN REVIEW & FIX", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }

                        OutlinedButton(
                            onClick = onNavigateToExecution,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.height(44.dp)
                        ) {
                            Icon(imageVector = Icons.Outlined.PlayArrow, contentDescription = "Focus", modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }

        // 3. Algorithmic Load Audit / Recommendations
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(18.dp))
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "RECOMMENDATION HIERARCHY",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TechMuted,
                    letterSpacing = 0.5.sp
                )

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    RecommendationRow("KEEP P1", "EDC Revision & Sensor Calibration", "Locked in for critical path", P1Red, P1Bg)
                    RecommendationRow("KEEP P2", "Telemetry Sync & QA Call", "Preserved for aerospace team", P2Orange, P2Bg)
                    RecommendationRow("KEEP P2", "Firmware Flash v2.1", "Maintained within daylight budget", P2Orange, P2Bg)
                    RecommendationRow("MOVE P3", "Architecture Debrief Notes", "Can move to tomorrow if fatigued", P3Yellow, P3Bg)
                }
            }
        }

        // 4. Planned Schedule Timeline Items
        item {
            Text(
                text = "PLANNED SCHEDULE NODES (${todayTasks.size})",
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TechMuted,
                letterSpacing = 0.5.sp
            )
        }

        items(todayTasks, key = { it.id }) { task ->
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
                    .clip(RoundedCornerShape(14.dp))
                    .background(CardSurface)
                    .border(1.dp, if (isDone) BorderSubtle else GlacierBorder, RoundedCornerShape(14.dp))
                    .clickable { selectedTaskForDetails = task }
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.width(44.dp)
                ) {
                    Text(
                        text = task.scheduledStart ?: "Flex",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = AerospaceNavy
                    )
                    Text(
                        text = "${task.plannedDuration}m",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 9.sp,
                        color = TechMuted
                    )
                }

                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(32.dp)
                        .background(if (isDone) BorderSubtle else pCol)
                )

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
                                .padding(horizontal = 4.dp, vertical = 1.dp)
                        )
                        Text(
                            text = task.category.uppercase(),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
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

                Text(
                    text = if (isDone) "DONE" else "PLANNED",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDone) StatusEmerald else ElectricCobalt,
                    modifier = Modifier
                        .background(if (isDone) MintSoft else CyanSoft, RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
    }

    selectedTaskForDetails?.let { task ->
        TaskDetailsSheet(
            task = task,
            onDismiss = { selectedTaskForDetails = null },
            onStartFocus = { taskId ->
                coroutineScope.launch {
                    repository.startTimer(taskId)
                    onNavigateToExecution()
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

private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)

@Composable
private fun RecommendationRow(
    action: String,
    title: String,
    reason: String,
    actionColor: Color,
    actionBg: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(GlacierBg)
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = action,
            fontFamily = FontFamily.Monospace,
            fontSize = 9.sp,
            fontWeight = FontWeight.Black,
            color = actionColor,
            modifier = Modifier
                .background(actionBg, RoundedCornerShape(4.dp))
                .border(1.dp, actionColor.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                .padding(horizontal = 6.dp, vertical = 2.dp)
        )

        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = AerospaceNavy, maxLines = 1)
            Text(reason, fontSize = 10.sp, color = TechMuted, maxLines = 1)
        }
    }
}
