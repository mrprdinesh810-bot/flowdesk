package com.flowdesk.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        TaskEntity::class,
        ChecklistItemEntity::class,
        BrainDumpEntity::class,
        CandidateEntity::class,
        TimerSessionEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class FlowDeskDatabase : RoomDatabase() {

    abstract fun dao(): FlowDeskDao

    companion object {
        @Volatile
        private var INSTANCE: FlowDeskDatabase? = null

        fun getInstance(context: Context): FlowDeskDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    FlowDeskDatabase::class.java,
                    "flowdesk_local.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
