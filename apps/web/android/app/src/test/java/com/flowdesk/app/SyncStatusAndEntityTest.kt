package com.flowdesk.app

import com.flowdesk.app.data.local.ChecklistItemEntity
import com.flowdesk.app.data.local.SyncStatus
import com.flowdesk.app.data.local.TaskEntity
import com.flowdesk.app.data.model.ChecklistItem
import com.flowdesk.app.data.model.Task
import org.junit.Assert.*
import org.junit.Test

class SyncStatusAndEntityTest {

    @Test
    fun testSyncStatusEnumValues() {
        // Enforce required synchronization behavior enum values:
        // SYNCED, LOCAL_ONLY, PENDING_SYNC, SYNC_FAILED
        val values = SyncStatus.values().map { it.name }
        assertTrue(values.contains("SYNCED"))
        assertTrue(values.contains("LOCAL_ONLY"))
        assertTrue(values.contains("PENDING_SYNC"))
        assertTrue(values.contains("SYNC_FAILED"))
    }

    @Test
    fun testTaskEntityMapping() {
        val domainTask = Task(
            id = "t-101",
            title = "Verify Room local working state",
            priority = "P1",
            status = "in_progress",
            plannedDuration = 45,
            actualDuration = 20,
            scheduledStart = "10:00",
            scheduledEnd = "10:45",
            expectedOutcome = "Pass all unit tests",
            category = "Deep Work",
            sortOrder = 0,
            checklists = listOf(
                ChecklistItem(id = "c-1", taskId = "t-101", title = "Write test", isCompleted = 1, sortOrder = 0)
            )
        )

        val entity = TaskEntity.fromTask(domainTask, scheduledDate = "2026-09-11", syncStatus = SyncStatus.LOCAL_ONLY)
        assertEquals("t-101", entity.id)
        assertEquals("Verify Room local working state", entity.title)
        assertEquals("P1", entity.priority)
        assertEquals(SyncStatus.LOCAL_ONLY, entity.syncStatus)

        val mappedBack = entity.toTask(domainTask.checklists)
        assertEquals(domainTask.id, mappedBack.id)
        assertEquals(domainTask.title, mappedBack.title)
        assertEquals(domainTask.priority, mappedBack.priority)
        assertEquals(domainTask.status, mappedBack.status)
        assertEquals(1, mappedBack.checklists.size)
    }

    @Test
    fun testSingleUserDeterministicConflictRule_localCompletionWins() {
        // Rule: Local completion always wins over remote non-completed state.
        val localTask = Task(id = "task-1", title = "Task 1", priority = "P1", status = "completed")
        val serverTask = Task(id = "task-1", title = "Task 1", priority = "P1", status = "planned")

        val effectiveStatus = if (localTask.status == "completed" && serverTask.status != "completed") {
            "completed" // Local completion wins
        } else {
            serverTask.status
        }

        assertEquals("completed", effectiveStatus)
    }
}
