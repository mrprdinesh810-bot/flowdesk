package com.flowdesk.app.ui.tasks

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.data.model.Task
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun AllTasksScreen(
    repository: FlowDeskRepository,
    onNavigateBack: () -> Unit,
    onNavigateToExecution: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val tasks by repository.tasks.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedPriorityFilter by remember { mutableStateOf("All") }
    var selectedStatusFilter by remember { mutableStateOf("All") }
    var selectedTaskForDetails by remember { mutableStateOf<Task?>(null) }

    val filteredTasks = tasks.filter { task ->
        val matchesPriority = when (selectedPriorityFilter) {
            "P1" -> task.priority == "P1"
            "P2" -> task.priority == "P2"
            "P3" -> task.priority == "P3"
            "P4" -> task.priority == "P4"
            else -> true
        }

        val matchesStatus = when (selectedStatusFilter) {
            "Planned" -> task.status == "planned"
            "Active" -> task.status == "in_progress" || task.status == "running"
            "Completed" -> task.status == "completed"
            else -> true
        }

        val matchesQuery = searchQuery.isBlank() ||
                task.title.contains(searchQuery, ignoreCase = true) ||
                (task.expectedOutcome?.contains(searchQuery, ignoreCase = true) == true)

        matchesPriority && matchesStatus && matchesQuery
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(GlacierBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Top Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
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

            Text(
                text = "ALL TASKS LEDGER",
                fontFamily = FontFamily.Monospace,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                color = AerospaceNavy,
                letterSpacing = 0.5.sp
            )

            Text(
                text = "${filteredTasks.size} NODES",
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = TechMuted,
                modifier = Modifier
                    .background(CardSurface, RoundedCornerShape(4.dp))
                    .border(1.dp, BorderSubtle, RoundedCornerShape(4.dp))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            )
        }

        // Search Bar
        TextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search task title, notes, or outcome...", fontSize = 12.sp, color = TechMuted) },
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null, tint = TechMuted, modifier = Modifier.size(18.dp)) },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { searchQuery = "" }) {
                        Icon(Icons.Outlined.Close, contentDescription = "Clear", tint = TechMuted, modifier = Modifier.size(16.dp))
                    }
                }
            },
            colors = TextFieldDefaults.colors(
                focusedContainerColor = CardSurface,
                unfocusedContainerColor = CardSurface,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent
            ),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
        )

        // Priority Filter Pills (All, P1, P2, P3, P4)
        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val priorityOptions = listOf("All", "P1", "P2", "P3", "P4")
            items(priorityOptions) { p ->
                val isSel = selectedPriorityFilter == p
                val (bg, col, bdr) = when (p) {
                    "P1" -> Triple(P1Bg, P1Red, P1Border)
                    "P2" -> Triple(P2Bg, P2Orange, P2Border)
                    "P3" -> Triple(P3Bg, P3Yellow, P3Border)
                    "P4" -> Triple(P4Bg, P4Green, P4Border)
                    else -> Triple(GlacierBg, AerospaceNavy, GlacierBorder)
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isSel) col else bg)
                        .border(1.dp, if (isSel) col else bdr, RoundedCornerShape(8.dp))
                        .clickable { selectedPriorityFilter = p }
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (p == "All") "ALL PRIORITIES" else p,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSel) Color.White else col
                    )
                }
            }
        }

        // Status Filter Tabs (All, Planned, Active, Completed)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            listOf("All", "Planned", "Active", "Completed").forEach { status ->
                val isSel = selectedStatusFilter == status
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isSel) ElectricCobalt else CardSurface)
                        .border(1.dp, if (isSel) ElectricCobalt else GlacierBorder, RoundedCornerShape(8.dp))
                        .clickable { selectedStatusFilter = status }
                        .padding(vertical = 6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = status.uppercase(),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSel) Color.White else AerospaceNavy
                    )
                }
            }
        }

        // Tasks List
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(bottom = 80.dp)
        ) {
            if (filteredTasks.isEmpty()) {
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
                        Text("No matching tasks found in ledger.", fontSize = 12.sp, color = TechMuted)
                    }
                }
            } else {
                items(filteredTasks, key = { it.id }) { task ->
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
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
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
                                    text = task.scheduled_time ?: "Flex",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 9.sp,
                                    color = TechMuted
                                )
                            }

                            Text(
                                text = task.title,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDone) TechMuted else AerospaceNavy,
                                textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        Text(
                            text = "${task.plannedDuration}m",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = TechMuted,
                            modifier = Modifier
                                .background(GlacierBg, RoundedCornerShape(4.dp))
                                .padding(horizontal = 5.dp, vertical = 2.dp)
                        )
                    }
                }
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
