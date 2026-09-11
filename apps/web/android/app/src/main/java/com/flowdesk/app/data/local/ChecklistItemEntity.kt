package com.flowdesk.app.data.local

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.flowdesk.app.data.model.ChecklistItem

@Entity(
    tableName = "checklist_items",
    foreignKeys = [
        ForeignKey(
            entity = TaskEntity::class,
            parentColumns = ["id"],
            childColumns = ["taskId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("taskId")]
)
data class ChecklistItemEntity(
    @PrimaryKey val id: String,
    val taskId: String,
    val title: String,
    val isCompleted: Int = 0,
    val sortOrder: Int = 0,
    val syncStatus: SyncStatus = SyncStatus.LOCAL_ONLY,
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun toChecklistItem(): ChecklistItem {
        return ChecklistItem(
            id = id,
            taskId = taskId,
            title = title,
            isCompleted = isCompleted,
            sortOrder = sortOrder
        )
    }

    companion object {
        fun fromChecklistItem(item: ChecklistItem, syncStatus: SyncStatus = SyncStatus.LOCAL_ONLY): ChecklistItemEntity {
            return ChecklistItemEntity(
                id = item.id,
                taskId = item.taskId,
                title = item.title,
                isCompleted = item.isCompleted,
                sortOrder = item.sortOrder,
                syncStatus = syncStatus,
                updatedAt = System.currentTimeMillis()
            )
        }
    }
}
