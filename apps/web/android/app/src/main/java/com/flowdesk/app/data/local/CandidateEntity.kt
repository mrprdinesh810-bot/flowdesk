package com.flowdesk.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.flowdesk.app.data.model.Candidate

@Entity(tableName = "candidates")
data class CandidateEntity(
    @PrimaryKey val id: String,
    val brainDumpId: String? = null,
    val title: String,
    val priority: String = "P3",
    val estimatedDuration: Int = 30,
    val scheduledStart: String? = null,
    val scheduledEnd: String? = null,
    val expectedOutcome: String? = null,
    val category: String = "Task",
    val isIncluded: Int = 1,
    val sortOrder: Int = 0,
    val status: String = "proposed"
) {
    fun toCandidate(): Candidate {
        return Candidate(
            id = id,
            brainDumpId = brainDumpId,
            title = title,
            priority = priority,
            estimatedDuration = estimatedDuration,
            scheduledStart = scheduledStart,
            scheduledEnd = scheduledEnd,
            expectedOutcome = expectedOutcome,
            category = category,
            isIncluded = isIncluded,
            sortOrder = sortOrder,
            status = status
        )
    }

    companion object {
        fun fromCandidate(cand: Candidate): CandidateEntity {
            return CandidateEntity(
                id = cand.id,
                brainDumpId = cand.brainDumpId,
                title = cand.title,
                priority = cand.priority,
                estimatedDuration = cand.estimatedDuration,
                scheduledStart = cand.scheduledStart,
                scheduledEnd = cand.scheduledEnd,
                expectedOutcome = cand.expectedOutcome,
                category = cand.category,
                isIncluded = cand.isIncluded,
                sortOrder = cand.sortOrder,
                status = cand.status
            )
        }
    }
}
