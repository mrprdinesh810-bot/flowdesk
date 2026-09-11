package com.flowdesk.app.ui.clarification

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.components.*
import com.flowdesk.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ClarificationScreen(
    repository: FlowDeskRepository,
    onFinished: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val candidates by repository.candidates.collectAsState()
    val clarifyingCandidate = candidates.find { it.status == "clarification_required" } ?: candidates.firstOrNull()

    var selectedOption by remember { mutableStateOf("2 hours (recommended)") }
    var notes by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    val options = clarifyingCandidate?.clarificationOptions
        ?: listOf("2 hours (recommended)", "1 hour (quick revision)", "More than 2 hours", "I'll decide later")

    fun submitAnswer(answer: String) {
        if (clarifyingCandidate == null) {
            onFinished()
            return
        }
        isSubmitting = true
        coroutineScope.launch {
            try {
                repository.api.clarifyCandidate(clarifyingCandidate.id, answer)
                repository.refreshTodayTasks()
                onFinished()
            } catch (e: Exception) {
                e.printStackTrace()
                onFinished()
            } finally {
                isSubmitting = false
            }
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(FlowDeskColors.CanvasBackground)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Heading
        item {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "Understanding your day...",
                    style = MaterialTheme.typography.headlineMedium,
                    color = FlowDeskColors.TextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "FlowDesk is analyzing your input and structuring tasks.",
                    style = MaterialTheme.typography.bodySmall,
                    color = FlowDeskColors.TextSecondary
                )
            }
        }

        // 4-Step Progress Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(FlowDeskColors.CardSurface, CardShape)
                    .border(1.dp, FlowDeskColors.BorderDefault, CardShape)
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    StepRow(stepNum = 1, title = "Reading your brain dump", isCompleted = true, isActive = false)
                    StepRow(stepNum = 2, title = "Finding tasks", isCompleted = true, isActive = false)
                    StepRow(stepNum = 3, title = "Checking priorities & durations", isCompleted = false, isActive = true)
                    StepRow(stepNum = 4, title = "Building schedule", isCompleted = false, isActive = false)
                }
            }
        }

        // Clarification Question Card
        if (clarifyingCandidate != null) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(FlowDeskColors.CardSurface, CardShape)
                        .border(1.dp, FlowDeskColors.BorderStrong, CardShape)
                        .padding(16.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFFFEF3C7), ChipShape)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = "Clarification needed",
                                    color = Color(0xFF92400E),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Text(
                            text = clarifyingCandidate.clarificationPrompt
                                ?: "How much time do you want to spend on ${clarifyingCandidate.title}?",
                            style = MaterialTheme.typography.titleMedium,
                            color = FlowDeskColors.TextPrimary,
                            fontWeight = FontWeight.Bold
                        )

                        // 2x2 Grid of Radio Pill Options
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            options.forEach { opt ->
                                val isSelected = selectedOption == opt
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(if (isSelected) FlowDeskColors.PrimarySoft else FlowDeskColors.CardSurface, ControlShape)
                                        .border(
                                            width = if (isSelected) 2.dp else 1.dp,
                                            color = if (isSelected) FlowDeskColors.PrimaryIndigo else FlowDeskColors.BorderDefault,
                                            shape = ControlShape
                                        )
                                        .clickable { selectedOption = opt }
                                        .padding(horizontal = 14.dp, vertical = 12.dp)
                                ) {
                                    Text(
                                        text = opt,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (isSelected) FlowDeskColors.PrimaryIndigo else FlowDeskColors.TextPrimary,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                    )
                                }
                            }
                        }

                        // Optional Notes Field
                        OutlinedTextField(
                            value = notes,
                            onValueChange = { notes = it },
                            placeholder = { Text("Add specific topic or notes (optional)...", fontSize = 12.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = ControlShape,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = FlowDeskColors.PrimaryIndigo,
                                unfocusedBorderColor = FlowDeskColors.BorderDefault
                            )
                        )

                        // Action Buttons
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            SecondaryButton(onClick = { submitAnswer("Skip") }) {
                                Text("Skip for now")
                            }
                            StartButton(onClick = { submitAnswer(selectedOption) }) {
                                Text("Continue")
                            }
                        }
                    }
                }
            }
        }

        // What I Understood So Far Reassurance Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(FlowDeskColors.CardSurface, CardShape)
                    .border(1.dp, FlowDeskColors.BorderSubtle, CardShape)
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "WHAT I UNDERSTOOD SO FAR",
                        style = MaterialTheme.typography.labelSmall,
                        color = FlowDeskColors.TextMuted,
                        fontWeight = FontWeight.Bold
                    )
                    candidates.take(5).forEach { cand ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(FlowDeskColors.PrimaryIndigo, FullShape)
                            )
                            Text(
                                text = "${cand.title} (${cand.estimatedDuration}m)",
                                style = MaterialTheme.typography.bodySmall,
                                color = FlowDeskColors.TextPrimary
                            )
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun StepRow(stepNum: Int, title: String, isCompleted: Boolean, isActive: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .background(
                    when {
                        isCompleted -> FlowDeskColors.StateSuccess
                        isActive -> FlowDeskColors.PrimaryIndigo
                        else -> FlowDeskColors.InsetWell
                    },
                    FullShape
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isCompleted) {
                Icon(
                    imageVector = Icons.Outlined.Check,
                    contentDescription = null,
                    tint = FlowDeskColors.CardSurface,
                    modifier = Modifier.size(14.dp)
                )
            } else {
                Text(
                    text = stepNum.toString(),
                    color = if (isActive) FlowDeskColors.CardSurface else FlowDeskColors.TextMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        Text(
            text = title,
            style = MaterialTheme.typography.bodySmall,
            color = if (isActive || isCompleted) FlowDeskColors.TextPrimary else FlowDeskColors.TextMuted,
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium
        )
    }
}
