package com.flowdesk.app.data.ai

import android.content.Context
import com.flowdesk.app.data.model.Candidate
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class OpenRouterProvider(
    private val context: Context? = null,
    private val getApiKey: () -> String?,
    private val getModel: () -> String = { "nex-agi/nex-n2.5-pro:free" }
) : AiProvider {

    override val id: String = "openrouter"
    override val displayName: String = "OpenRouter (Direct Cloud)"

    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    override suspend fun getInfo(): AiProviderInfo {
        val key = getApiKey()
        val configured = !key.isNullOrBlank()
        return AiProviderInfo(
            id = id,
            displayName = displayName,
            modelName = getModel(),
            isConfigured = configured,
            isAvailable = configured,
            privacyDataPath = "Sent directly from this device to OpenRouter API (HTTPS)",
            failureReason = if (!configured) "API Key not configured in Settings" else null
        )
    }

    override suspend fun parseBrainDump(rawText: String): Result<List<Candidate>> = withContext(Dispatchers.IO) {
        val apiKey = getApiKey()
        if (apiKey.isNullOrBlank()) {
            return@withContext Result.failure(IllegalStateException("OpenRouter API key is missing. Please configure your key in Settings."))
        }

        if (rawText.isBlank()) {
            return@withContext Result.failure(IllegalArgumentException("Brain dump input is empty."))
        }

        val model = getModel().ifBlank { "nex-agi/nex-n2.5-pro:free" }

        val systemPrompt = """
            You are the FlowDesk Semantic Parser. Your job is to extract actionable tasks, time allocations, and priorities from the user's stream-of-thought input.
            
            RULES:
            1. Output ONLY valid JSON matching this exact structure:
            {
              "tasks": [
                {
                  "title": "Concise task name",
                  "priority": "P1" | "P2" | "P3" | "P4",
                  "estimated_duration": 45,
                  "scheduled_start": "HH:MM" (or null if flexible),
                  "scheduled_end": "HH:MM" (or null if flexible),
                  "expected_outcome": "Concrete completion criteria",
                  "category": "Deep Work" | "Study" | "Coding" | "Fitness" | "Operations" | "Coordination"
                }
              ]
            }
            2. Priority guidelines:
               - P1: Urgent, non-negotiable critical work (exams, core deliverables, fixed meetings)
               - P2: High-value core execution tasks
               - P3: Normal routine and administrative work
               - P4: Optional, low-urgency or backlog ideas
            3. Duration must be an integer in minutes (between 5 and 360).
            4. Do NOT output any conversational text or markdown formatting around the JSON. Return only the raw JSON object.
        """.trimIndent()

        val messages = listOf(
            mapOf("role" to "system", "content" to systemPrompt),
            mapOf("role" to "user", "content" to rawText)
        )

        val requestPayload = mapOf(
            "model" to model,
            "messages" to messages,
            "temperature" to 0.2,
            "response_format" to mapOf("type" to "json_object")
        )

        val requestBody = gson.toJson(requestPayload).toRequestBody(jsonMediaType)
        val request = Request.Builder()
            .url("https://openrouter.ai/api/v1/chat/completions")
            .header("Authorization", "Bearer $apiKey")
            .header("HTTP-Referer", "https://flowdesk.app")
            .header("X-Title", "FlowDesk Mobile")
            .post(requestBody)
            .build()

        try {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val code = response.code
                    val errorBody = response.body?.string() ?: ""
                    return@withContext when (code) {
                        401 -> Result.failure(IOException("Invalid OpenRouter API Key. Please verify your key in Settings."))
                        429 -> Result.failure(IOException("OpenRouter rate limit or quota exceeded. Please check your account credit or select another model."))
                        else -> Result.failure(IOException("OpenRouter HTTP $code: $errorBody"))
                    }
                }

                val bodyStr = response.body?.string() ?: throw IOException("Empty response from OpenRouter.")
                val parsed = parseAndValidateResponse(bodyStr)
                Result.success(parsed)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun parseAndValidateResponse(jsonString: String): List<Candidate> {
        val rootObj = JsonParser.parseString(jsonString).asJsonObject
        val choices = rootObj.getAsJsonArray("choices")
            ?: throw IllegalStateException("OpenRouter response missing 'choices'")

        if (choices.size() == 0) {
            throw IllegalStateException("No choices returned by model")
        }

        val firstChoice = choices[0].asJsonObject
        val message = firstChoice.getAsJsonObject("message")
            ?: throw IllegalStateException("Choice missing 'message'")
        val content = message.get("content")?.asString
            ?: throw IllegalStateException("Empty content in model response")

        // Clean any accidental markdown backticks if model ignored json_object instruction
        val cleaned = content.trim().removePrefix("```json").removePrefix("```").removeSuffix("```").trim()
        val dataObj = JsonParser.parseString(cleaned).asJsonObject
        val tasksArray = dataObj.getAsJsonArray("tasks")
            ?: throw IllegalStateException("Model response missing required 'tasks' list")

        val results = mutableListOf<Candidate>()
        val baseId = System.currentTimeMillis()

        for (i in 0 until tasksArray.size()) {
            val item = tasksArray[i].asJsonObject
            val title = item.get("title")?.asString?.trim() ?: continue
            if (title.isBlank()) continue

            val rawPrio = item.get("priority")?.asString?.uppercase() ?: "P3"
            val priority = if (rawPrio in listOf("P1", "P2", "P3", "P4")) rawPrio else "P3"

            val rawDuration = item.get("estimated_duration")?.asInt ?: 30
            val duration = rawDuration.coerceIn(5, 360)

            val start = item.get("scheduled_start")?.takeIf { !it.isJsonNull }?.asString
            val end = item.get("scheduled_end")?.takeIf { !it.isJsonNull }?.asString
            val outcome = item.get("expected_outcome")?.takeIf { !it.isJsonNull }?.asString
            val category = item.get("category")?.takeIf { !it.isJsonNull }?.asString ?: "Task"

            results.add(
                Candidate(
                    id = "cand-$baseId-$i",
                    title = title,
                    priority = priority,
                    estimatedDuration = duration,
                    scheduledStart = start,
                    scheduledEnd = end,
                    expectedOutcome = outcome,
                    category = category,
                    isIncluded = 1,
                    sortOrder = i,
                    status = "proposed"
                )
            )
        }

        if (results.isEmpty()) {
            throw IllegalStateException("AI response contained 0 valid tasks.")
        }

        return results
    }
}
