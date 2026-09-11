
package com.flowdesk.app.ui.planreview

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
import kotlinx.coroutines.launch

@Composable
fun PlanReviewScreen(
    repository: FlowDeskRepository,
    onPlanFixed: () -> Unit,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val candidateList by repository.candidates.collectAsState()
    val feasibility by repository.feasibility.collectAsState()
    var isFixing by remember { mutableStateOf(false) }

    val candidates = candidateList

    val activeCandidates = candidates.filter { it.isIncluded == 1 }
    val totalEstimatedMinutes = activeCandidates.sumOf { it.estimatedDuration }
    val estHours = totalEstimatedMinutes / 60
    val estMins = totalEstimatedMinutes % 60

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(GlacierBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Header
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

            // 3-Stage Indicator
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(9999.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(9999.dp))
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(modifier = Modifier.size(6.dp).background(ElectricCobalt, CircleShape))
                Text(
                    text = "STAGE: REVIEW & FIX",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = AerospaceSlate
                )
            }
        }

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Plan Title Card
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
                                text = "[CHRONO // PROPOSAL_AUDIT]",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricCobalt,
                                modifier = Modifier
                                    .background(CyanSoft, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 5.dp, vertical = 2.dp)
                            )
                            Text(
                                text = "${activeCandidates.size} NODES // ${estHours}h ${estMins}m",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = TechMuted
                            )
                        }

                        Text(
                            text = "Proposed Schedule Review",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = AerospaceNavy
                        )

                        Text(
                            text = "Verify timeline alignment before approving. Once approved, the schedule locks into your daily execution timeline.",
                            fontSize = 12.sp,
                            color = TechMuted,
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            // Reasoning / Feasibility Summary
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(MintSoft)
                        .border(1.dp, StatusEmerald.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(modifier = Modifier.size(8.dp).background(StatusEmerald, CircleShape))
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = "DETERMINISTIC ENGINE: ${feasibility?.status?.uppercase() ?: "BALANCED SCHEDULE"}",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = StatusEmerald
                        )
                        Text(
                            text = if (feasibility != null) {
                                "${activeCandidates.size} tasks planned (${feasibility?.plannedMinutes ?: totalEstimatedMinutes}m). ${feasibility?.bufferMinutes ?: 0}m buffer reserved (15% safety margin)."
                            } else {
                                "Candidates sequenced by priority with conflict-free slotting and safety buffer."
                            },
                            fontSize = 11.sp,
                            color = AerospaceSlate
                        )
                    }
                }
            }

            // Proposed Candidates List
            if (candidates.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(CardSurface)
                            .border(1.dp, GlacierBorder, RoundedCornerShape(16.dp))
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Info,
                                contentDescription = null,
                                tint = TechMuted,
                                modifier = Modifier.size(32.dp)
                            )
                            Text(
                                text = "NO PROPOSED PLAN NODES",
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = AerospaceNavy
                            )
                            Text(
                                text = "Submit a Brain Dump to parse actionable items and construct a practical schedule.",
                                fontSize = 12.sp,
                                color = TechMuted,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }
            } else {
                item {
                    Text(
                        text = "PROPOSED TIMELINE NODES",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted,
                        letterSpacing = 0.5.sp
                    )
                }
            }

            items(candidates, key = { it.id }) { cand ->
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
                        .border(1.dp, GlacierBorder, RoundedCornerShape(14.dp))
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.width(44.dp)
                    ) {
                        Text(
                            text = cand.scheduledStart ?: "Flex",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = AerospaceNavy
                        )
                        Text(
                            text = "${cand.estimatedDuration}m",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            color = TechMuted
                        )
                    }

                    Box(
                        modifier = Modifier
                            .width(2.dp)
                            .height(32.dp)
                            .background(pCol)
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
                        }

                        Text(
                            text = cand.title,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = AerospaceNavy
                        )
                    }

                    Text(
                        text = "PROPOSED",
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
        }

        // Primary Action Button
        if (candidates.isNotEmpty()) {
            Button(
                onClick = {
                    isFixing = true
                    coroutineScope.launch {
                        repository.fixPlan()
                        isFixing = false
                        onPlanFixed()
                    }
                },
                enabled = !isFixing,
                colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                if (isFixing) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(modifier = Modifier.size(18.dp).background(Color.White.copy(alpha = 0.2f), CircleShape), contentAlignment = Alignment.Center) {
                            Text("✓", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Text(
                            text = "APPROVE PLAN // LOCK SCHEDULE (${activeCandidates.size})",
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Black,
                            fontSize = 12.sp,
                            letterSpacing = 0.5.sp
                        )
                    }
                }
            }
        } else {
            OutlinedButton(
                onClick = onNavigateBack,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Outlined.ArrowBack, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(
                        text = "RETURN TO DASHBOARD",
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}
