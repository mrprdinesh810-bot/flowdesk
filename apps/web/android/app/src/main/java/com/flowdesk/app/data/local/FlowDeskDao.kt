package com.flowdesk.app.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface FlowDeskDao {

    // --- Tasks & Checklists ---
    @Transaction
    @Query("SELECT * FROM tasks ORDER BY sortOrder ASC, id ASC")
    fun getAllTasksWithChecklistsFlow(): Flow<List<TaskWithChecklists>>

    @Transaction
    @Query("SELECT * FROM tasks ORDER BY sortOrder ASC, id ASC")
    suspend fun getAllTasksWithChecklists(): List<TaskWithChecklists>

    @Transaction
    @Query("SELECT * FROM tasks WHERE scheduledDate = :date OR scheduledDate IS NULL ORDER BY sortOrder ASC, id ASC")
    fun getTasksForDateFlow(date: String): Flow<List<TaskWithChecklists>>

    @Transaction
    @Query("SELECT * FROM tasks WHERE scheduledDate = :date OR scheduledDate IS NULL ORDER BY sortOrder ASC, id ASC")
    suspend fun getTasksForDate(date: String): List<TaskWithChecklists>

    @Transaction
    @Query("SELECT * FROM tasks WHERE id = :id LIMIT 1")
    suspend fun getTaskById(id: String): TaskWithChecklists?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTasks(tasks: List<TaskEntity>)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Query("UPDATE tasks SET status = :status, updatedAt = :updatedAt, syncStatus = :syncStatus WHERE id = :id")
    suspend fun updateTaskStatus(id: String, status: String, updatedAt: Long = System.currentTimeMillis(), syncStatus: SyncStatus = SyncStatus.PENDING_SYNC)

    @Query("DELETE FROM tasks WHERE id = :id")
    suspend fun deleteTaskById(id: String)

    @Query("DELETE FROM tasks")
    suspend fun clearAllTasks()

    // --- Checklist Items ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChecklistItems(items: List<ChecklistItemEntity>)

    @Query("UPDATE checklist_items SET isCompleted = :isCompleted, updatedAt = :updatedAt, syncStatus = :syncStatus WHERE id = :id")
    suspend fun updateChecklistCompletion(id: String, isCompleted: Int, updatedAt: Long = System.currentTimeMillis(), syncStatus: SyncStatus = SyncStatus.PENDING_SYNC)

    @Query("DELETE FROM checklist_items WHERE taskId = :taskId")
    suspend fun deleteChecklistByTaskId(taskId: String)

    // --- Sync Support ---
    @Transaction
    @Query("SELECT * FROM tasks WHERE syncStatus IN ('PENDING_SYNC', 'LOCAL_ONLY')")
    suspend fun getUnsyncedTasks(): List<TaskWithChecklists>

    @Query("UPDATE tasks SET syncStatus = :syncStatus WHERE id = :id")
    suspend fun updateTaskSyncStatus(id: String, syncStatus: SyncStatus)

    @Query("SELECT COUNT(*) FROM tasks")
    suspend fun getTaskCount(): Int

    // --- Brain Dumps ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBrainDump(dump: BrainDumpEntity)

    @Query("SELECT * FROM brain_dumps ORDER BY createdAt DESC LIMIT 20")
    suspend fun getRecentBrainDumps(): List<BrainDumpEntity>

    @Query("SELECT COUNT(*) FROM brain_dumps")
    suspend fun getBrainDumpCount(): Int

    // --- Candidates ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCandidates(candidates: List<CandidateEntity>)

    @Query("SELECT * FROM candidates WHERE brainDumpId = :dumpId ORDER BY sortOrder ASC")
    suspend fun getCandidatesByDumpId(dumpId: String): List<CandidateEntity>

    @Query("SELECT * FROM candidates ORDER BY sortOrder ASC")
    suspend fun getAllCandidates(): List<CandidateEntity>

    @Query("UPDATE candidates SET isIncluded = :isIncluded WHERE id = :id")
    suspend fun updateCandidateInclusion(id: String, isIncluded: Int)

    @Query("DELETE FROM candidates")
    suspend fun clearCandidates()

    // --- Timer Sessions ---
    @Query("SELECT * FROM timer_sessions WHERE state = 'active' ORDER BY updatedAt DESC LIMIT 1")
    suspend fun getActiveTimerSession(): TimerSessionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateTimerSession(session: TimerSessionEntity)

    @Query("UPDATE timer_sessions SET state = :state, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateTimerState(id: String, state: String, updatedAt: Long = System.currentTimeMillis())

    @Query("DELETE FROM timer_sessions WHERE state = 'completed'")
    suspend fun clearCompletedTimerSessions()

    @Query("DELETE FROM timer_sessions")
    suspend fun clearAllTimerSessions()

    // Composite Atomic Transactions
    @Transaction
    suspend fun insertTaskWithChecklists(task: TaskEntity, checklists: List<ChecklistItemEntity>) {
        insertTask(task)
        if (checklists.isNotEmpty()) {
            insertChecklistItems(checklists)
        }
    }
}
