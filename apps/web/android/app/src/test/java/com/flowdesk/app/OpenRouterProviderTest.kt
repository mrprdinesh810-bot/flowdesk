package com.flowdesk.app

import com.flowdesk.app.data.ai.OpenRouterProvider
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class OpenRouterProviderTest {

    @Test
    fun testProviderInfoReporting() = runBlocking {
        val provider = OpenRouterProvider(context = null, getApiKey = { null }, getModel = { "nex-agi/nex-n2.5-pro:free" })
        val info = provider.getInfo()

        assertEquals("openrouter", info.id)
        assertEquals("OpenRouter (Direct Cloud)", info.displayName)
        assertTrue(info.privacyDataPath.contains("OpenRouter"))
        assertFalse(info.isConfigured)
        assertFalse(info.isAvailable)
        assertEquals("API Key not configured in Settings", info.failureReason)
    }

    @Test
    fun testParseCandidatesJson_validSchema() {
        val provider = OpenRouterProvider(context = null, getApiKey = { "test-key" })
        val jsonPayload = """
        {
            "choices": [
                {
                    "message": {
                        "content": "{\"tasks\": [{\"title\": \"Build Sensor Parser\", \"priority\": \"P1\", \"estimated_duration\": 45, \"category\": \"Deep Work\", \"expected_outcome\": \"All sensor packets parsed without drop\"}, {\"title\": \"Weekly Team Sync\", \"priority\": \"P2\", \"estimated_duration\": 30, \"scheduled_start\": \"11:00\", \"scheduled_end\": \"11:30\", \"category\": \"Coordination\"}]}"
                    }
                }
            ]
        }
        """.trimIndent()

        val candidates = provider.parseAndValidateResponse(jsonPayload)

        assertEquals(2, candidates.size)
        assertEquals("Build Sensor Parser", candidates[0].title)
        assertEquals("P1", candidates[0].priority)
        assertEquals(45, candidates[0].estimatedDuration)
        assertEquals("Deep Work", candidates[0].category)
        assertEquals(1, candidates[0].isIncluded)

        assertEquals("Weekly Team Sync", candidates[1].title)
        assertEquals("11:00", candidates[1].scheduledStart)
        assertEquals("11:30", candidates[1].scheduledEnd)
    }

    @Test
    fun testParseCandidatesJson_withMarkdownFencing() {
        val provider = OpenRouterProvider(context = null, getApiKey = { "test-key" })
        val markdownFencedContent = "```json\n{\"tasks\": [{\"title\": \"Write unit tests\", \"priority\": \"P2\", \"estimated_duration\": 60, \"category\": \"Testing\"}]}\n```"
        val escaped = com.google.gson.Gson().toJson(markdownFencedContent)

        val jsonPayload = """
        {
            "choices": [
                {
                    "message": {
                        "content": $escaped
                    }
                }
            ]
        }
        """.trimIndent()

        val candidates = provider.parseAndValidateResponse(jsonPayload)

        assertEquals(1, candidates.size)
        assertEquals("Write unit tests", candidates[0].title)
        assertEquals("P2", candidates[0].priority)
        assertEquals(60, candidates[0].estimatedDuration)
    }

    @Test(expected = Exception::class)
    fun testParseCandidatesJson_malformedThrowsException_neverFakeTasks() {
        val provider = OpenRouterProvider(context = null, getApiKey = { "test-key" })
        val malformed = """
        {
            "choices": [
                {
                    "message": {
                        "content": "I cannot fulfill this request."
                    }
                }
            ]
        }
        """.trimIndent()

        provider.parseAndValidateResponse(malformed)
    }
}
