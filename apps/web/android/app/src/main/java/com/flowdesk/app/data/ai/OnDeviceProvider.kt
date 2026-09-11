package com.flowdesk.app.data.ai

import com.flowdesk.app.data.model.Candidate

class OnDeviceProvider : AiProvider {

    override val id: String = "on_device"
    override val displayName: String = "On-Device Inference (Upcoming)"

    override suspend fun getInfo(): AiProviderInfo {
        return AiProviderInfo(
            id = id,
            displayName = displayName,
            modelName = "None (Prepared Architecture)",
            isConfigured = false,
            isAvailable = false,
            privacyDataPath = "Local NPU/CPU execution (100% on-device)",
            failureReason = "On-device inference engine is not yet installed in this phase."
        )
    }

    override suspend fun parseBrainDump(rawText: String): Result<List<Candidate>> {
        return Result.failure(
            UnsupportedOperationException("On-device AI runtime is not yet installed. Please select OpenRouter or FlowDesk Server in Settings.")
        )
    }
}
