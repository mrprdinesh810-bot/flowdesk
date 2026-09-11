package com.flowdesk.app.ui.analytics

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.components.FlowDeskTopBar
import com.flowdesk.app.ui.theme.*

@Composable
fun AnalyticsScreen(
    repository: FlowDeskRepository,
    onNavigateBack: () -> Unit
) {
    var selectedRange by remember { mutableStateOf("7 Days") }
    val rangeOptions = listOf("7 Days", "30 Days", "90 Days")

    Scaffold(
        topBar = {
            FlowDeskTopBar(
                title = "Analytics & Patterns",
                subtitle = "Insights into your capacity, accuracy, and execution momentum.",
                onBack = onNavigateBack,
                actions = {
                    Row(
                        modifier = Modifier
                            .background(InsetWell, RoundedCornerShape(8.dp))
                            .border(1.dp, BorderDefault, RoundedCornerShape(8.dp))
                            .padding(2.dp),
                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        rangeOptions.forEach { range ->
                            val isSelected = selectedRange == range
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isSelected) PrimaryIndigo else Color.Transparent)
                                    .clickable { selectedRange = range }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = range,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) Color.White else TextSecondary
                                )
                            }
                        }
                    }
                }
            )
        },
        containerColor = CanvasBackground
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. KPI Cards Grid (4 cards in 2x2 grid)
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        KpiMetricCard(
                            label = "Completion Rate",
                            value = "67%",
                            subline = "Of tasks completed",
                            modifier = Modifier.weight(1f)
                        )
                        KpiMetricCard(
                            label = "Estimation Accuracy",
                            value = "72%",
                            subline = "Across similar tasks",
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        KpiMetricCard(
                            label = "Focus Time",
                            value = "18h 24m",
                            subline = "Total deep work time",
                            modifier = Modifier.weight(1f)
                        )
                        KpiMetricCard(
                            label = "Avg Daily Capacity",
                            value = "4h 35m",
                            subline = "Based on completed work",
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // 2. Planned vs Actual Time Chart
            item {
                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = CardSurface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderDefault),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Planned vs Actual Time",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(PrimaryIndigo.copy(alpha = 0.25f), RoundedCornerShape(2.dp))
                                    )
                                    Spacer(Modifier.width(4.dp))
                                    Text("Planned", fontSize = 10.sp, color = TextMuted)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(PrimaryIndigo, RoundedCornerShape(2.dp))
                                    )
                                    Spacer(Modifier.width(4.dp))
                                    Text("Actual", fontSize = 10.sp, color = TextMuted)
                                }
                            }
                        }

                        Spacer(Modifier.height(16.dp))

                        // Daily Bar Chart Row
                        val days = listOf(
                            Triple("Mon", 4.0f, 3.6f),
                            Triple("Tue", 5.0f, 5.3f),
                            Triple("Wed", 4.5f, 4.1f),
                            Triple("Thu", 4.0f, 3.6f),
                            Triple("Fri", 5.0f, 4.7f),
                            Triple("Sat", 3.0f, 2.2f),
                            Triple("Sun", 3.5f, 3.0f)
                        )

                        val maxHours = 6.0f

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(130.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            days.forEach { (day, planned, actual) ->
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(3.dp),
                                        verticalAlignment = Alignment.Bottom,
                                        modifier = Modifier.height(100.dp)
                                    ) {
                                        // Planned bar
                                        val plannedFraction = (planned / maxHours).coerceIn(0.1f, 1f)
                                        Box(
                                            modifier = Modifier
                                                .width(10.dp)
                                                .fillMaxHeight(plannedFraction)
                                                .clip(RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp))
                                                .background(PrimaryIndigo.copy(alpha = 0.25f))
                                        )

                                        // Actual bar
                                        val actualFraction = (actual / maxHours).coerceIn(0.1f, 1f)
                                        Box(
                                            modifier = Modifier
                                                .width(10.dp)
                                                .fillMaxHeight(actualFraction)
                                                .clip(RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp))
                                                .background(PrimaryIndigo)
                                        )
                                    }
                                    Spacer(Modifier.height(6.dp))
                                    Text(
                                        text = day,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextSecondary
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 3. Estimation Accuracy Breakdown
            item {
                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = CardSurface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderDefault),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Estimation Accuracy (Coding Tasks)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        Spacer(Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                Text("PLANNED AVG", fontSize = 10.sp, color = TextMuted)
                                Spacer(Modifier.height(4.dp))
                                Text("60 min", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                Text("ACTUAL AVG", fontSize = 10.sp, color = TextMuted)
                                Spacer(Modifier.height(4.dp))
                                Text("91 min", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                Text("DIFFERENCE", fontSize = 10.sp, color = TextMuted)
                                Spacer(Modifier.height(4.dp))
                                Text("+31 min", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = P1Red)
                            }
                        }

                        Spacer(Modifier.height(14.dp))

                        // Callout Note
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(P1Bg, InsetShape)
                                .border(1.dp, P1Border, InsetShape)
                                .padding(12.dp)
                        ) {
                            Row(verticalAlignment = Alignment.Top) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = P1Red,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(Modifier.width(8.dp))
                                Column {
                                    Text(
                                        "You usually underestimate similar coding tasks.",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                    Text(
                                        "Based on recorded task history, add 20-30m buffer when scheduling deep development sessions.",
                                        fontSize = 11.sp,
                                        color = TextSecondary
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 4. Execution Windows Heatmap
            item {
                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = CardSurface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderDefault),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Strongest Execution Windows",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            "Based on recorded timer activity",
                            fontSize = 11.sp,
                            color = TextMuted
                        )

                        Spacer(Modifier.height(12.dp))

                        val daysOfWeek = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
                        val intensityMatrix = listOf(
                            listOf(0.1f, 0.2f, 0.3f, 0.5f, 0.8f, 0.9f, 0.4f),
                            listOf(0.1f, 0.2f, 0.4f, 0.6f, 0.9f, 1.0f, 0.5f),
                            listOf(0.0f, 0.1f, 0.3f, 0.5f, 0.7f, 0.8f, 0.2f),
                            listOf(0.1f, 0.2f, 0.4f, 0.6f, 1.0f, 0.8f, 0.2f),
                            listOf(0.0f, 0.1f, 0.3f, 0.6f, 0.8f, 0.9f, 0.4f),
                            listOf(0.0f, 0.0f, 0.2f, 0.4f, 0.5f, 0.3f, 0.1f),
                            listOf(0.0f, 0.1f, 0.2f, 0.3f, 0.6f, 0.4f, 0.2f)
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            daysOfWeek.forEachIndexed { idx, day ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = day,
                                        fontSize = 10.sp,
                                        color = TextMuted,
                                        modifier = Modifier.width(28.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        val rowIntensities = intensityMatrix[idx]
                                        rowIntensities.forEach { intensity ->
                                            val cellColor = if (intensity <= 0.1f) {
                                                InsetWell
                                            } else {
                                                PrimaryIndigo.copy(alpha = intensity.coerceIn(0.15f, 1.0f))
                                            }
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .height(14.dp)
                                                    .clip(RoundedCornerShape(2.dp))
                                                    .background(cellColor)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun KpiMetricCard(
    label: String,
    value: String,
    subline: String,
    modifier: Modifier = Modifier
) {
    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = CardSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderDefault),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(label, fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(6.dp))
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Spacer(Modifier.height(2.dp))
            Text(subline, fontSize = 10.sp, color = TextSecondary)
        }
    }
}
