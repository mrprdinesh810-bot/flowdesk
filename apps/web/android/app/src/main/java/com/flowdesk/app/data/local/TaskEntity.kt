package com.flowdesk.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.flowdesk.app.data.model.Task

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val priority: String = "P3",
    val status: String = "planned",
    val plannedDuration: Int = 30,
    val actualDuration: Int = 0,
    val scheduledDate: String? = null,
    val scheduledStart: String? = null,
    val scheduledEnd: String? = null,
    val expectedOutcome: String? = null,
    val category: String = "Task",
    val sortOrder: Int = 0,
    val notes: String? = null,
    val syncStatus: SyncStatus = SyncStatus.LOCAL_ONLY,
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun toTask(checklists: List<com.flowdesk.app.data.model.ChecklistItem> = emptyList()): Task {
        return Task(
            id = id,
            title = title,
            priority = priority,
            status = status,
            plannedDuration = plannedDuration,
            actualDuration = actualDuration,
            scheduledStart = scheduledStart,
            scheduledEnd = scheduledEnd,
            expectedOutcome = expectedOutcome,
            category = category,
            sortOrder = sortOrder,
            notes = notes,
            checklists = checklists
        )
    }

    companion object {
        fun fromTask(task: Task, scheduledDate: String? = null, syncStatus: SyncStatus = SyncStatus.LOCAL_ONLY): TaskEntity {
            return TaskEntity(
                id = task.id,
                title = task.title,
                priority = task.priority,
                status = task.status,
                plannedDuration = task.plannedDuration,
                actualDuration = task.actualDuration,
                scheduledDate = scheduledDate,
                scheduledStart = task.scheduledStart,
                scheduledEnd = task.scheduledEnd,
                expectedOutcome = task.expectedOutcome,
                category = task.category,
                sortOrder = task.sortOrder,
                notes = task.notes,
                syncStatus = syncStatus,
                updatedAt = System.currentTimeMillis()
            )
        }
    }
}
