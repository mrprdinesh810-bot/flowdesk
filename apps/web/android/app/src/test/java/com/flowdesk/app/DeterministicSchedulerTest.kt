package com.flowdesk.app

import com.flowdesk.app.data.model.Candidate
import com.flowdesk.app.data.model.Task
import com.flowdesk.app.data.schedule.DeterministicScheduler
import org.junit.Assert.*
import org.junit.Test

class DeterministicSchedulerTest {

    @Test
    fun testFeasibilityCalculation_achievable() {
        val tasks = listOf(
            Task(id = "1", title = "Task 1", priority = "P1", status = "planned", plannedDuration = 60, sortOrder = 0),
            Task(id = "2", title = "Task 2", priority = "P2", status = "planned", plannedDuration = 90, sortOrder = 1)
        )
        // 9:00 to 17:00 = 8 hours = 480 mins available
        val feasibility = DeterministicScheduler.calculateFeasibility(tasks, workStartHour = 9, workEndHour = 17, bufferPercent = 15)

        assertEquals("achievable", feasibility.status)
        assertEquals(150, feasibility.plannedMinutes)
        assertEquals(480, feasibility.availableMinutes)
        assertEquals(330, feasibility.bufferMinutes)
        assertTrue(feasibility.isFeasible)
    }

    @Test
    fun testFeasibilityCalculation_warningWhenBufferDepleted() {
        val tasks = listOf(
            Task(id = "1", title = "Long Task 1", priority = "P1", status = "planned", plannedDuration = 200, sortOrder = 0),
            Task(id = "2", title = "Long Task 2", priority = "P1", status = "planned", plannedDuration = 240, sortOrder = 1)
        )
        // 440 planned out of 480 available -> 40 buffer remaining (< 15% buffer margin)
        val feasibility = DeterministicScheduler.calculateFeasibility(tasks, workStartHour = 9, workEndHour = 17, bufferPercent = 15)

        assertEquals("warning", feasibility.status)
        assertEquals(440, feasibility.plannedMinutes)
        assertTrue(feasibility.isFeasible)
    }

    @Test
    fun testFeasibilityCalculation_overloaded() {
        val tasks = listOf(
            Task(id = "1", title = "Task 1", priority = "P1", status = "planned", plannedDuration = 300, sortOrder = 0),
            Task(id = "2", title = "Task 2", priority = "P1", status = "planned", plannedDuration = 300, sortOrder = 1)
        )
        val feasibility = DeterministicScheduler.calculateFeasibility(tasks, workStartHour = 9, workEndHour = 17, bufferPercent = 15)

        assertEquals("overloaded", feasibility.status)
        assertEquals(600, feasibility.plannedMinutes)
        assertEquals(0, feasibility.bufferMinutes)
        assertFalse(feasibility.isFeasible)
    }

    @Test
    fun testCandidateScheduleSlotting_nonOverlapping() {
        val candidates = listOf(
            Candidate(id = "c1", title = "P1 High Focus", priority = "P1", estimatedDuration = 60),
            Candidate(id = "c2", title = "P2 Review", priority = "P2", estimatedDuration = 45),
            Candidate(id = "c3", title = "P3 Admin", priority = "P3", estimatedDuration = 30)
        )

        val scheduled = DeterministicScheduler.scheduleCandidates(candidates, startTimeHHmm = "09:00")

        assertEquals(3, scheduled.size)
        // P1 should be scheduled first at 09:00 - 10:00
        assertEquals("09:00", scheduled[0].scheduledStart)
        assertEquals("10:00", scheduled[0].scheduledEnd)

        // P2 should be scheduled at 10:10 - 10:55 (with 10m transition buffer)
        assertEquals("10:10", scheduled[1].scheduledStart)
        assertEquals("10:55", scheduled[1].scheduledEnd)

        // P3 should be scheduled at 11:05 - 11:35
        assertEquals("11:05", scheduled[2].scheduledStart)
        assertEquals("11:35", scheduled[2].scheduledEnd)
    }

    @Test
    fun testCandidateScheduleSlotting_respectsExplicitTimes() {
        val candidates = listOf(
            Candidate(id = "c1", title = "Fixed Meeting", priority = "P1", estimatedDuration = 60, scheduledStart = "14:00", scheduledEnd = "15:00"),
            Candidate(id = "c2", title = "Flexible Task", priority = "P2", estimatedDuration = 30)
        )

        val scheduled = DeterministicScheduler.scheduleCandidates(candidates, startTimeHHmm = "10:00")

        // Fixed meeting retains its explicit times
        val c1 = scheduled.first { it.id == "c1" }
        assertEquals("14:00", c1.scheduledStart)
        assertEquals("15:00", c1.scheduledEnd)

        // Flexible task is slotted starting at 10:00
        val c2 = scheduled.first { it.id == "c2" }
        assertEquals("10:00", c2.scheduledStart)
        assertEquals("10:30", c2.scheduledEnd)
    }
}
