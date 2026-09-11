package com.flowdesk.app.data.local

import androidx.room.Embedded
import androidx.room.Relation
import com.flowdesk.app.data.model.Task

data class TaskWithChecklists(
    @Embedded val task: TaskEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "taskId"
    )
    val checklists: List<ChecklistItemEntity>
) {
    fun toTask(): Task {
        return task.toTask(checklists.sortedBy { it.sortOrder }.map { it.toChecklistItem() })
    }
}
