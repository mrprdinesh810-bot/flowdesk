package com.flowdesk.app.data.repository

import android.content.Context
import com.flowdesk.app.data.ai.*
import com.flowdesk.app.data.api.FlowDeskApiClient
import com.flowdesk.app.data.local.*
import com.flowdesk.app.data.model.*
import com.flowdesk.app.data.schedule.DeterministicScheduler
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

data class ImportSummary(
    val tasksImported: Int,
    val dumpsImported: Int,
    val skipped: Int,
    val message: String
)

class FlowDeskRepository(private val context: Context) {

    val api = FlowDeskApiClient(context)
    val db = FlowDeskDatabase.getInstance(context)
    val dao = db.dao()
    val credentials = SecureCredentialManager(context)

    private val scope = CoroutineScope(Dispatchers.Main)

    // AI Providers
    private val openRouterProvider = OpenRouterProvider(
        context = context,
        getApiKey = { credentials.getOpenRouterKey() },
        getModel = { _settings.value.openrouterModel }
    )
    private val serverProvider = FlowDeskServerProvider(api)
    private val onDeviceProvider = OnDeviceProvider()

    // Active StateFlows backed by Room Local Database
    private val _todayTasks = MutableStateFlow<List<Task>>(emptyList())
    val todayTasks: StateFlow<List<Task>> = _todayTasks.asStateFlow()

    private val _allTasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _allTasks.asStateFlow()

    private val _activeTimer = MutableStateFlow(ActiveTimerResponse(active = false))
    val activeTimer: StateFlow<ActiveTimerResponse> = _activeTimer.asStateFlow()

    private val _activeTimerSeconds = MutableStateFlow(0)
    val activeTimerSeconds: StateFlow<Int> = _activeTimerSeconds.asStateFlow()
    val timerTicker: StateFlow<Int> = _activeTimerSeconds.asStateFlow()

    private val _isTimerRunning = MutableStateFlow(false)
    val isTimerRunning: StateFlow<Boolean> = _isTimerRunning.asStateFlow()

    private val _activeBrainDump = MutableStateFlow<BrainDump?>(null)
    val activeBrainDump: StateFlow<BrainDump?> = _activeBrainDump.asStateFlow()

    private val _candidates = MutableStateFlow<List<Candidate>>(emptyList())
    val candidates: StateFlow<List<Candidate>> = _candidates.asStateFlow()

    private val _feasibility = MutableStateFlow<Feasibility?>(null)
    val feasibility: StateFlow<Feasibility?> = _feasibility.asStateFlow()

    private val _intelligencePlan = MutableStateFlow<IntelligencePlan?>(null)
    val intelligencePlan: StateFlow<IntelligencePlan?> = _intelligencePlan.asStateFlow()

    private val _settings = MutableStateFlow(SettingsData())
    val settings: StateFlow<SettingsData> = _settings.asStateFlow()

    private val _syncStatus = MutableStateFlow("Local Database Active")
    val syncStatus: StateFlow<String> = _syncStatus.asStateFlow()

    init {
        // 1. Observe Room Tasks reactively
        scope.launch {
            val todayStr = getTodayDateString()
            dao.getTasksForDateFlow(todayStr).collect { taskEntities ->
                val converted = taskEntities.map { it.toTask() }
                _todayTasks.value = converted
                recomputeFeasibility(converted)
            }
        }

        scope.launch {
            dao.getAllTasksWithChecklistsFlow().collect { taskEntities ->
                _allTasks.value = taskEntities.map { it.toTask() }
            }
        }

        // 2. Monotonic local timer ticker
        scope.launch {
            while (true) {
                delay(1000)
                if (_isTimerRunning.value) {
                    _activeTimerSeconds.value += 1
                }
            }
        }

        // 3. Load initial local persistent state and restore timer if active
        scope.launch {
            loadLocalTimerSession()
            refreshSettings()
            refreshTodayTasks()
        }
    }

