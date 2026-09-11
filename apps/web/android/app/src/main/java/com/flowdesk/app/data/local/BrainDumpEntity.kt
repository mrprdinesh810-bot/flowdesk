package com.flowdesk.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.flowdesk.app.data.model.BrainDump

@Entity(tableName = "brain_dumps")
data class BrainDumpEntity(
    @PrimaryKey val id: String,
    val rawText: String,
    val mode: String = "ai",
    val provider: String? = null,
    val status: String = "created",
    val createdAt: Long = System.currentTimeMillis()
) {
    fun toBrainDump(): BrainDump {
        return BrainDump(
            id = id,
            rawText = rawText,
            mode = mode,
            provider = provider
        )
    }

    companion object {
        fun fromBrainDump(dump: BrainDump, status: String = "created"): BrainDumpEntity {
            return BrainDumpEntity(
                id = dump.id,
                rawText = dump.rawText,
                mode = dump.mode,
                provider = dump.provider,
                status = status
            )
        }
    }
}
