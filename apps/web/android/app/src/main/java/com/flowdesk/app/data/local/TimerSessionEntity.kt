package com.flowdesk.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.flowdesk.app.data.model.TimerSession

@Entity(tableName = "timer_sessions")
data class TimerSessionEntity(
    @PrimaryKey val id: String,
    val taskId: String,
    val startedAt: String? = null,
    val pausedAt: String? = null,
    val elapsedSeconds: Int = 0,
    val plannedDuration: Int = 45,
    val state: String = "active", // active, paused, completed
    val lastResumedAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun toTimerSession(): TimerSession {
        return TimerSession(
            id = id,
            taskId = taskId,
            startedAt = startedAt,
            pausedAt = pausedAt,
            elapsedSeconds = elapsedSeconds,
            plannedDuration = plannedDuration
        )
    }

    companion object {
        fun fromTimerSession(session: TimerSession, state: String = "active"): TimerSessionEntity {
            return TimerSessionEntity(
                id = session.id,
                taskId = session.taskId,
                startedAt = session.startedAt,
                pausedAt = session.pausedAt,
                elapsedSeconds = session.elapsedSeconds,
                plannedDuration = session.plannedDuration,
                state = state,
                lastResumedAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
        }
    }
}