    private fun getTodayDateString(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }

    private suspend fun loadLocalTimerSession() = withContext(Dispatchers.IO) {
        val sessionEntity = dao.getActiveTimerSession()
        if (sessionEntity != null) {
            val taskWithChecklists = dao.getTaskById(sessionEntity.taskId)
            val session = sessionEntity.toTimerSession()
            val task = taskWithChecklists?.toTask()

            _activeTimer.value = ActiveTimerResponse(
                active = true,
                activeSeconds = session.elapsedSeconds,
                session = session,
                task = task
            )
            _activeTimerSeconds.value = session.elapsedSeconds
            _isTimerRunning.value = sessionEntity.state == "active"
        }
    }

    suspend fun getActiveAiProvider(): AiProvider {
        return when (_settings.value.selectedProvider) {
            "openrouter" -> openRouterProvider
            "flowdesk_server" -> serverProvider
            "on_device" -> onDeviceProvider
            else -> openRouterProvider
        }
    }

    suspend fun getActiveProviderInfo(): AiProviderInfo {
        return getActiveAiProvider().getInfo()
    }

    // --- Task CRUD Operations (Room Local First) ---

    suspend fun addTask(task: Task) = withContext(Dispatchers.IO) {
        val todayStr = getTodayDateString()
        val taskEntity = TaskEntity.fromTask(task, scheduledDate = todayStr, syncStatus = SyncStatus.LOCAL_ONLY)
        val checklistEntities = task.checklists.map {
            ChecklistItemEntity.fromChecklistItem(it, syncStatus = SyncStatus.LOCAL_ONLY)
        }
        dao.insertTaskWithChecklists(taskEntity, checklistEntities)

        // Attempt asynchronous server push if server is available
        scope.launch(Dispatchers.IO) {
            try {
                api.createTask(task)
                dao.updateTaskSyncStatus(task.id, SyncStatus.SYNCED)
            } catch (e: Exception) {
                // Succeeded locally as LOCAL_ONLY
            }
        }
    }

    suspend fun completeTask(taskId: String) = withContext(Dispatchers.IO) {
        dao.updateTaskStatus(taskId, "completed", System.currentTimeMillis(), SyncStatus.PENDING_SYNC)
        scope.launch(Dispatchers.IO) {
            try {
                api.updateTaskStatus(taskId, "completed")
                dao.updateTaskSyncStatus(taskId, SyncStatus.SYNCED)
            } catch (e: Exception) {
                // Preserved locally as PENDING_SYNC
            }
        }
    }

    suspend fun onTaskToggle(taskId: String, newStatus: String) = withContext(Dispatchers.IO) {
        dao.updateTaskStatus(taskId, newStatus, System.currentTimeMillis(), SyncStatus.PENDING_SYNC)
        scope.launch(Dispatchers.IO) {
            try {
                api.updateTaskStatus(taskId, newStatus)
                dao.updateTaskSyncStatus(taskId, SyncStatus.SYNCED)
            } catch (e: Exception) {
                // Preserved locally as PENDING_SYNC
            }
        }
    }

    suspend fun deleteTask(taskId: String) = withContext(Dispatchers.IO) {
        dao.deleteTaskById(taskId)
        scope.launch(Dispatchers.IO) {
            try {
                api.deleteTask(taskId)
            } catch (e: Exception) {
                // Locally deleted
            }
        }
    }

    suspend fun toggleChecklist(itemId: String, completed: Boolean) = withContext(Dispatchers.IO) {
        dao.updateChecklistCompletion(itemId, if (completed) 1 else 0, System.currentTimeMillis(), SyncStatus.PENDING_SYNC)
        scope.launch(Dispatchers.IO) {
            try {
                api.toggleChecklist(itemId, completed)
            } catch (e: Exception) {
                // Succeeded locally
            }
        }
    }

