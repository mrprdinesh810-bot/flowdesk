package com.flowdesk.app.ui.braindump

import androidx.compose.animation.core.animateFloatAsState
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
import com.flowdesk.app.data.model.Candidate
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun AiProcessingPipelineScreen(
    repository: FlowDeskRepository,
    onPlanConfirmed: () -> Unit,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val rawDump by repository.activeBrainDump.collectAsState()
    val candidateList by repository.candidates.collectAsState()

    var currentStep by remember { mutableIntStateOf(1) }
    var isPipelineFinished by remember { mutableStateOf(false) }
    var selectedCategoryFilter by remember { mutableStateOf("All") }

    // Multi-step pipeline sequence progression
    LaunchedEffect(Unit) {
        if (candidateList.isEmpty()) {
            delay(500)
            currentStep = 2
            delay(600)
            currentStep = 3
            delay(700)
            currentStep = 4
            delay(600)
            currentStep = 5
            delay(400)
            isPipelineFinished = true
        } else {
            currentStep = 5
            isPipelineFinished = true
        }
    }

    val candidates = candidateList.ifEmpty {
        listOf(
            Candidate(
                id = "c1",
                title = "Study EDC & Small Signal Analysis",
                priority = "P1",
                estimatedDuration = 90,
                scheduledStart = "15:00",
                scheduledEnd = "16:30",
                category = "Task",
                isIncluded = 1
            ),
            Candidate(
                id = "c2",
                title = "TRAKAE Parser Implementation",
                priority = "P2",
                estimatedDuration = 45,
                scheduledStart = "16:45",
                scheduledEnd = "17:30",
                category = "Task",
                isIncluded = 1
            ),
            Candidate(
                id = "c3",
                title = "Investigate async DMA buffer transfer for lower latency",
                priority = "P3",
                estimatedDuration = 30,
                category = "Idea",
                isIncluded = 0
            ),
            Candidate(
                id = "c4",
                title = "Calibrate lab oscilloscope voltage probe",
                priority = "P2",
                estimatedDuration = 15,
                category = "Reminder",
                isIncluded = 1
            )
        )
    }

    val filteredCandidates = when (selectedCategoryFilter) {
        "Tasks" -> candidates.filter { it.category == "Task" }
        "Ideas" -> candidates.filter { it.category == "Idea" }
        "Reminders" -> candidates.filter { it.category == "Reminder" }
        else -> candidates
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(GlacierBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // 1. Header with Return Keycap and Local LLM Badge
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
                Box(modifier = Modifier.size(6.dp).background(if (isPipelineFinished) StatusEmerald else ArcticCyan, CircleShape))
                Text(
                    text = if (isPipelineFinished) "PIPELINE SYNTHESIZED" else "OLLAMA 3.2 • ACTIVE PARSE",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = AerospaceSlate
                )
            }
        }

        // Scrollable Pipeline Details
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Pipeline Title Card
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
                            Text(
                                text = "[SYS // NEURAL_PIPELINE]",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricCobalt,
                                modifier = Modifier
                                    .background(CyanSoft, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 5.dp, vertical = 2.dp)
                            )
                            Text(
                                text = "STEP 0$currentStep/05",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = TechMuted
                            )
                        }

                        Text(
                            text = "AI Extraction & Synthesis",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = AerospaceNavy
                        )

                        Text(
                            text = "Real-time semantic deconstruction of raw input into structured nodes.",
                            fontSize = 12.sp,
                            color = TechMuted
                        )
                    }
                }
            }

            // 5 Progressive Pipeline Stages Card
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
                    Text(
                        text = "PARSE SEQUENCE PIPELINE",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted,
                        letterSpacing = 0.5.sp
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        PipelineStepRow("1", "Analyzing raw stream input", currentStep >= 1, currentStep == 1)
                        PipelineStepRow("2", "Finding tasks, ideas & questions", currentStep >= 2, currentStep == 2)
                        PipelineStepRow("3", "Identifying priority weights (P1–P4)", currentStep >= 3, currentStep == 3)
                        PipelineStepRow("4", "Organizing chrono windows & durations", currentStep >= 4, currentStep == 4)
                        PipelineStepRow("5", "Preparing categorized results", currentStep >= 5, currentStep == 5)
                    }
                }
            }

            // Extracted Entities Header & Filter Tabs
            if (isPipelineFinished) {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "EXTRACTED NODES (${candidates.size})",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = TechMuted,
                                letterSpacing = 0.5.sp
                            )
                            Text(
                                text = "${candidates.count { it.isIncluded == 1 }} SELECTED",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricCobalt
                            )
                        }

                        // Filter Pills (All, Tasks, Ideas, Reminders)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("All", "Tasks", "Ideas", "Reminders").forEach { cat ->
                                val isSel = selectedCategoryFilter == cat
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isSel) ElectricCobalt else CardSurface)
                                        .border(1.dp, if (isSel) ElectricCobalt else GlacierBorder, RoundedCornerShape(8.dp))
                                        .clickable { selectedCategoryFilter = cat }
                                        .padding(vertical = 6.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = cat.uppercase(),
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSel) Color.White else AerospaceNavy
                                    )
                                }
                            }
                        }
                    }
                }

                // Extracted Items List
                items(filteredCandidates, key = { it.id }) { cand ->
                    val isIncluded = cand.isIncluded == 1
                    val (pBg, pCol, pBorder) = when (cand.priority) {
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
                            .border(1.dp, if (isIncluded) ElectricCobalt.copy(alpha = 0.4f) else BorderSubtle, RoundedCornerShape(14.dp))
                            .clickable {
                                cand.isIncluded = if (isIncluded) 0 else 1
                            }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Checkbox for Inclusion
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(RoundedCornerShape(5.dp))
                                .background(if (isIncluded) ElectricCobalt else GlacierBg)
                                .border(1.5.dp, if (isIncluded) ElectricCobalt else BorderStrong, RoundedCornerShape(5.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isIncluded) {
                                Text("✓", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = cand.priority,
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
                                    text = cand.category.uppercase(),
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TechMuted
                                )
                                Text(
                                    text = "${cand.estimatedDuration}m",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 9.sp,
                                    color = TechMuted
                                )
                            }

                            Text(
                                text = cand.title,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isIncluded) AerospaceNavy else TechMuted
                            )
                        }

                        Text(
                            text = if (isIncluded) "INCLUDE" else "EXCLUDE",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isIncluded) ElectricCobalt else TechMuted,
                            modifier = Modifier
                                .background(if (isIncluded) CyanSoft else GlacierBg, RoundedCornerShape(4.dp))
                                .padding(horizontal = 5.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }

        // 3. Bottom Confirm & Add to Plan Dock
        if (isPipelineFinished) {
            Button(
                onClick = {
                    coroutineScope.launch {
                        repository.fixPlan()
                        onPlanConfirmed()
                    }
                },
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
                        text = "CONFIRM & ADD TO PLAN",
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
private fun PipelineStepRow(
    stepNum: String,
    label: String,
    isCompleted: Boolean,
    isActive: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(if (isActive) CyanSoft else GlacierBg)
            .border(1.dp, if (isActive) ElectricCobalt.copy(alpha = 0.4f) else BorderSubtle, RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(18.dp)
                .clip(CircleShape)
                .background(if (isCompleted) StatusEmerald else if (isActive) ElectricCobalt else GlacierBorder),
            contentAlignment = Alignment.Center
        ) {
            if (isCompleted) {
                Text("✓", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            } else {
                Text(stepNum, color = Color.White, fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
            }
        }

        Text(
            text = label,
            fontFamily = FontFamily.Monospace,
            fontSize = 11.sp,
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium,
            color = if (isActive) ElectricCobalt else if (isCompleted) AerospaceNavy else TechMuted,
            modifier = Modifier.weight(1f)
        )

        if (isActive) {
            CircularProgressIndicator(
                modifier = Modifier.size(12.dp),
                strokeWidth = 2.dp,
                color = ElectricCobalt
            )
        }
    }
}
