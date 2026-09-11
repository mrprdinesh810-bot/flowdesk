package com.flowdesk.app.data.model

import com.google.gson.annotations.SerializedName

data class Task(
    val id: String,
    val title: String,
    val priority: String = "P3",
    val status: String = "planned",
    @SerializedName("planned_duration") val plannedDuration: Int = 30,
    @SerializedName("actual_duration") val actualDuration: Int = 0,
    @SerializedName("scheduled_start") val scheduledStart: String? = null,
    @SerializedName("scheduled_end") val scheduledEnd: String? = null,
    @SerializedName("expected_outcome") val expectedOutcome: String? = null,
    val category: String = "Task",
    @SerializedName("sort_order") val sortOrder: Int = 0,
    val notes: String? = null,
    val checklists: List<ChecklistItem> = emptyList()
) {
    val duration_minutes: Int get() = plannedDuration
    val scheduled_time: String? get() = if (scheduledStart != null && scheduledEnd != null) "$scheduledStart – $scheduledEnd" else scheduledStart
    val description: String? get() = expectedOutcome
    val checklist: List<ChecklistItem> get() = checklists
}

data class ChecklistItem(
    val id: String,
    @SerializedName("task_id") val taskId: String = "",
    val title: String = "",
    @SerializedName("is_completed") val isCompleted: Int = 0,
    @SerializedName("sort_order") val sortOrder: Int = 0
) {
    val text: String get() = title
    val completed: Boolean get() = isCompleted == 1
    fun withCompleted(completed: Boolean): ChecklistItem = copy(isCompleted = if (completed) 1 else 0)
}

data class Candidate(
    val id: String,
    @SerializedName("brain_dump_id") val brainDumpId: String? = null,
    var title: String,
    var priority: String = "P3",
    @SerializedName("estimated_duration") var estimatedDuration: Int = 30,
    @SerializedName("scheduled_start") var scheduledStart: String? = null,
    @SerializedName("scheduled_end") var scheduledEnd: String? = null,
    @SerializedName("expected_outcome") var expectedOutcome: String? = null,
    var category: String = "Task",
    @SerializedName("is_included") var isIncluded: Int = 1,
    @SerializedName("sort_order") var sortOrder: Int = 0,
    var status: String = "proposed",
    @SerializedName("clarification_prompt") val clarificationPrompt: String? = null,
    @SerializedName("clarification_options") val clarificationOptions: List<String>? = null
)

data class Feasibility(
    val status: String = "achievable",
    @SerializedName("planned_minutes") val plannedMinutes: Int = 0,
    @SerializedName("available_minutes") val availableMinutes: Int = 0,
    @SerializedName("buffer_minutes") val bufferMinutes: Int = 0,
    @SerializedName("workload_percent") val workloadPercent: Int = 0,
    @SerializedName("is_feasible") val isFeasible: Boolean = true,
    val message: String? = null
)

data class MainOutcome(
    val outcome: String,
    @SerializedName("why_it_matters") val whyItMatters: String? = null
)

data class MustWinTask(
    val title: String,
    val time: String? = null,
    val priority: String = "P1",
    @SerializedName("expected_result") val expectedResult: String? = null
)

data class ScheduleEntry(
    val time: String,
    val action: String,
    val priority: String? = null,
    @SerializedName("is_fixed") val isFixed: Boolean = false,
    @SerializedName("is_past") val isPast: Boolean = false
)

data class OtherTaskEntry(
    val title: String,
    val recommendation: String? = null,
    val time: String? = null
)

data class DoNotWasteEntry(
    val task: String,
    val reason: String
)

data class MoveToDayEntry(
    val task: String,
    @SerializedName("suggested_day_or_reason") val suggestedDayOrReason: String
)

data class IntelligencePlan(
    @SerializedName("current_time") val currentTime: String? = null,
    @SerializedName("main_outcome") val mainOutcome: MainOutcome? = null,
    @SerializedName("must_win_tasks") val mustWinTasks: List<MustWinTask>? = null,
    val schedule: List<ScheduleEntry>? = null,
    @SerializedName("other_tasks") val otherTasks: List<OtherTaskEntry>? = null,
    @SerializedName("do_not_waste_time_on") val doNotWasteTimeOn: List<DoNotWasteEntry>? = null,
    @SerializedName("move_to_another_day") val moveToAnotherDay: List<MoveToDayEntry>? = null,
    @SerializedName("success_criteria") val successCriteria: List<String>? = null,
    @SerializedName("markdown_report") val markdownReport: String? = null,
    val confidence: String = "HIGH",
    val planState: String = "APPROVED"
) {
    val main_outcome: String? get() = mainOutcome?.outcome
}