    suspend fun toggleChecklist(taskId: String, itemId: String) = withContext(Dispatchers.IO) {
        val taskWithChecks = dao.getTaskById(taskId)
        val item = taskWithChecks?.checklists?.find { it.id == itemId }
        val nextCompleted = (item?.isCompleted ?: 0) == 0
        toggleChecklist(itemId, nextCompleted)
    }

    // --- Deterministic Timer State Management ---

    suspend fun startTimer(taskId: String, durationMinutes: Int = 45) = withContext(Dispatchers.IO) {
        val taskWithChecks = dao.getTaskById(taskId)
        val targetTask = taskWithChecks?.toTask()

        val plannedDuration = targetTask?.plannedDuration ?: durationMinutes
        val nowTimeStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val sessionId = "sess-${System.currentTimeMillis()}"

        val sessionEntity = TimerSessionEntity(
            id = sessionId,
            taskId = taskId,
            startedAt = nowTimeStr,
            pausedAt = null,
            elapsedSeconds = 0,
            plannedDuration = plannedDuration,
            state = "active"
        )
        dao.insertOrUpdateTimerSession(sessionEntity)

        val session = sessionEntity.toTimerSession()
        _activeTimer.value = ActiveTimerResponse(
            active = true,
            activeSeconds = 0,
            session = session,
            task = targetTask
        )
        _activeTimerSeconds.value = 0
        _isTimerRunning.value = true

        scope.launch(Dispatchers.IO) {
            try {
                api.startTimer(taskId)
            } catch (e: Exception) {
                // Offline timer active
            }
        }
    }

    suspend fun pauseTimer() = withContext(Dispatchers.IO) {
        _isTimerRunning.value = false
        val currentSession = _activeTimer.value.session ?: return@withContext
        val pausedAtStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())

        val updatedEntity = TimerSessionEntity(
            id = currentSession.id,
            taskId = currentSession.taskId,
            startedAt = currentSession.startedAt,
            pausedAt = pausedAtStr,
            elapsedSeconds = _activeTimerSeconds.value,
            plannedDuration = currentSession.plannedDuration,
            state = "paused"
        )
        dao.insertOrUpdateTimerSession(updatedEntity)
        _activeTimer.value = _activeTimer.value.copy(
            session = updatedEntity.toTimerSession()
        )

