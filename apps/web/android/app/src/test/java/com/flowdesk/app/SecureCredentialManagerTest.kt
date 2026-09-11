package com.flowdesk.app

import com.flowdesk.app.data.local.SecureCredentialManager
import org.junit.Assert.*
import org.junit.Test

class SecureCredentialManagerTest {

    @Test
    fun testMaskKey_nullOrEmpty() {
        assertEquals("Not configured", SecureCredentialManager.maskKey(null))
        assertEquals("Not configured", SecureCredentialManager.maskKey(""))
        assertEquals("Not configured", SecureCredentialManager.maskKey("   "))
    }

    @Test
    fun testMaskKey_standardKey() {
        val sampleKey = "sk-or-v1-abcdef1234567890abcdef1234"
        val masked = SecureCredentialManager.maskKey(sampleKey)

        assertEquals("sk-or-v1••••••••1234", masked)
        assertFalse(masked.contains("abcdef1234567890abcdef"))
    }

    @Test
    fun testMaskKey_shortKey() {
        val shortKey = "secret123"
        val masked = SecureCredentialManager.maskKey(shortKey)
        assertEquals("••••••••", masked)
    }
}
