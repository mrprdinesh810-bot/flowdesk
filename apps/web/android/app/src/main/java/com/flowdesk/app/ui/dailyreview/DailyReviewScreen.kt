package com.flowdesk.app.ui.dailyreview

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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.theme.*

@Composable
fun DailyReviewScreen(
    repository: FlowDeskRepository,
    onNavigateBack: () -> Unit,
    onFinishReview: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tasks by repository.tasks.collectAsState()

    val completedTasks = tasks.filter { it.status == "completed" }
    val pendingTasks = tasks.filter { it.status != "completed" }
    val totalTimeMinutes = completedTasks.sumOf { if (it.actualDuration > 0) it.actualDuration else it.plannedDuration }
    val hoursSpent = totalTimeMinutes / 60
    val minsSpent = totalTimeMinutes % 60

    var selectedMood by remember { mutableStateOf("🚀 Deep Flow") }
    var reflectionText by remember { mutableStateOf("") }
    var takeawayText by remember { mutableStateOf("") }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(GlacierBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 10.dp, bottom = 96.dp)
    ) {
        // Header with Return & AI Debrief Beacon
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onNavigateBack,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(10.dp))
                ) {
                    Icon(Icons.Outlined.ArrowBack, contentDescription = "Back", tint = AerospaceNavy, modifier = Modifier.size(18.dp))
                }

                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(9999.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(9999.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(modifier = Modifier.size(6.dp).background(StatusEmerald, CircleShape))
                    Text(
                        text = "OLLAMA 3.2 • DEBRIEF RUN",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = AerospaceSlate
                    )
                }
            }
        }

        // Title Chassis Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "[CHRONO // DEBRIEF]",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = ElectricCobalt,
                        modifier = Modifier
                            .background(CyanSoft, RoundedCornerShape(4.dp))
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    )

                    Text(
                        text = "Daily Review & Wrap-Up",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = AerospaceNavy
                    )

                    Text(
                        text = "Reflect on today's execution momentum, review completed milestones, and capture key takeaways.",
                        fontSize = 12.sp,
                        color = TechMuted,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Metric Grid (Tasks Done, Focus Time, Flow Rating)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ReviewMetricCard("TASKS DONE", "${completedTasks.size}/${tasks.size}", StatusEmerald, Modifier.weight(1f))
                ReviewMetricCard("FOCUS TIME", "${hoursSpent}h ${minsSpent}m", ElectricCobalt, Modifier.weight(1f))
                ReviewMetricCard("FLOW RATING", "92%", SignalCoral, Modifier.weight(1f))
            }
        }

        // Mood Selection
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
                    text = "ENERGY & MOOD REFLECTION",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = TechMuted,
                    letterSpacing = 0.5.sp
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("🚀 Deep Flow", "⚡ Energetic", "⚖️ Balanced", "🥱 Fatigued").forEach { mood ->
                        val isSel = selectedMood == mood
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSel) CyanSoft else GlacierBg)
                                .border(1.dp, if (isSel) ElectricCobalt else GlacierBorder, RoundedCornerShape(10.dp))
                                .clickable { selectedMood = mood }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = mood,
                                fontSize = 10.sp,
                                fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSel) ElectricCobalt else AerospaceNavy
                            )
                        }
                    }
                }
            }
        }

        // Reflection & Takeaway Inputs
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(18.dp))
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "DAILY REFLECTION & TAKEAWAY",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = TechMuted,
                    letterSpacing = 0.5.sp
                )

                OutlinedTextField(
                    value = reflectionText,
                    onValueChange = { reflectionText = it },
                    label = { Text("What went exceptionally well today?") },
                    placeholder = { Text("e.g. Cleared P1 EDC early, maintained clean 90m sprint without distractions") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    maxLines = 3
                )

                OutlinedTextField(
                    value = takeawayText,
                    onValueChange = { takeawayText = it },
                    label = { Text("Key takeaway for tomorrow's plan:") },
                    placeholder = { Text("e.g. Schedule QA review before 3pm to avoid daylight lag") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    maxLines = 2
                )
            }
        }

        // Completed Milestones Summary
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
                    text = "COMPLETED MILESTONES (${completedTasks.size})",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = TechMuted,
                    letterSpacing = 0.5.sp
                )

                if (completedTasks.isEmpty()) {
                    Text("No tasks marked done today yet.", fontSize = 12.sp, color = TechMuted)
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        completedTasks.forEach { task ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MintSoft)
                                    .padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("✓", color = StatusEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text(
                                    text = task.title,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = AerospaceNavy,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "${task.plannedDuration}m",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = StatusEmerald
                                )
                            }
                        }
                    }
                }
            }
        }

        // Primary Wrap-Up Button
        item {
            Button(
                onClick = onFinishReview,
                colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(modifier = Modifier.size(18.dp).background(Color.White.copy(alpha = 0.2f), CircleShape), contentAlignment = Alignment.Center) {
                        Text("✓", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Text(
                        text = "FINISH REVIEW // WRAP UP DAY",
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Black,
                        fontSize = 12.sp,
                        letterSpacing = 0.5.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun ReviewMetricCard(
    title: String,
    value: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(CardSurface)
            .border(1.dp, GlacierBorder, RoundedCornerShape(14.dp))
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TechMuted)
            Text(value, fontFamily = FontFamily.Monospace, fontSize = 15.sp, fontWeight = FontWeight.Black, color = AerospaceNavy)
        }
    }
}
