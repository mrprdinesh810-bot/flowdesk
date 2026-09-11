package com.flowdesk.app.data.ai

import com.flowdesk.app.data.model.Candidate

data class AiProviderInfo(
    val id: String,
    val displayName: String,
    val modelName: String,
    val isConfigured: Boolean,
    val isAvailable: Boolean,
    val privacyDataPath: String,
    val failureReason: String? = null
)

interface AiProvider {
    val id: String
    val displayName: String
    suspend fun getInfo(): AiProviderInfo
    suspend fun parseBrainDump(rawText: String): Result<List<Candidate>>
}
