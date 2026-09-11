package com.flowdesk.app.data.api

import android.content.Context
import com.flowdesk.app.data.model.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class FlowDeskApiClient(private val context: Context) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private val prefs = context.getSharedPreferences("flowdesk_prefs", Context.MODE_PRIVATE)

    fun getServerBaseUrl(): String {
        return prefs.getString("server_url", "http://10.0.2.2:4000") ?: "http://10.0.2.2:4000"
    }

    fun setServerBaseUrl(url: String) {
        val clean = url.trim().trimEnd('/')
        prefs.edit().putString("server_url", clean).apply()
    }

    private fun buildUrl(path: String): String {
        val base = getServerBaseUrl().trimEnd('/')
        val cleanPath = if (path.startsWith("/")) path else "/$path"
        return "$base$cleanPath"
    }

    private suspend inline fun <reified T> executeGet(path: String): T = withContext(Dispatchers.IO) {
        val request = Request.Builder().url(buildUrl(path)).get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("HTTP ${response.code}: ${response.message}")
            }
            val body = response.body?.string() ?: throw IOException("Empty response")
            gson.fromJson(body, object : TypeToken<T>() {}.type)
        }
    }

    private suspend inline fun <reified T> executePost(path: String, bodyObj: Any? = null): T = withContext(Dispatchers.IO) {
        val json = if (bodyObj != null) gson.toJson(bodyObj) else "{}"
        val requestBody = json.toRequestBody(jsonMediaType)
        val request = Request.Builder().url(buildUrl(path)).post(requestBody).build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("HTTP ${response.code}: ${response.message}")
            }
            val body = response.body?.string() ?: throw IOException("Empty response")
            gson.fromJson(body, object : TypeToken<T>() {}.type)
        }
    }

    private suspend inline fun <reified T> executePut(path: String, bodyObj: Any): T = withContext(Dispatchers.IO) {
        val json = gson.toJson(bodyObj)
        val requestBody = json.toRequestBody(jsonMediaType)
        val request = Request.Builder().url(buildUrl(path)).put(requestBody).build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("HTTP ${response.code}: ${response.message}")
            }
            val body = response.body?.string() ?: throw IOException("Empty response")
            gson.fromJson(body, object : TypeToken<T>() {}.type)
        }
    }

    private suspend inline fun <reified T> executeDelete(path: String): T = withContext(Dispatchers.IO) {
        val request = Request.Builder().url(buildUrl(path)).delete().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("HTTP ${response.code}: ${response.message}")
            }
            val body = response.body?.string() ?: throw IOException("Empty response")
            gson.fromJson(body, object : TypeToken<T>() {}.type)
        }
    }

    // API Methods
    suspend fun getTodayTasks(date: String): List<Task> =
        executeGet("/api/v1/tasks?date=$date")

    suspend fun createTask(task: Task): Map<String, Any> =
        executePost("/api/v1/tasks", task)

    suspend fun updateTaskStatus(id: String, status: String): Map<String, Any> =
        executePost("/api/v1/tasks/$id/status", mapOf("status" to status))

    suspend fun deleteTask(id: String): Map<String, Any> =
        executeDelete("/api/v1/tasks/$id")

    suspend fun toggleChecklist(id: String, isCompleted: Boolean): Map<String, Any> =
        executePost("/api/v1/tasks/checklists/$id/toggle", mapOf("is_completed" to if (isCompleted) 1 else 0))

    suspend fun createBrainDump(rawText: String, mode: String, provider: String): BrainDumpResponse =
        executePost("/api/v1/brain-dumps", mapOf("raw_text" to rawText, "mode" to mode, "provider" to provider))

    suspend fun clarifyCandidate(candidateId: String, answer: String): Map<String, Any> =
        executePost("/api/v1/brain-dumps/candidates/$candidateId/clarify", mapOf("answer" to answer))

    suspend fun updateCandidate(id: String, updates: Map<String, Any>): Map<String, Any> =
        executePut("/api/v1/brain-dumps/candidates/$id", updates)

    suspend fun deleteCandidate(id: String): Map<String, Any> =
        executeDelete("/api/v1/brain-dumps/candidates/$id")

    suspend fun replanSchedule(brainDumpId: String, note: String): Map<String, Any> =
        executePost("/api/v1/brain-dumps/replan", mapOf("brain_dump_id" to brainDumpId, "interruption_note" to note))

    suspend fun fixPlan(brainDumpId: String, candidates: List<Candidate>): Map<String, Any> =
        executePost("/api/v1/fix", mapOf("brain_dump_id" to brainDumpId, "candidates" to candidates))

    suspend fun getActiveTimer(): ActiveTimerResponse =
        executeGet("/api/v1/timers/active")

    suspend fun startTimer(taskId: String): ActiveTimerResponse =
        executePost("/api/v1/timers/start", mapOf("task_id" to taskId))

    suspend fun pauseTimer(sessionId: String): ActiveTimerResponse =
        executePost("/api/v1/timers/pause", mapOf("session_id" to sessionId))

    suspend fun resumeTimer(sessionId: String): ActiveTimerResponse =
        executePost("/api/v1/timers/resume", mapOf("session_id" to sessionId))

    suspend fun completeTimer(sessionId: String, markTaskCompleted: Boolean = true): ActiveTimerResponse =
        executePost("/api/v1/timers/complete", mapOf("session_id" to sessionId, "mark_task_completed" to markTaskCompleted))

    suspend fun getDailyReview(date: String): DailyReview =
        executeGet("/api/v1/reviews/$date")

    suspend fun saveDailyReview(date: String, review: DailyReview): Map<String, Any> =
        executePost("/api/v1/reviews/$date", review)

    suspend fun getAnalytics(): AnalyticsData =
        executeGet("/api/v1/analytics")

    suspend fun getSettings(): SettingsData =
        executeGet("/api/v1/settings")

    suspend fun saveSettings(settings: SettingsData): Map<String, Any> =
        executePut("/api/v1/settings", settings)

    suspend fun testConnection(): String = withContext(Dispatchers.IO) {
        val request = Request.Builder().url(buildUrl("/api/v1/health")).get().build()
        client.newCall(request).execute().use { response ->
            if (response.isSuccessful) "Connected successfully!" else "Server returned HTTP ${response.code}"
        }
    }

    suspend fun checkAppUpdate(version: String): UpdateCheckResponse =
        executeGet("/api/v1/app-update/check?version=$version")
}
