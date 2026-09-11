package com.flowdesk.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.navigation.NavigationShell
import com.flowdesk.app.ui.theme.FlowDeskTheme

class MainActivity : ComponentActivity() {

    private lateinit var repository: FlowDeskRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        repository = FlowDeskRepository(this)

        setContent {
            FlowDeskTheme {
                NavigationShell(repository = repository)
            }
        }
    }
}