        scope.launch(Dispatchers.IO) {
            try {
                api.pauseTimer(currentSession.id)
            } catch (e: Exception) {}
        }
    }

    suspend fun resumeTimer() = withContext(Dispatchers.IO) {
        _isTimerRunning.value = true
        val currentSession = _activeTimer.value.session ?: return@withContext

        val updatedEntity = TimerSessionEntity(
            id = currentSession.id,
            taskId = currentSession.taskId,
            startedAt = currentSession.startedAt,
            pausedAt = null,
            elapsedSeconds = _activeTimerSeconds.value,
            plannedDuration = currentSession.plannedDuration,
            state = "active"
        )
        dao.insertOrUpdateTimerSession(updatedEntity)

        scope.launch(Dispatchers.IO) {
            try {
                api.resumeTimer(currentSession.id)
            } catch (e: Exception) {}
        }
    }

    suspend fun completeTimer() = withContext(Dispatchers.IO) {
        val current = _activeTimer.value
        val taskId = current.task_id
        if (taskId != null) {
            completeTask(taskId)
        }

        current.session?.let { sess ->
            dao.updateTimerState(sess.id, "completed")
        }

        _activeTimer.value = ActiveTimerResponse(active = false)
        _activeTimerSeconds.value = 0
        _isTimerRunning.value = false

        scope.launch(Dispatchers.IO) {
            try {
                current.session?.id?.let { api.completeTimer(it, true) }
            } catch (e: Exception) {}
        }
    }

    fun addTimerBuffer(minutes: Int = 10) {
        val current = _activeTimer.value
        val currentSession = current.session ?: return
        val updatedPlanned = currentSession.plannedDuration + minutes
        _activeTimer.value = current.copy(
            session = currentSession.copy(plannedDuration = updatedPlanned)
        )
        scope.launch(Dispatchers.IO) {
            val entity = TimerSessionEntity(
                id = currentSession.id,
                taskId = currentSession.taskId,
                startedAt = currentSession.startedAt,
                pausedAt = currentSession.pausedAt,
                elapsedSeconds = _activeTimerSeconds.value,
                plannedDuration = updatedPlanned,
                state = if (_isTimerRunning.value) "active" else "paused"
            )
            dao.insertOrUpdateTimerSession(entity)
        }
    }

    // --- Real AI Extraction Flow (Zero Fake Candidates) ---

    suspend fun parseBrainDump(rawText: String): Result<BrainDumpResponse> = withContext(Dispatchers.IO) {
        val provider = getActiveAiProvider()
        val dumpId = "dump-${System.currentTimeMillis()}"

        val parseResult = provider.parseBrainDump(rawText)
        if (parseResult.isFailure) {
            val err = parseResult.exceptionOrNull() ?: Exception("AI parsing failed")
            return@withContext Result.failure(err)
        }

        val rawCandidates = parseResult.getOrNull() ?: emptyList()
        if (rawCandidates.isEmpty()) {
            return@withContext Result.failure(IllegalStateException("AI returned 0 actionable tasks. Please refine your thoughts."))
        }

        // Run through Deterministic Scheduler on mobile
        val scheduledCandidates = DeterministicScheduler.scheduleCandidates(rawCandidates)

        val dumpEntity = BrainDumpEntity(
            id = dumpId,
            rawText = rawText,
            mode = "ai",
            provider = provider.id,
            status = "parsed"
        )
        dao.insertBrainDump(dumpEntity)

        val candidateEntities = scheduledCandidates.map {
            CandidateEntity.fromCandidate(it.copy(brainDumpId = dumpId))
        }
        dao.clearCandidates()
        dao.insertCandidates(candidateEntities)

        val dump = dumpEntity.toBrainDump()
        _activeBrainDump.value = dump
        _candidates.value = scheduledCandidates

        // Compute feasibility deterministically
        val simulatedTasks = scheduledCandidates.mapIndexed { idx, c ->
            Task(
                id = "cand-$idx",
                title = c.title,
                priority = c.priority,
                plannedDuration = c.estimatedDuration,
                scheduledStart = c.scheduledStart,
                scheduledEnd = c.scheduledEnd,
                category = c.category
            )
        }
        val feas = DeterministicScheduler.calculateFeasibility(simulatedTasks)
        val plan = DeterministicScheduler.buildIntelligencePlan(simulatedTasks)

        _feasibility.value = feas
        _intelligencePlan.value = plan

        Result.success(
            BrainDumpResponse(
                brainDump = dump,
                candidates = scheduledCandidates,
                feasibility = feas,
                intelligencePlan = plan
            )
        )
    }

    suspend fun fixPlan(): Boolean = withContext(Dispatchers.IO) {
        val cands = _candidates.value.filter { it.isIncluded == 1 }
        val todayStr = getTodayDateString()

        val taskEntities = cands.mapIndexed { idx, c ->
            TaskEntity(
                id = "task-${System.currentTimeMillis()}-$idx",
                title = c.title,
                priority = c.priority,
                status = "planned",
                plannedDuration = c.estimatedDuration,
                scheduledDate = todayStr,
                scheduledStart = c.scheduledStart,
                scheduledEnd = c.scheduledEnd,
                expectedOutcome = c.expectedOutcome,
                category = c.category,
                sortOrder = idx,
                syncStatus = SyncStatus.LOCAL_ONLY
            )
        }

        dao.insertTasks(taskEntities)
        dao.clearCandidates()
        _candidates.value = emptyList()
        _activeBrainDump.value = null

        // Trigger push to server if connected
        scope.launch(Dispatchers.IO) {
            taskEntities.forEach { t ->
                try {
                    api.createTask(t.toTask())
                    dao.updateTaskSyncStatus(t.id, SyncStatus.SYNCED)
                } catch (e: Exception) {}
            }
        }

        true
    }

    // --- Deterministic Feasibility Computation ---

    private fun recomputeFeasibility(currentTasks: List<Task>) {
        val feas = DeterministicScheduler.calculateFeasibility(currentTasks)
        val plan = DeterministicScheduler.buildIntelligencePlan(currentTasks)
        _feasibility.value = feas
        _intelligencePlan.value = plan
    }

    // --- Server Reconciliation & Sync Engine ---

    suspend fun refreshTodayTasks() = withContext(Dispatchers.IO) {
        val todayStr = getTodayDateString()

        // 1. Push any locally unsynced tasks to server
        val unsynced = dao.getUnsyncedTasks()
        for (taskWithChecks in unsynced) {
            val t = taskWithChecks.toTask()
            try {
                if (taskWithChecks.task.syncStatus == SyncStatus.LOCAL_ONLY) {
                    api.createTask(t)
                    dao.updateTaskSyncStatus(t.id, SyncStatus.SYNCED)
                } else if (taskWithChecks.task.syncStatus == SyncStatus.PENDING_SYNC) {
                    api.updateTaskStatus(t.id, t.status)
                    dao.updateTaskSyncStatus(t.id, SyncStatus.SYNCED)
                }
            } catch (e: Exception) {
                // Server unavailable; remains safely in local Room with PENDING_SYNC
            }
        }

        // 2. Fetch server tasks and reconcile deterministically
        try {
            val serverTasks = api.getTodayTasks(todayStr)
            _syncStatus.value = "Synced with FlowDesk Server (${serverTasks.size} remote nodes)"

            for (st in serverTasks) {
                val localExisting = dao.getTaskById(st.id)
                if (localExisting == null) {
                    // New item from server: insert into Room as SYNCED
                    dao.insertTaskWithChecklists(
                        TaskEntity.fromTask(st, scheduledDate = todayStr, syncStatus = SyncStatus.SYNCED),
                        st.checklists.map { ChecklistItemEntity.fromChecklistItem(it, SyncStatus.SYNCED) }
                    )
                } else {
                    // Conflict Resolution Rule (Single-User):
                    // Never regress a locally completed task.
                    val localTask = localExisting.toTask()
                    if (localTask.status == "completed" && st.status != "completed") {
                        // Local completion wins; push status to server
                        try {
                            api.updateTaskStatus(st.id, "completed")
                            dao.updateTaskSyncStatus(st.id, SyncStatus.SYNCED)
                        } catch (e: Exception) {}
                    } else if (localExisting.task.syncStatus == SyncStatus.SYNCED) {
                        // Local has no pending edits: update with server's authoritative version
                        dao.insertTaskWithChecklists(
                            TaskEntity.fromTask(st, scheduledDate = todayStr, syncStatus = SyncStatus.SYNCED),
                            st.checklists.map { ChecklistItemEntity.fromChecklistItem(it, SyncStatus.SYNCED) }
                        )
                    }
                }
            }
        } catch (e: Exception) {
            _syncStatus.value = "Offline Mode • Local Room Authoritative"
        }
    }

    // --- Controlled Historical Data Import ---

    suspend fun importServerHistory(): Result<ImportSummary> = withContext(Dispatchers.IO) {
        try {
            val todayStr = getTodayDateString()
            val remoteTasks = api.getTodayTasks(todayStr)
            var count = 0

            for (t in remoteTasks) {
                dao.insertTaskWithChecklists(
                    TaskEntity.fromTask(t, scheduledDate = todayStr, syncStatus = SyncStatus.SYNCED),
                    t.checklists.map { ChecklistItemEntity.fromChecklistItem(it, SyncStatus.SYNCED) }
                )
                count++
            }

            Result.success(
                ImportSummary(
                    tasksImported = count,
                    dumpsImported = 0,
                    skipped = 0,
                    message = "Successfully imported $count tasks from FlowDesk Server into Room database."
                )
            )
        } catch (e: Exception) {
            Result.failure(Exception("Cannot connect to server for import: ${e.message}"))
        }
    }

    // --- Settings & Credentials ---

    suspend fun refreshSettings() = withContext(Dispatchers.IO) {
        val prefs = context.getSharedPreferences("flowdesk_prefs", Context.MODE_PRIVATE)
        val selectedProvider = prefs.getString("ai_provider", "openrouter") ?: "openrouter"
        val openrouterModel = prefs.getString("openrouter_model", "nex-agi/nex-n2.5-pro:free") ?: "nex-agi/nex-n2.5-pro:free"
        val serverUrl = prefs.getString("server_url", "http://10.0.2.2:4000") ?: "http://10.0.2.2:4000"

        _settings.value = SettingsData(
            selectedProvider = selectedProvider,
            openrouterModel = openrouterModel,
            serverUrl = serverUrl
        )
    }

    suspend fun saveSettings(newSettings: SettingsData) = withContext(Dispatchers.IO) {
        val prefs = context.getSharedPreferences("flowdesk_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("ai_provider", newSettings.selectedProvider)
            .putString("openrouter_model", newSettings.openrouterModel)
            .putString("server_url", newSettings.serverUrl)
            .apply()

        api.setServerBaseUrl(newSettings.serverUrl)
        _settings.value = newSettings
    }

    fun saveOpenRouterApiKey(key: String) {
        credentials.saveOpenRouterKey(key)
    }

    fun getMaskedOpenRouterKey(): String {
        return credentials.getMaskedKey()
    }

    fun isOpenRouterConfigured(): Boolean {
        return credentials.isOpenRouterConfigured()
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

    // --- Software Update & Telemetry ---

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

    // --- Real Storage Access Framework (SAF) Backup & Restore ---

    data class DatabaseStats(
        val dbName: String,
        val fileSizeBytes: Long,
        val walSizeBytes: Long,
        val taskCount: Int,
        val brainDumpCount: Int
    )

    suspend fun getDatabaseStats(): DatabaseStats = withContext(Dispatchers.IO) {
        val dbFile = context.getDatabasePath("flowdesk_local.db")
        val walFile = context.getDatabasePath("flowdesk_local.db-wal")
        val taskCount = dao.getTaskCount()
        val dumpCount = dao.getBrainDumpCount()
        DatabaseStats(
            dbName = "flowdesk_local.db",
            fileSizeBytes = if (dbFile.exists()) dbFile.length() else 0L,
            walSizeBytes = if (walFile.exists()) walFile.length() else 0L,
            taskCount = taskCount,
            brainDumpCount = dumpCount
        )
    }

    suspend fun exportBackupToUri(uri: android.net.Uri): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val tasks = dao.getAllTasksWithChecklists()
            val dumps = dao.getRecentBrainDumps()
            val jsonObj = com.google.gson.JsonObject().apply {
                addProperty("version", 2)
                addProperty("exportTimestamp", System.currentTimeMillis())
                addProperty("taskCount", tasks.size)
                addProperty("dumpCount", dumps.size)

                val tasksArr = com.google.gson.JsonArray()
                tasks.forEach { t ->
                    val tObj = com.google.gson.JsonObject().apply {
                        addProperty("id", t.task.id)
                        addProperty("title", t.task.title)
                        addProperty("priority", t.task.priority)
                        addProperty("status", t.task.status)
                        addProperty("plannedDuration", t.task.plannedDuration)
                        addProperty("actualDuration", t.task.actualDuration)
                        addProperty("scheduledDate", t.task.scheduledDate)
                        addProperty("scheduledStart", t.task.scheduledStart)
                        addProperty("scheduledEnd", t.task.scheduledEnd)
                        addProperty("expectedOutcome", t.task.expectedOutcome)
                        addProperty("category", t.task.category)
                        addProperty("sortOrder", t.task.sortOrder)
                        val checksArr = com.google.gson.JsonArray()
                        t.checklists.forEach { c ->
                            val cObj = com.google.gson.JsonObject().apply {
                                addProperty("id", c.id)
                                addProperty("title", c.title)
                                addProperty("isCompleted", c.isCompleted)
                                addProperty("sortOrder", c.sortOrder)
                            }
                            checksArr.add(cObj)
                        }
                        add("checklists", checksArr)
                    }
                    tasksArr.add(tObj)
                }
                add("tasks", tasksArr)
            }

            context.contentResolver.openOutputStream(uri)?.use { os ->
                os.write(jsonObj.toString().toByteArray(Charsets.UTF_8))
                os.flush()
            } ?: return@withContext Result.failure(Exception("Unable to open output stream for URI"))

            Result.success(tasks.size)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun restoreBackupFromUri(uri: android.net.Uri): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val jsonStr = context.contentResolver.openInputStream(uri)?.use { inputStream ->
                inputStream.bufferedReader(Charsets.UTF_8).readText()
            } ?: return@withContext Result.failure(Exception("Unable to open input stream for URI"))

            val jsonObj = com.google.gson.JsonParser.parseString(jsonStr).asJsonObject
            val tasksArr = jsonObj.getAsJsonArray("tasks")
                ?: return@withContext Result.failure(Exception("Invalid backup: missing 'tasks' array"))

            var restoredCount = 0
            val taskEntities = mutableListOf<TaskEntity>()
            val checklistEntities = mutableListOf<ChecklistItemEntity>()

            for (item in tasksArr) {
                val tObj = item.asJsonObject
                val taskId = tObj.get("id")?.asString ?: "task-${System.currentTimeMillis()}-$restoredCount"
                val taskEntity = TaskEntity(
                    id = taskId,
                    title = tObj.get("title")?.asString ?: "Untitled Restored Task",
                    priority = tObj.get("priority")?.asString ?: "P2",
                    status = tObj.get("status")?.asString ?: "planned",
                    plannedDuration = tObj.get("plannedDuration")?.asInt ?: 30,
                    actualDuration = tObj.get("actualDuration")?.asInt ?: 0,
                    scheduledDate = tObj.get("scheduledDate")?.asString ?: getTodayDateString(),
                    scheduledStart = tObj.get("scheduledStart")?.asString,
                    scheduledEnd = tObj.get("scheduledEnd")?.asString,
                    expectedOutcome = tObj.get("expectedOutcome")?.asString,
                    category = tObj.get("category")?.asString ?: "Task",
                    sortOrder = tObj.get("sortOrder")?.asInt ?: restoredCount,
                    syncStatus = SyncStatus.LOCAL_ONLY
                )
                taskEntities.add(taskEntity)

                val checksArr = tObj.getAsJsonArray("checklists")
                if (checksArr != null) {
                    for (cItem in checksArr) {
                        val cObj = cItem.asJsonObject
                        val cId = cObj.get("id")?.asString ?: "check-${System.currentTimeMillis()}"
                        checklistEntities.add(
                            ChecklistItemEntity(
                                id = cId,
                                taskId = taskId,
                                title = cObj.get("title")?.asString ?: "",
                                isCompleted = cObj.get("isCompleted")?.asInt ?: 0,
                                sortOrder = cObj.get("sortOrder")?.asInt ?: 0,
                                syncStatus = SyncStatus.LOCAL_ONLY
                            )
                        )
                    }
                }
                restoredCount++
            }

            dao.insertTasks(taskEntities)
            if (checklistEntities.isNotEmpty()) {
                dao.insertChecklistItems(checklistEntities)
            }

            Result.success(restoredCount)
        } catch (e: Exception) {
            Result.failure(e)
        }
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
