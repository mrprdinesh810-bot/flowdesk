package com.flowdesk.app.data.repository

import android.content.Context
import com.flowdesk.app.data.api.FlowDeskApiClient
import com.flowdesk.app.data.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class FlowDeskRepository(context: Context) {

    val api = FlowDeskApiClient(context)
    private val scope = CoroutineScope(Dispatchers.Main)

    private val defaultChecklist = listOf(
        ChecklistItem("c1", "t1", "Review diode equations & small models", isCompleted = 1, sortOrder = 0),
        ChecklistItem("c2", "t1", "Solve problem 1 (Zener breakdown circuit)", isCompleted = 1, sortOrder = 1),
        ChecklistItem("c3", "t1", "Solve problem 2 (Impedance matching)", isCompleted = 0, sortOrder = 2),
        ChecklistItem("c4", "t1", "Solve problem 3 (BJT gain saturation)", isCompleted = 0, sortOrder = 3),
        ChecklistItem("c5", "t1", "Synthesis flashcard summary", isCompleted = 0, sortOrder = 4)
    )

    private val defaultSeedTasks = listOf(
        Task(
            id = "t1",
            title = "EDC Revision & Sensor Calibration",
            priority = "P1",
            status = "in_progress",
            plannedDuration = 90,
            actualDuration = 42,
            scheduledStart = "14:30",
            scheduledEnd = "16:00",
            expectedOutcome = "Verify thermal dissipation limits on prototype PCB revision 4.2",
            category = "Deep Work",
            sortOrder = 0,
            notes = "Focus on transistor bias stability and 1000Hz chronometer timing constraints.",
            checklists = defaultChecklist
        ),
        Task(
            id = "t2",
            title = "Telemetry Sync & QA Call",
            priority = "P2",
            status = "planned",
            plannedDuration = 45,
            actualDuration = 0,
            scheduledStart = "16:15",
            scheduledEnd = "17:00",
            expectedOutcome = "Review hardware regression logs with aerospace systems team",
            category = "Coordination",
            sortOrder = 1,
            notes = "Verify sensor telemetry throughput on port 11434.",
            checklists = listOf(
                ChecklistItem("c21", "t2", "Prepare crash log summary", isCompleted = 0),
                ChecklistItem("c22", "t2", "Review latency metrics", isCompleted = 0)
            )
        ),
        Task(
            id = "t3",
            title = "Firmware Flash v2.1 & Boot Diagnostic",
            priority = "P2",
            status = "planned",
            plannedDuration = 60,
            actualDuration = 0,
            scheduledStart = "17:15",
            scheduledEnd = "18:15",
            expectedOutcome = "Deploy patched bootloader and verify I2C timing bus",
            category = "Engineering",
            sortOrder = 2,
            notes = "Ensure backup image is written to local flash before reboot."
        ),
        Task(
            id = "t4",
            title = "Weekly Architecture Debrief Notes",
            priority = "P3",
            status = "planned",
            plannedDuration = 45,
            actualDuration = 0,
            scheduledStart = "18:30",
            scheduledEnd = "19:15",
            expectedOutcome = "Draft modular design patterns for mobile engine",
            category = "Documentation",
            sortOrder = 3
        ),
        Task(
            id = "t5",
            title = "Clean Lab Workstation & Equipment Log",
            priority = "P4",
            status = "planned",
            plannedDuration = 30,
            actualDuration = 0,
            scheduledStart = "19:30",
            scheduledEnd = "20:00",
            expectedOutcome = "Inventory measurement probes and oscilloscope calibration",
            category = "Operations",
            sortOrder = 4
        ),
        Task(
            id = "t6",
            title = "Morning Circuit Simulation",
            priority = "P1",
            status = "completed",
            plannedDuration = 60,
            actualDuration = 55,
            scheduledStart = "10:00",
            scheduledEnd = "11:00",
            expectedOutcome = "SPICE simulation across 4 voltage rails completed with 0 errors",
            category = "Deep Work",
            sortOrder = -1
        )
    )

    private val _todayTasks = MutableStateFlow<List<Task>>(defaultSeedTasks)
    val todayTasks: StateFlow<List<Task>> = _todayTasks.asStateFlow()
    val tasks: StateFlow<List<Task>> = _todayTasks.asStateFlow()

    private val _activeTimer = MutableStateFlow(
        ActiveTimerResponse(
            active = true,
            activeSeconds = 2520, // 42 minutes elapsed
            session = TimerSession(
                id = "sess-1",
                taskId = "t1",
                startedAt = "14:30:00",
                elapsedSeconds = 2520,
                plannedDuration = 90
            ),
            task = defaultSeedTasks[0]
        )
    )
    val activeTimer: StateFlow<ActiveTimerResponse> = _activeTimer.asStateFlow()

    private val _activeTimerSeconds = MutableStateFlow(2520)
    val activeTimerSeconds: StateFlow<Int> = _activeTimerSeconds.asStateFlow()
    val timerTicker: StateFlow<Int> = _activeTimerSeconds.asStateFlow()

    private val _isTimerRunning = MutableStateFlow(true)
    val isTimerRunning: StateFlow<Boolean> = _isTimerRunning.asStateFlow()

    // Brain dump & planning state
    private val _activeBrainDump = MutableStateFlow<BrainDump?>(null)
    val activeBrainDump: StateFlow<BrainDump?> = _activeBrainDump.asStateFlow()

    private val _candidates = MutableStateFlow<List<Candidate>>(emptyList())
    val candidates: StateFlow<List<Candidate>> = _candidates.asStateFlow()

    private val _feasibility = MutableStateFlow<Feasibility?>(
        Feasibility(
            status = "achievable",
            plannedMinutes = 210, // 3h 30m
            availableMinutes = 360, // 6h 00m
            bufferMinutes = 150, // 2h 30m
            workloadPercent = 58,
            isFeasible = true,
            message = "SYSTEM: FEASIBLE & BALANCED"
        )
    )
    val feasibility: StateFlow<Feasibility?> = _feasibility.asStateFlow()

    private val _intelligencePlan = MutableStateFlow<IntelligencePlan?>(
        IntelligencePlan(
            mainOutcome = MainOutcome(
                outcome = "Dinesh: Flow Mode — Calibration Target 94%",
                whyItMatters = "Verification of core telemetry and PCB revision 4.2 thermal stability"
            ),
            mustWinTasks = listOf(
                MustWinTask("EDC Revision & Sensor Calibration", "14:30 – 16:00", "P1"),
                MustWinTask("Telemetry Sync & QA Call", "16:15 – 17:00", "P2")
            ),
            confidence = "HIGH",
            planState = "APPROVED"
        )
    )
    val intelligencePlan: StateFlow<IntelligencePlan?> = _intelligencePlan.asStateFlow()

    private val _settings = MutableStateFlow(SettingsData())
    val settings: StateFlow<SettingsData> = _settings.asStateFlow()

    init {
        // Monotonic timer ticker
        scope.launch {
            while (true) {
                delay(1000)
                if (_isTimerRunning.value) {
                    _activeTimerSeconds.value += 1
                }
            }
        }
        scope.launch {
            refreshTodayTasks()
            refreshActiveTimer()
            refreshSettings()
        }
    }

    private fun getTodayDateString(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }

    suspend fun refreshTodayTasks() {
        try {
            val taskList = api.getTodayTasks(getTodayDateString())
            if (taskList.isNotEmpty()) {
                _todayTasks.value = taskList
            }
        } catch (e: Exception) {
            // Keep local/seed tasks if offline
        }
    }

    suspend fun refreshActiveTimer() {
        try {
            val res = api.getActiveTimer()
            if (res.session != null) {
                _activeTimer.value = res
                _activeTimerSeconds.value = res.activeSeconds
                _isTimerRunning.value = res.active
            }
        } catch (e: Exception) {
            // Keep local timer state
        }
    }

    suspend fun startTimer(taskId: String, durationMinutes: Int = 45) {
        val targetTask = _todayTasks.value.find { it.id == taskId }
        try {
            val res = api.startTimer(taskId)
            _activeTimer.value = res
            _activeTimerSeconds.value = res.activeSeconds
            _isTimerRunning.value = true
            refreshTodayTasks()
        } catch (e: Exception) {
            // Local fallback
            val session = TimerSession(
                id = "sess-${System.currentTimeMillis()}",
                taskId = taskId,
                startedAt = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date()),
                elapsedSeconds = 0,
                plannedDuration = targetTask?.plannedDuration ?: durationMinutes
            )
            _activeTimer.value = ActiveTimerResponse(
                active = true,
                activeSeconds = 0,
                session = session,
                task = targetTask
            )
            _activeTimerSeconds.value = 0
            _isTimerRunning.value = true
        }
    }

    suspend fun pauseTimer() {
        val sessionId = _activeTimer.value.session?.id ?: return
        try {
            val res = api.pauseTimer(sessionId)
            _activeTimer.value = res
            _activeTimerSeconds.value = res.activeSeconds
            _isTimerRunning.value = false
            refreshTodayTasks()
        } catch (e: Exception) {
            _isTimerRunning.value = false
        }
    }

    suspend fun stopTimer() {
        pauseTimer()
    }

    suspend fun resumeTimer() {
        val sessionId = _activeTimer.value.session?.id ?: return
        try {
            val res = api.resumeTimer(sessionId)
            _activeTimer.value = res
            _isTimerRunning.value = true
            refreshTodayTasks()
        } catch (e: Exception) {
            _isTimerRunning.value = true
        }
    }

    suspend fun completeTimer() {
        val current = _activeTimer.value
        val taskId = current.task_id
        if (taskId != null) {
            completeTask(taskId)
        }
        _activeTimer.value = ActiveTimerResponse(active = false)
        _activeTimerSeconds.value = 0
        _isTimerRunning.value = false
        try {
            current.session?.id?.let { api.completeTimer(it, true) }
        } catch (e: Exception) {
            // Offline completed
        }
    }

    fun addTimerBuffer(minutes: Int = 10) {
        val current = _activeTimer.value
        val currentSession = current.session ?: return
        val updatedPlanned = currentSession.plannedDuration + minutes
        _activeTimer.value = current.copy(
            session = currentSession.copy(plannedDuration = updatedPlanned)
        )
    }

    suspend fun completeTask(taskId: String) {
        val updated = _todayTasks.value.map {
            if (it.id == taskId) it.copy(status = "completed") else it
        }
        _todayTasks.value = updated
        try {
            api.updateTaskStatus(taskId, "completed")
        } catch (e: Exception) {
            // Local update succeeded
        }
    }

    suspend fun onTaskToggle(taskId: String, newStatus: String) {
        val updated = _todayTasks.value.map {
            if (it.id == taskId) it.copy(status = newStatus) else it
        }
        _todayTasks.value = updated
        try {
            api.updateTaskStatus(taskId, newStatus)
        } catch (e: Exception) {
            // Local update succeeded
        }
    }

    suspend fun addTask(task: Task) {
        val currentList = _todayTasks.value.toMutableList()
        currentList.add(task)
        _todayTasks.value = currentList
        recomputeFeasibility()
    }

    suspend fun deleteTask(taskId: String) {
        _todayTasks.value = _todayTasks.value.filter { it.id != taskId }
        try {
            api.deleteTask(taskId)
        } catch (e: Exception) {
            // Local deletion succeeded
        }
        recomputeFeasibility()
    }

    suspend fun toggleChecklist(itemId: String, completed: Boolean) {
        val updated = _todayTasks.value.map { task ->
            val updatedChecklists = task.checklists.map { item ->
                if (item.id == itemId) item.withCompleted(completed) else item
            }
            task.copy(checklists = updatedChecklists)
        }
        _todayTasks.value = updated
        try {
            api.toggleChecklist(itemId, completed)
        } catch (e: Exception) {
            // Local update succeeded
        }
    }

    suspend fun toggleChecklist(taskId: String, itemId: String) {
        val task = _todayTasks.value.find { it.id == taskId }
        val item = task?.checklist?.find { it.id == itemId }
        val newState = !(item?.completed ?: false)
        toggleChecklist(itemId, newState)
    }

    suspend fun parseBrainDump(rawText: String, mode: String = "auto", provider: String = "ollama"): BrainDumpResponse {
        try {
            val res = api.createBrainDump(rawText, mode, provider)
            _activeBrainDump.value = res.brainDump
            _candidates.value = res.candidates
            _feasibility.value = res.feasibility
            _intelligencePlan.value = res.intelligencePlan
            return res
        } catch (e: Exception) {
            // Simulated local offline parser
            val dump = BrainDump(
                id = "dump-${System.currentTimeMillis()}",
                rawText = rawText,
                mode = "ai"
            )
            val generatedCandidates = listOf(
                Candidate(
                    id = "cand-1",
                    brainDumpId = dump.id,
                    title = if (rawText.isNotBlank()) rawText.lines().first().take(40) else "Hardware sensor integration",
                    priority = "P1",
                    estimatedDuration = 60,
                    scheduledStart = "15:00",
                    scheduledEnd = "16:00",
                    expectedOutcome = "Execute primary requirement derived from stream of thought",
                    category = "Task",
                    isIncluded = 1
                ),
                Candidate(
                    id = "cand-2",
                    brainDumpId = dump.id,
                    title = "Review system dependencies and bus timing",
                    priority = "P2",
                    estimatedDuration = 30,
                    scheduledStart = "16:30",
                    scheduledEnd = "17:00",
                    expectedOutcome = "Clarify downstream dependencies",
                    category = "Task",
                    isIncluded = 1
                ),
                Candidate(
                    id = "cand-3",
                    brainDumpId = dump.id,
                    title = "Consider asynchronous DMA buffer transfer",
                    priority = "P3",
                    estimatedDuration = 20,
                    category = "Idea",
                    isIncluded = 0
                ),
                Candidate(
                    id = "cand-4",
                    brainDumpId = dump.id,
                    title = "Verify oscilloscope probe impedance calibration",
                    priority = "P2",
                    estimatedDuration = 15,
                    category = "Reminder",
                    isIncluded = 1
                )
            )
            _activeBrainDump.value = dump
            _candidates.value = generatedCandidates
            return BrainDumpResponse(
                brainDump = dump,
                candidates = generatedCandidates,
                feasibility = _feasibility.value ?: Feasibility(),
                intelligencePlan = _intelligencePlan.value
            )
        }
    }

    suspend fun fixPlan(): Boolean {
        val cands = _candidates.value.filter { it.isIncluded == 1 }
        val newTasks = cands.mapIndexed { idx, c ->
            Task(
                id = "cand-task-${System.currentTimeMillis()}-$idx",
                title = c.title,
                priority = c.priority,
                status = "planned",
                plannedDuration = c.estimatedDuration,
                scheduledStart = c.scheduledStart,
                scheduledEnd = c.scheduledEnd,
                expectedOutcome = c.expectedOutcome,
                category = c.category,
                sortOrder = idx + 10
            )
        }
        val currentList = _todayTasks.value.toMutableList()
        currentList.addAll(newTasks)
        _todayTasks.value = currentList
        _candidates.value = emptyList()
        _activeBrainDump.value = null
        recomputeFeasibility()
        return true
    }

    private fun recomputeFeasibility() {
        val plannedMinutes = _todayTasks.value.filter { it.status != "completed" }.sumOf { it.plannedDuration }
        val availableMinutes = 360 // 6 hour cognitive budget
        val bufferMinutes = maxOf(0, availableMinutes - plannedMinutes)
        val workloadPercent = if (availableMinutes > 0) (plannedMinutes * 100) / availableMinutes else 0
        val isFeasible = plannedMinutes <= availableMinutes
        val status = if (isFeasible) {
            if (workloadPercent > 85) "warning" else "achievable"
        } else {
            "overloaded"
        }
        val message = when (status) {
            "achievable" -> "SYSTEM: FEASIBLE & BALANCED"
            "warning" -> "SYSTEM: NEAR CAPACITY // 15% BUFFER"
            else -> "SYSTEM: OVERLOADED // DEFICIT ${plannedMinutes - availableMinutes}m"
        }
        _feasibility.value = Feasibility(
            status = status,
            plannedMinutes = plannedMinutes,
            availableMinutes = availableMinutes,
            bufferMinutes = bufferMinutes,
            workloadPercent = workloadPercent,
            isFeasible = isFeasible,
            message = message
        )
    }

    suspend fun refreshSettings() {
        try {
            _settings.value = api.getSettings()
        } catch (e: Exception) {
            // Keep default settings
        }
    }

    suspend fun saveSettings(newSettings: SettingsData) {
        _settings.value = newSettings
        try {
            api.saveSettings(newSettings)
            api.setServerBaseUrl(newSettings.server_url)
        } catch (e: Exception) {
            // Local settings saved
        }
    }

    suspend fun testServerConnection(url: String): Boolean {
        return try {
            api.setServerBaseUrl(url)
            api.testConnection()
            true
        } catch (e: Exception) {
            false
        }
    }

    val updateManager = com.flowdesk.app.data.update.AppUpdateManager(context)

    fun getCurrentAppVersion(): String = "1.0.1"
    fun getBuildNumber(): Int = 2

    suspend fun checkForUpdates(): UpdateCheckResponse? {
        return try {
            val res = api.checkAppUpdate(getCurrentAppVersion())
            if (res.updateAvailable) res else null
        } catch (e: Exception) {
            checkGitHubReleasesFallback()
        }
    }

    private suspend fun checkGitHubReleasesFallback(): UpdateCheckResponse? = withContext(Dispatchers.IO) {
        try {
            val client = okhttp3.OkHttpClient()
            val request = okhttp3.Request.Builder()
                .url("https://api.github.com/repos/mrprdinesh810-bot/FlowDesk/releases/latest")
                .header("User-Agent", "FlowDesk-Android")
                .get()
                .build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val body = response.body?.string() ?: return@withContext null
                val json = com.google.gson.JsonParser.parseString(body).asJsonObject
                val tagName = json.get("tag_name")?.asString?.replace("^v".toRegex(), "") ?: return@withContext null
                val isNewer = compareVersions(tagName, getCurrentAppVersion()) > 0
                if (!isNewer) return@withContext null

                val bodyText = json.get("body")?.asString ?: "New release available on GitHub"
                val notes = bodyText.split("\n").map { it.trim().removePrefix("-").trim() }.filter { it.isNotBlank() }

                var downloadUrl = json.get("html_url")?.asString ?: ""
                var apkSize = 0L
                val assets = json.getAsJsonArray("assets")
                if (assets != null) {
                    for (element in assets) {
                        val assetObj = element.asJsonObject
                        val name = assetObj.get("name")?.asString ?: ""
                        if (name.endsWith(".apk", ignoreCase = true)) {
                            downloadUrl = assetObj.get("browser_download_url")?.asString ?: downloadUrl
                            apkSize = assetObj.get("size")?.asLong ?: 0L
                            break
                        }
                    }
                }

                UpdateCheckResponse(
                    latestVersion = tagName,
                    buildNumber = 2,
                    clientVersion = getCurrentAppVersion(),
                    updateAvailable = true,
                    downloadUrl = downloadUrl,
                    apkAvailable = downloadUrl.endsWith(".apk", ignoreCase = true),
                    apkSize = apkSize,
                    releaseNotes = notes
                )
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun compareVersions(v1: String, v2: String): Int {
        val parts1 = v1.replace("^v".toRegex(), "").split(".").map { it.toIntOrNull() ?: 0 }
        val parts2 = v2.replace("^v".toRegex(), "").split(".").map { it.toIntOrNull() ?: 0 }
        val maxLen = maxOf(parts1.size, parts2.size)
        for (i in 0 until maxLen) {
            val num1 = parts1.getOrElse(i) { 0 }
            val num2 = parts2.getOrElse(i) { 0 }
            if (num1 > num2) return 1
            if (num1 < num2) return -1
        }
        return 0
    }

    fun resolveUpdateDownloadUrl(rawUrl: String): String {
        if (rawUrl.startsWith("http://", ignoreCase = true) || rawUrl.startsWith("https://", ignoreCase = true)) {
            return rawUrl
        }
        val baseUrl = api.getServerBaseUrl().trimEnd('/')
        val cleanPath = if (rawUrl.startsWith("/")) rawUrl else "/$rawUrl"
        return "$baseUrl$cleanPath"
    }

    suspend fun installAppUpdate(rawUrl: String, onProgress: (Float) -> Unit): Result<Unit> {
        val resolved = resolveUpdateDownloadUrl(rawUrl)
        return updateManager.downloadAndInstall(resolved, onProgress)
    }

    companion object {
        @Volatile
        private var INSTANCE: FlowDeskRepository? = null

        fun getInstance(context: Context): FlowDeskRepository {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: FlowDeskRepository(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}
