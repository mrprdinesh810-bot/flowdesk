package com.flowdesk.app.ui.components

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
import com.flowdesk.app.data.model.Task
import com.flowdesk.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickAddActionSheet(
    onDismiss: () -> Unit,
    onNavigateToBrainDump: () -> Unit,
    onNavigateToFocus: () -> Unit,
    onAddTask: (Task) -> Unit
) {
    var isNewTaskFormOpen by remember { mutableStateOf(false) }
    var taskTitle by remember { mutableStateOf("") }
    var selectedPriority by remember { mutableStateOf("P1") }
    var durationMinutes by remember { mutableIntStateOf(45) }
    var expectedOutcome by remember { mutableStateOf("") }

    var rapidInputText by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = CardSurface,
        dragHandle = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(top = 10.dp, bottom = 6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .width(48.dp)
                        .height(5.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(BorderStrong)
                )
            }
        },
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp)
                .navigationBarsPadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .background(ArcticCyan, CircleShape)
                    )
                    Text(
                        text = "[TACTICAL // QUICK DISPATCH]",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = AerospaceNavy,
                        letterSpacing = 0.5.sp
                    )
                }

                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .size(28.dp)
                        .background(GlacierSubtle, RoundedCornerShape(8.dp))
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Close,
                        contentDescription = "Close",
                        tint = AerospaceSlate,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            if (!isNewTaskFormOpen) {
                // 4 Action Keycap Tiles
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Tile 1: + New Task
                    TactileActionTile(
                        modifier = Modifier.weight(1f),
                        icon = "+",
                        badge = "P1–P4",
                        title = "+ NEW TASK",
                        subtitle = "Structured node with priority",
                        accentColor = ElectricCobalt,
                        onClick = { isNewTaskFormOpen = true }
                    )

                    // Tile 2: Brain Dump
                    TactileActionTile(
                        modifier = Modifier.weight(1f),
                        icon = "⚡",
                        badge = "OLLAMA",
                        title = "BRAIN DUMP",
                        subtitle = "Stream messy thoughts to LLM",
                        accentColor = ArcticCyan,
                        onClick = {
                            onDismiss()
                            onNavigateToBrainDump()
                        }
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Tile 3: Focus Timer
                    TactileActionTile(
                        modifier = Modifier.weight(1f),
                        icon = "⏱",
                        badge = "90 MIN",
                        title = "FOCUS TIMER",
                        subtitle = "Lock in deep work chronometer",
                        accentColor = SignalCoral,
                        onClick = {
                            onDismiss()
                            onNavigateToFocus()
                        }
                    )

                    // Tile 4: Audio Memo
                    TactileActionTile(
                        modifier = Modifier.weight(1f),
                        icon = "🎙",
                        badge = "OFFLINE",
                        title = "AUDIO MEMO",
                        subtitle = "Voice recording entry",
                        accentColor = AerospaceNavy,
                        onClick = {
                            onDismiss()
                            onNavigateToBrainDump()
                        }
                    )
                }

                // Rapid Terminal Input Tray
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(GlacierBg)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(16.dp))
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.size(7.dp).background(ElectricCobalt, CircleShape))
                            Text(
                                "RAPID CAPTURE TERMINAL",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = AerospaceSlate
                            )
                        }
                        Text(
                            "SLOT: AUTO",
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

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        TextField(
                            value = rapidInputText,
                            onValueChange = { rapidInputText = it },
                            placeholder = { Text("What needs to get done next?", fontSize = 13.sp, color = TechMuted) },
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = CardSurface,
                                unfocusedContainerColor = CardSurface,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(52.dp)
                                .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
                        )

                        Button(
                            onClick = {
                                if (rapidInputText.isNotBlank()) {
                                    val newTask = Task(
                                        id = "task-${System.currentTimeMillis()}",
                                        title = rapidInputText.trim(),
                                        priority = "P2",
                                        status = "planned",
                                        plannedDuration = 30,
                                        scheduledStart = "17:00",
                                        scheduledEnd = "17:30"
                                    )
                                    onAddTask(newTask)
                                    rapidInputText = ""
                                    onDismiss()
                                }
                            },
                            enabled = rapidInputText.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.height(52.dp)
                        ) {
                            Text("ADD", fontWeight = FontWeight.Bold, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            } else {
                // Inline Structured New Task Form
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        "STRUCTURED TASK SPECIFICATION",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted
                    )

                    OutlinedTextField(
                        value = taskTitle,
                        onValueChange = { taskTitle = it },
                        label = { Text("Task Title") },
                        placeholder = { Text("e.g. Calibrate ADC reference voltage") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = expectedOutcome,
                        onValueChange = { expectedOutcome = it },
                        label = { Text("Expected Outcome") },
                        placeholder = { Text("Definition of done / success criteria") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        maxLines = 2
                    )

                    // Priority Selector
                    Text("PRIORITY LEVEL", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TechMuted)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("P1", "P2", "P3", "P4").forEach { p ->
                            val isSelected = selectedPriority == p
                            val (bg, textCol, borderCol) = when (p) {
                                "P1" -> Triple(P1Bg, P1Red, P1Border)
                                "P2" -> Triple(P2Bg, P2Orange, P2Border)
                                "P3" -> Triple(P3Bg, P3Yellow, P3Border)
                                else -> Triple(P4Bg, P4Green, P4Border)
                            }
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) textCol else bg)
                                    .border(1.dp, if (isSelected) textCol else borderCol, RoundedCornerShape(8.dp))
                                    .clickable { selectedPriority = p }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = p,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = if (isSelected) Color.White else textCol
                                )
                            }
                        }
                    }

                    // Duration Selector
                    Text("PLANNED DURATION", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TechMuted)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(15, 30, 45, 60, 90).forEach { mins ->
                            val isSelected = durationMinutes == mins
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) ElectricCobalt else GlacierBg)
                                    .border(1.dp, if (isSelected) ElectricCobalt else GlacierBorder, RoundedCornerShape(8.dp))
                                    .clickable { durationMinutes = mins }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${mins}m",
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = if (isSelected) Color.White else AerospaceNavy
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = { isNewTaskFormOpen = false },
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f).height(48.dp)
                        ) {
                            Text("BACK", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                if (taskTitle.isNotBlank()) {
                                    val newTask = Task(
                                        id = "task-${System.currentTimeMillis()}",
                                        title = taskTitle.trim(),
                                        priority = selectedPriority,
                                        status = "planned",
                                        plannedDuration = durationMinutes,
                                        expectedOutcome = expectedOutcome.ifBlank { null },
                                        scheduledStart = "15:00",
                                        scheduledEnd = "16:00"
                                    )
                                    onAddTask(newTask)
                                    onDismiss()
                                }
                            },
                            enabled = taskTitle.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f).height(48.dp)
                        ) {
                            Text("SAVE NODE", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TactileActionTile(
    icon: String,
    badge: String,
    title: String,
    subtitle: String,
    accentColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(CardSurface)
            .border(1.dp, GlacierBorder, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(accentColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text(icon, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }

                Text(
                    text = badge,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = accentColor,
                    modifier = Modifier
                        .background(accentColor.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 5.dp, vertical = 2.dp)
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = title,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = AerospaceNavy
                )
                Text(
                    text = subtitle,
                    fontSize = 10.sp,
                    color = TechMuted,
                    lineHeight = 13.sp,
                    maxLines = 2
                )
            }
        }
    }
}