data class BrainDump(
    val id: String,
    @SerializedName("raw_text") val rawText: String,
    val mode: String = "ai",
    val provider: String? = null,
    @SerializedName("was_fallback") val wasFallback: Boolean = false,
    @SerializedName("ai_error") val aiError: String? = null
) {
    val raw_text: String get() = rawText
}

data class BrainDumpResponse(
    @SerializedName("brain_dump") val brainDump: BrainDump,
    val candidates: List<Candidate> = emptyList(),
    val feasibility: Feasibility? = null,
    @SerializedName("intelligence_plan") val intelligencePlan: IntelligencePlan? = null
)

data class TimerSession(
    val id: String,
    @SerializedName("task_id") val taskId: String,
    @SerializedName("started_at") val startedAt: String? = null,
    @SerializedName("paused_at") val pausedAt: String? = null,
    @SerializedName("elapsed_seconds") val elapsedSeconds: Int = 0,
    val plannedDuration: Int = 45
) {
    val planned_duration: Int get() = plannedDuration
    val task_id: String get() = taskId
}

data class ActiveTimerResponse(
    val active: Boolean = false,
    @SerializedName("active_seconds") val activeSeconds: Int = 0,
    val session: TimerSession? = null,
    val task: Task? = null
) {
    val task_id: String? get() = session?.taskId ?: task?.id
    val start_time: Long? get() = null
}

data class DailyReview(
    val id: String? = null,
    @SerializedName("review_date") val reviewDate: String = "",
    @SerializedName("planned_outcomes_completed") val plannedOutcomesCompleted: Int = 0,
    @SerializedName("actual_vs_planned_notes") val notes: String? = null,
    @SerializedName("what_worked") val whatWorked: String? = null,
    @SerializedName("what_distracted") val whatDistracted: String? = null
)

data class AnalyticsPattern(
    val title: String,
    val description: String,
    val confidence: Float = 0.8f
)

data class AnalyticsData(
    @SerializedName("completion_rate") val completionRate: Int = 0,
    @SerializedName("total_tasks_completed") val totalCompleted: Int = 0,
    val patterns: List<AnalyticsPattern> = emptyList()
)

data class SettingsData(
    @SerializedName("selected_provider") val selectedProvider: String = "openrouter",
    @SerializedName("openrouter_model") val openrouterModel: String = "minimax/minimax-m2.7:free",
    @SerializedName("openrouter_api_key") val openrouterApiKey: String? = null,
    @SerializedName("ollama_base_url") val ollamaBaseUrl: String = "http://127.0.0.1:11434",
    @SerializedName("ollama_model") val ollamaModel: String = "mistral:latest",
    @SerializedName("work_start") val workStart: String = "09:00",
    @SerializedName("work_end") val workEnd: String = "22:00",
    @SerializedName("buffer_percentage") val bufferPercentage: Int = 15,
    @SerializedName("server_url") val serverUrl: String = "http://10.0.2.2:4000"
) {
    val server_url: String get() = serverUrl
    val ai_provider: String get() = selectedProvider
    val ollama_url: String get() = ollamaBaseUrl
    val ollama_model: String get() = ollamaModel
    val openrouter_api_key: String? get() = openrouterApiKey
    val openrouter_model: String get() = openrouterModel
}

data class UpdateCheckResponse(
    val latestVersion: String = "1.0.0",
    val buildNumber: Int = 1,
    val clientVersion: String = "1.0.0",
    val updateAvailable: Boolean = false,
    val downloadUrl: String = "",
    val apkAvailable: Boolean = false,
    val apkSize: Long = 0,
    val releaseDate: String = "",
    val releaseNotes: List<String> = emptyList(),
    val mandatory: Boolean = false
) {
    val version: String get() = latestVersion
    val update_available: Boolean get() = updateAvailable
}
