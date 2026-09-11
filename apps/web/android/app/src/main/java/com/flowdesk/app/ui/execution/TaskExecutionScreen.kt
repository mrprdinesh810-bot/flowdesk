package com.flowdesk.app.ui.execution

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.theme.*
import kotlinx.coroutines.launch
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun TaskExecutionScreen(
    repository: FlowDeskRepository,
    onNavigateBack: () -> Unit,
    onNavigateToSchedule: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val activeTimer by repository.activeTimer.collectAsState()
    val elapsedSeconds by repository.activeTimerSeconds.collectAsState()
    val isRunning by repository.isTimerRunning.collectAsState()
    val todayTasks by repository.todayTasks.collectAsState()

    val currentTask = todayTasks.find { it.id == activeTimer.task_id }
        ?: activeTimer.task
        ?: todayTasks.firstOrNull()

    val totalDurationMinutes = activeTimer.session?.planned_duration
        ?: currentTask?.plannedDuration
        ?: 45
    val totalDurationSeconds = totalDurationMinutes * 60
    val remainingSeconds = maxOf(0, totalDurationSeconds - elapsedSeconds)

    val elapsedMinutes = elapsedSeconds / 60
    val progressFraction = if (totalDurationSeconds > 0) {
        minOf(1f, elapsedSeconds.toFloat() / totalDurationSeconds.toFloat())
    } else 0f

    val animatedProgress by animateFloatAsState(
        targetValue = progressFraction,
        animationSpec = tween(durationMillis = 500),
        label = "chronoProgress"
    )

    val formattedRemaining = remember(remainingSeconds) {
        val hrs = remainingSeconds / 3600
        val mins = (remainingSeconds % 3600) / 60
        val secs = remainingSeconds % 60
        if (hrs > 0) String.format("%02d:%02d:%02d", hrs, mins, secs)
        else String.format("%02d:%02d", mins, secs)
    }

    val checklists = currentTask?.checklists ?: emptyList()
    val completedChecklistCount = checklists.count { it.completed }
    val totalChecklistCount = checklists.size

    var scratchpadText by remember { mutableStateOf("") }
    var isScratchpadOpen by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(GlacierBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // 1. Immersion Control Top Navigation
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Tactile Close Keycap
            IconButton(
                onClick = onNavigateBack,
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
            ) {
                Icon(
                    imageVector = Icons.Outlined.Close,
                    contentDescription = "Exit Immersion",
                    tint = AerospaceNavy,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Center Telemetry Tag
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .background(SignalCoral, CircleShape)
                )
                Text(
                    text = "[DEEP CHRONO // LOCK-IN]",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = AerospaceNavy
                )
            }

            // Status Indicator Pill
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .background(if (isRunning) StatusEmerald else StateWarning, CircleShape)
                )
                Text(
                    text = if (isRunning) "RUNNING" else "PAUSED",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isRunning) StatusEmerald else StateWarning
                )
            }
        }

        // Scrollable Cockpit Body
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 2. Active Task Directive Header Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(20.dp))
                        .padding(16.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = "${currentTask?.priority ?: "P1"} CRITICAL",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    modifier = Modifier
                                        .background(SignalCoral, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 7.dp, vertical = 2.dp)
                                )
                                Text(
                                    text = currentTask?.category?.uppercase() ?: "FOCUS SPRINT",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ElectricCobalt,
                                    modifier = Modifier
                                        .background(CyanSoft, RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }

                            Text(
                                text = "${totalDurationMinutes} MIN ALLOCATION",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricCobalt
                            )
                        }

                        Text(
                            text = currentTask?.title ?: "Deep Work Sprint",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = AerospaceNavy,
                            lineHeight = 25.sp
                        )

                        if (!currentTask?.expectedOutcome.isNullOrBlank()) {
                            Text(
                                text = currentTask?.expectedOutcome ?: "",
                                fontSize = 12.sp,
                                color = TechMuted,
                                lineHeight = 16.sp
                            )
                        }
                    }
                }
            }

            // 3. Giant Radial Mechanical Chronometer Bezel
            item {
                Box(
                    modifier = Modifier
                        .size(260.dp)
                        .padding(vertical = 6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    // Outer Bezel Housing & Dial ticks
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val center = Offset(size.width / 2f, size.height / 2f)
                        val radius = (size.minDimension / 2f) - 16.dp.toPx()
                        val tickRadius = radius + 6.dp.toPx()

                        // Draw 60 minute scale ticks
                        for (i in 0 until 60) {
                            val angleRad = Math.toRadians((i * 6.0) - 90.0)
                            val isMajor = i % 5 == 0
                            val tickLen = if (isMajor) 8.dp.toPx() else 4.dp.toPx()
                            val tickColor = if (isMajor) Color(0xFF64748B) else Color(0xFFCBD5E1)
                            val strokeWidth = if (isMajor) 2.dp.toPx() else 1.dp.toPx()

                            val startX = center.x + (tickRadius - tickLen) * cos(angleRad).toFloat()
                            val startY = center.y + (tickRadius - tickLen) * sin(angleRad).toFloat()
                            val endX = center.x + tickRadius * cos(angleRad).toFloat()
                            val endY = center.y + tickRadius * sin(angleRad).toFloat()

                            drawLine(
                                color = tickColor,
                                start = Offset(startX, startY),
                                end = Offset(endX, endY),
                                strokeWidth = strokeWidth
                            )
                        }

                        // Background Track
                        drawCircle(
                            color = Color(0xFFE2E8F0),
                            radius = radius,
                            style = Stroke(width = 12.dp.toPx(), cap = StrokeCap.Round)
                        )

                        // Active Progress Arc with Gradient
                        val sweepAngle = animatedProgress * 360f
                        drawArc(
                            brush = Brush.sweepGradient(
                                listOf(ElectricCobalt, ArcticCyan, ElectricCobalt),
                                center = center
                            ),
                            startAngle = -90f,
                            sweepAngle = sweepAngle,
                            useCenter = false,
                            topLeft = Offset(center.x - radius, center.y - radius),
                            size = Size(radius * 2f, radius * 2f),
                            style = Stroke(width = 12.dp.toPx(), cap = StrokeCap.Round)
                        )
                    }

                    // Dial Face Plate
                    Box(
                        modifier = Modifier
                            .size(174.dp)
                            .clip(CircleShape)
                            .background(CardSurface)
                            .border(1.dp, GlacierBorder, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier
                                    .background(GlacierBg, RoundedCornerShape(9999.dp))
                                    .border(1.dp, GlacierBorder, RoundedCornerShape(9999.dp))
                                    .padding(horizontal = 7.dp, vertical = 2.dp)
                            ) {
                                Box(modifier = Modifier.size(5.dp).background(StatusEmerald, CircleShape))
                                Text(
                                    text = "SYNCED 1000Hz",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = AerospaceNavy
                                )
                            }

                            Text(
                                text = formattedRemaining,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Black,
                                color = AerospaceNavy,
                                letterSpacing = (-1).sp
                            )

                            Text(
                                text = "REMAINING",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricCobalt
                            )

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier.padding(top = 2.dp)
                            ) {
                                Text(
                                    text = "${(progressFraction * 100).toInt()}%",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    color = SignalCoral
                                )
                                Text(
                                    text = "ELAPSED",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TechMuted
                                )
                            }
                        }
                    }
                }
            }

            // 4. Hardware Telemetry Strip (DRIFT: +0.0s, BPM: 72, LOAD: BALANCED)
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TelemetryItem("DRIFT:", "+0.0s", StatusEmerald)
                    Box(modifier = Modifier.width(1.dp).height(14.dp).background(BorderSubtle))
                    TelemetryItem("BPM:", "72", SignalCoral)
                    Box(modifier = Modifier.width(1.dp).height(14.dp).background(BorderSubtle))
                    TelemetryItem("LOAD:", "BALANCED", ElectricCobalt)
                }
            }

            // 5. Inset Subtask Checklist Tray
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(18.dp))
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.size(6.dp).background(ElectricCobalt, RoundedCornerShape(1.dp)))
                            Text(
                                text = "SUBTASK DIRECTIVES",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = AerospaceNavy
                            )
                        }

                        Text(
                            text = "$completedChecklistCount OF $totalChecklistCount COMPLETED",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = TechMuted,
                            modifier = Modifier
                                .background(GlacierBg, RoundedCornerShape(4.dp))
                                .border(1.dp, BorderSubtle, RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }

                    if (checklists.isEmpty()) {
                        Text(
                            "No checklist items assigned to this focus block.",
                            fontSize = 12.sp,
                            color = TechMuted,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            checklists.forEach { item ->
                                val done = item.completed
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (done) MintSoft else GlacierBg)
                                        .border(1.dp, if (done) StatusEmerald.copy(alpha = 0.3f) else GlacierBorder, RoundedCornerShape(10.dp))
                                    .clickable {
                                        currentTask?.let { t ->
                                            coroutineScope.launch {
                                                repository.toggleChecklist(t.id, item.id)
                                            }
                                        }
                                    }
                                    .padding(horizontal = 10.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(18.dp)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(if (done) StatusEmerald else CardSurface)
                                            .border(1.dp, if (done) StatusEmerald else BorderStrong, RoundedCornerShape(4.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (done) {
                                            Text("✓", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    Text(
                                        text = item.text,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp,
                                        color = if (done) TechMuted else AerospaceNavy,
                                        textDecoration = if (done) TextDecoration.LineThrough else TextDecoration.None,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 6. Ergonomic Tactile Control Dock (PAUSE/RESUME, DONE, +10 BUFFER)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Pause / Resume Button
                Button(
                    onClick = {
                        coroutineScope.launch {
                            if (isRunning) repository.pauseTimer() else repository.resumeTimer()
                        }
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = CardSurface),
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(14.dp))
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = if (isRunning) Icons.Outlined.Pause else Icons.Outlined.PlayArrow,
                            contentDescription = if (isRunning) "Pause" else "Resume",
                            tint = AerospaceNavy,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = if (isRunning) "PAUSE" else "RESUME",
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.sp,
                            color = AerospaceNavy
                        )
                    }
                }

                // Done // Finish Primary Button
                Button(
                    onClick = {
                        coroutineScope.launch {
                            repository.completeTimer()
                            onNavigateBack()
                        }
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                    modifier = Modifier
                        .weight(2f)
                        .height(52.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .background(Color.White.copy(alpha = 0.2f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("✓", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        Text(
                            text = "DONE // FINISH",
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Black,
                            fontSize = 12.sp,
                            letterSpacing = 0.5.sp
                        )
                    }
                }

                // +10 Buffer Extension Button
                Button(
                    onClick = { repository.addTimerBuffer(10) },
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ArcticCyan),
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text("+10", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Black, fontSize = 14.sp, color = Color.White)
                        Text("MIN EXT", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 8.sp, color = Color.White.copy(alpha = 0.9f))
                    }
                }
            }

            // Quick Scratchpad / Audio Memo Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(AerospaceNavy)
                    .clickable { isScratchpadOpen = !isScratchpadOpen }
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("🎙", fontSize = 12.sp)
                    Text(
                        text = if (scratchpadText.isNotBlank()) "[NOTE]: $scratchpadText" else "[SCRATCHPAD]: Tap to log instant thought or observation",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        color = Color.White.copy(alpha = 0.9f),
                        maxLines = 1
                    )
                }

                Text(
                    text = "LOG",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = ArcticCyan,
                    modifier = Modifier
                        .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
    }
}

@Composable
private fun TelemetryItem(label: String, value: String, valueColor: Color) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            text = label,
            fontFamily = FontFamily.Monospace,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = AerospaceNavy
        )
        Text(
            text = value,
            fontFamily = FontFamily.Monospace,
            fontSize = 9.sp,
            fontWeight = FontWeight.Black,
            color = valueColor
        )
    }
}
