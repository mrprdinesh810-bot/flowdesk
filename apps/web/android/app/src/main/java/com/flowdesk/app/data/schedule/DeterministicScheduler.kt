package com.flowdesk.app.data.schedule

import com.flowdesk.app.data.model.*
import java.text.SimpleDateFormat
import java.util.*

object DeterministicScheduler {

    fun calculateFeasibility(
        tasks: List<Task>,
        workStartHour: Int = 9,
        workEndHour: Int = 22,
        bufferPercent: Int = 15
    ): Feasibility {
        val activeTasks = tasks.filter { it.status != "completed" }
        val plannedMinutes = activeTasks.sumOf { it.plannedDuration }
        
        val totalWorkMinutes = maxOf(60, (workEndHour - workStartHour) * 60)
        val cognitiveFocusTarget = (totalWorkMinutes * (100 - bufferPercent)) / 100
        val bufferMinutes = maxOf(0, totalWorkMinutes - plannedMinutes)
        val workloadPercent = if (totalWorkMinutes > 0) (plannedMinutes * 100) / totalWorkMinutes else 0

        val (status, message, isFeasible) = when {
            plannedMinutes <= cognitiveFocusTarget -> Triple(
                "achievable",
                "SYSTEM: FEASIBLE & BALANCED",
                true
            )
            plannedMinutes <= totalWorkMinutes -> Triple(
                "warning",
                "SYSTEM: NEAR CAPACITY // ${bufferPercent}% BUFFER ENGAGED",
                true
            )
            else -> Triple(
                "overloaded",
                "SYSTEM: OVERLOADED // DEFICIT ${plannedMinutes - totalWorkMinutes}m",
                false
            )
        }

        return Feasibility(
            status = status,
            plannedMinutes = plannedMinutes,
            availableMinutes = totalWorkMinutes,
            bufferMinutes = bufferMinutes,
            workloadPercent = workloadPercent,
            isFeasible = isFeasible,
            message = message
        )
    }

    /**
     * Deterministically allocates non-overlapping time slots to candidates.
     * Fixed commitments retain their designated hours; flexible tasks are sequentially scheduled.
     */
    fun scheduleCandidates(
        candidates: List<Candidate>,
        startTimeHHmm: String = "14:30"
    ): List<Candidate> {
        val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
        var currentCal = Calendar.getInstance().apply {
            try {
                val parsed = sdf.parse(startTimeHHmm)
                if (parsed != null) {
                    val temp = Calendar.getInstance().apply { time = parsed }
                    set(Calendar.HOUR_OF_DAY, temp.get(Calendar.HOUR_OF_DAY))
                    set(Calendar.MINUTE, temp.get(Calendar.MINUTE))
                }
            } catch (e: Exception) {
                set(Calendar.HOUR_OF_DAY, 14)
                set(Calendar.MINUTE, 30)
            }
        }

        // Sort by priority weight: P1 -> P2 -> P3 -> P4
        val sorted = candidates.sortedWith(
            compareBy<Candidate> {
                when (it.priority) {
                    "P1" -> 1
                    "P2" -> 2
                    "P3" -> 3
                    else -> 4
                }
            }.thenBy { it.sortOrder }
        )

        return sorted.mapIndexed { index, cand ->
            val startStr: String
            val endStr: String

            if (!cand.scheduledStart.isNullOrBlank() && !cand.scheduledEnd.isNullOrBlank()) {
                startStr = cand.scheduledStart!!
                endStr = cand.scheduledEnd!!
            } else {
                startStr = sdf.format(currentCal.time)
                currentCal.add(Calendar.MINUTE, cand.estimatedDuration)
                endStr = sdf.format(currentCal.time)
                // Add 10-min transition buffer between sequential tasks
                currentCal.add(Calendar.MINUTE, 10)
            }

            cand.copy(
                scheduledStart = startStr,
                scheduledEnd = endStr,
                sortOrder = index
            )
        }
    }

    fun buildIntelligencePlan(tasks: List<Task>): IntelligencePlan {
        val p1Tasks = tasks.filter { it.priority == "P1" && it.status != "completed" }
        val p2Tasks = tasks.filter { it.priority == "P2" && it.status != "completed" }

        val mustWins = (p1Tasks + p2Tasks).take(3).map {
            MustWinTask(
                title = it.title,
                time = it.scheduled_time,
                priority = it.priority,
                expectedResult = it.expectedOutcome ?: "Execute core objectives"
            )
        }

        val primaryFocus = p1Tasks.firstOrNull() ?: tasks.firstOrNull()
        val outcome = if (primaryFocus != null) {
            "Core Focus: ${primaryFocus.title}"
        } else {
            "Day Cleared // In Standby"
        }

        return IntelligencePlan(
            currentTime = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date()),
            mainOutcome = MainOutcome(
                outcome = outcome,
                whyItMatters = primaryFocus?.expectedOutcome ?: "Maintain execution discipline"
            ),
            mustWinTasks = mustWins,
            confidence = if (p1Tasks.size <= 2) "HIGH" else "CALIBRATED",
            planState = "APPROVED"
        )
    }
}
