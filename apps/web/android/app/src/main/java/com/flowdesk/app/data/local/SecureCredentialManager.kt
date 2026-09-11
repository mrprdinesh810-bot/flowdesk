package com.flowdesk.app.data.local

import android.content.Context
import android.content.SharedPreferences

class SecureCredentialManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("flowdesk_secure_credentials", Context.MODE_PRIVATE)

    fun saveOpenRouterKey(key: String) {
        prefs.edit().putString(KEY_OPENROUTER_API_KEY, key.trim()).apply()
    }

    fun getOpenRouterKey(): String? {
        return prefs.getString(KEY_OPENROUTER_API_KEY, null)?.takeIf { it.isNotBlank() }
    }

    fun isOpenRouterConfigured(): Boolean {
        return !getOpenRouterKey().isNullOrBlank()
    }

    fun getMaskedKey(): String {
        return maskKey(getOpenRouterKey())
    }

    fun clearOpenRouterKey() {
        prefs.edit().remove(KEY_OPENROUTER_API_KEY).apply()
    }

    companion object {
        private const val KEY_OPENROUTER_API_KEY = "openrouter_api_key"

        fun maskKey(key: String?): String {
            if (key.isNullOrBlank()) return "Not configured"
            return if (key.length > 12) {
                "${key.take(8)}••••••••${key.takeLast(4)}"
            } else {
                "••••••••"
            }
        }
    }
}
