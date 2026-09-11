package com.flowdesk.app.data.ai

import com.flowdesk.app.data.api.FlowDeskApiClient
import com.flowdesk.app.data.model.Candidate

class FlowDeskServerProvider(
    private val api: FlowDeskApiClient
) : AiProvider {

    override val id: String = "flowdesk_server"
    override val displayName: String = "FlowDesk Server (Local Network)"

    override suspend fun getInfo(): AiProviderInfo {
        val serverUrl = api.getServerBaseUrl()
        return AiProviderInfo(
            id = id,
            displayName = displayName,
            modelName = "Server-Configured (Ollama/OpenRouter)",
            isConfigured = serverUrl.isNotBlank(),
            isAvailable = true,
            privacyDataPath = "Proxied via local network to $serverUrl",
            failureReason = null
        )
    }

    override suspend fun parseBrainDump(rawText: String): Result<List<Candidate>> {
        return try {
            val response = api.createBrainDump(rawText, mode = "ai", provider = "server")
            Result.success(response.candidates)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
