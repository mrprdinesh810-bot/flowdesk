package com.flowdesk.app.ui.tasks

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
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.data.model.ChecklistItem
import com.flowdesk.app.data.model.Task
import com.flowdesk.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailsSheet(
    task: Task,
    onDismiss: () -> Unit,
    onStartFocus: (String) -> Unit,
    onToggleComplete: (String) -> Unit,
    onToggleChecklist: (String, String) -> Unit,
    onDeleteTask: (String) -> Unit
) {
    val isCompleted = task.status == "completed"
    val checklist = task.checklists
    val completedCount = checklist.count { it.completed }
    val totalCount = checklist.size
    val progressPercent = if (totalCount > 0) (completedCount * 100) / totalCount else 0

    val (bgPriority, textPriority, borderPriority) = when (task.priority) {
        "P1" -> Triple(P1Bg, P1Red, P1Border)
        "P2" -> Triple(P2Bg, P2Orange, P2Border)
        "P3" -> Triple(P3Bg, P3Yellow, P3Border)
        else -> Triple(P4Bg, P4Green, P4Border)
    }

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
            // Header: Priority & ID tag
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "${task.priority} ${if (task.priority == "P1") "CRITICAL" else "NODE"}",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = textPriority,
                        modifier = Modifier
                            .background(bgPriority, RoundedCornerShape(6.dp))
                            .border(1.dp, borderPriority, RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    )

                    Text(
                        text = task.category.uppercase(),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted,
                        modifier = Modifier
                            .background(GlacierBg, RoundedCornerShape(6.dp))
                            .border(1.dp, GlacierBorder, RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 3.dp)
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

            // Task Title & Schedule Duration
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = task.title,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = AerospaceNavy,
                    lineHeight = 26.sp,
                    textDecoration = if (isCompleted) TextDecoration.LineThrough else TextDecoration.None
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(
                            imageVector = Icons.Outlined.Schedule,
                            contentDescription = null,
                            tint = ElectricCobalt,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "${task.scheduled_time ?: "Anytime"} (${task.plannedDuration} min)",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = AerospaceSlate
                        )
                    }

                    if (task.actualDuration > 0) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(
                                imageVector = Icons.Outlined.Timer,
                                contentDescription = null,
                                tint = StatusEmerald,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = "${task.actualDuration}m logged",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = StatusEmerald
                            )
                        }
                    }
                }
            }

            // Expected Outcome / Description Card
            if (!task.expectedOutcome.isNullOrBlank() || !task.notes.isNullOrBlank()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(GlacierBg)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(14.dp))
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "EXPECTED OUTCOME // CRITERIA",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted
                    )
                    Text(
                        text = task.expectedOutcome ?: task.notes ?: "",
                        fontSize = 13.sp,
                        color = AerospaceSlate,
                        lineHeight = 18.sp
                    )
                }
            }

            // Checklist Section
            if (checklist.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(14.dp))
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.size(6.dp).background(ElectricCobalt, RoundedCornerShape(1.dp)))
                            Text(
                                text = "CHECKLIST DIRECTIVES",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = AerospaceNavy
                            )
                        }
                        Text(
                            text = "$completedCount OF $totalCount DONE",
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

                    // Progress Bar
                    LinearProgressIndicator(
                        progress = { progressPercent / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = StatusEmerald,
                        trackColor = GlacierSubtle
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        checklist.forEach { item ->
                            val done = item.completed
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (done) MintSoft else GlacierBg)
                                    .border(1.dp, if (done) StatusEmerald.copy(alpha = 0.3f) else GlacierBorder, RoundedCornerShape(8.dp))
                                    .clickable { onToggleChecklist(task.id, item.id) }
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
                                    fontSize = 12.sp,
                                    color = if (done) TechMuted else AerospaceNavy,
                                    textDecoration = if (done) TextDecoration.LineThrough else TextDecoration.None,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }

            // Action Buttons Dock
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Delete Action Button
                OutlinedButton(
                    onClick = {
                        onDeleteTask(task.id)
                        onDismiss()
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = P1Red),
                    modifier = Modifier.height(48.dp)
                ) {
                    Icon(imageVector = Icons.Outlined.Delete, contentDescription = "Delete", modifier = Modifier.size(16.dp))
                }

                // Mark Complete / Reopen
                OutlinedButton(
                    onClick = {
                        onToggleComplete(task.id)
                        onDismiss()
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f).height(48.dp)
                ) {
                    Text(
                        text = if (isCompleted) "REOPEN" else "MARK AS DONE",
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                }

                // Start Focus (if not completed)
                if (!isCompleted) {
                    Button(
                        onClick = {
                            onDismiss()
                            onStartFocus(task.id)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f).height(48.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Outlined.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text(
                                "START FOCUS",
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
