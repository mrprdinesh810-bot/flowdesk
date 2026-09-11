package com.flowdesk.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    repository: FlowDeskRepository,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val settings by repository.settings.collectAsState()

    var serverUrl by remember { mutableStateOf(settings.server_url.ifBlank { repository.api.getServerBaseUrl() }) }
    var selectedProvider by remember { mutableStateOf(settings.selectedProvider) }
    var selectedModel by remember { mutableStateOf("qwen3.5:9b") }

    var isTestingConnection by remember { mutableStateOf(false) }
    var connectionStatus by remember { mutableStateOf<String?>(null) }
    var saveSuccessMessage by remember { mutableStateOf(false) }

    var isCheckingUpdate by remember { mutableStateOf(false) }
    var updateStatusText by remember { mutableStateOf<String?>(null) }
    var foundUpdate by remember { mutableStateOf<com.flowdesk.app.data.model.UpdateCheckResponse?>(null) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(GlacierBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 10.dp, bottom = 96.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onNavigateBack,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(10.dp))
                ) {
                    Icon(Icons.Outlined.ArrowBack, contentDescription = "Back", tint = AerospaceNavy, modifier = Modifier.size(18.dp))
                }

                Text(
                    text = "SYSTEM ENGINE CONFIG",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = AerospaceSlate
                )
            }
        }

        // User Identity Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(20.dp))
                    .padding(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(AerospaceNavy)
                            .border(1.5.dp, ElectricCobalt, RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("DK", color = Color.White, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text("Dinesh Kumar", fontSize = 16.sp, fontWeight = FontWeight.Black, color = AerospaceNavy)
                        Text("dinesh@flowdesk.internal", fontFamily = FontFamily.Monospace, fontSize = 11.sp, color = TechMuted)
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 2.dp)) {
                            Text(
                                "LOCAL CORE",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricCobalt,
                                modifier = Modifier
                                    .background(CyanSoft, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 5.dp, vertical = 1.dp)
                            )
                            Text(
                                "SLOT #03",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                color = TechMuted,
                                modifier = Modifier
                                    .background(GlacierBg, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 5.dp, vertical = 1.dp)
                            )
                        }
                    }
                }
            }
        }

        // AI Engine Configuration Card
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(18.dp))
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "AI RUNTIME ENGINE",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted
                    )

                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Box(modifier = Modifier.size(6.dp).background(StatusEmerald, CircleShape))
                        Text("OLLAMA ACTIVE", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = StatusEmerald)
                    }
                }

                // Provider Switcher
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("ollama" to "Ollama Local", "openai" to "Cloud LLM").forEach { (key, label) ->
                        val isSel = selectedProvider == key
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSel) CyanSoft else GlacierBg)
                                .border(1.dp, if (isSel) ElectricCobalt else GlacierBorder, RoundedCornerShape(10.dp))
                            .clickable { selectedProvider = key }
                            .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSel) ElectricCobalt else AerospaceNavy
                            )
                        }
                    }
                }

                // Model Selection
                Text("LOCAL MODEL", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TechMuted)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("qwen3.5:9b", "llama3.2:3b", "deepseek-r1").forEach { model ->
                        val isSel = selectedModel == model
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSel) ElectricCobalt else GlacierBg)
                                .border(1.dp, if (isSel) ElectricCobalt else GlacierBorder, RoundedCornerShape(8.dp))
                                .clickable { selectedModel = model }
                                .padding(vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = model,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSel) Color.White else AerospaceNavy
                            )
                        }
                    }
                }

                // Server Endpoint URL Input
                OutlinedTextField(
                    value = serverUrl,
                    onValueChange = { serverUrl = it },
                    label = { Text("Server Base URL (Local Node)") },
                    placeholder = { Text("http://10.0.2.2:4000") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )

                // Test Connection Button & Status
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = {
                            isTestingConnection = true
                            connectionStatus = null
                            coroutineScope.launch {
                                val ok = repository.testServerConnection(serverUrl)
                                isTestingConnection = false
                                connectionStatus = if (ok) "CONNECTED (HTTP 200)" else "OFFLINE (Local Fallback Active)"
                            }
                        },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f).height(44.dp)
                    ) {
                        if (isTestingConnection) {
                            CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                        } else {
                            Text("TEST CONNECTION", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    connectionStatus?.let { status ->
                        Text(
                            text = status,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (status.startsWith("CONNECTED")) StatusEmerald else StateWarning
                        )
                    }
                }
            }
        }

        // Save Settings Action Button
        item {
            Button(
                onClick = {
                    coroutineScope.launch {
                        val updated = settings.copy(
                            serverUrl = serverUrl,
                            selectedProvider = selectedProvider
                        )
                        repository.saveSettings(updated)
                        saveSuccessMessage = true
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Text(
                    text = if (saveSuccessMessage) "SETTINGS PERSISTED ✓" else "SAVE ENGINE CONFIGURATION",
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Black,
                    fontSize = 11.sp,
                    letterSpacing = 0.5.sp
                )
            }
        }

        // Software Update & Telemetry Card
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(18.dp))
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SOFTWARE UPDATES",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted
                    )
                    Text(
                        text = "BUILD v${repository.getCurrentAppVersion()}",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = ElectricCobalt
                    )
                }

                OutlinedButton(
                    onClick = {
                        isCheckingUpdate = true
                        updateStatusText = null
                        coroutineScope.launch {
                            val res = repository.checkForUpdates()
                            isCheckingUpdate = false
                            if (res != null && res.updateAvailable) {
                                foundUpdate = res
                                updateStatusText = "Update available: v${res.latestVersion}"
                            } else {
                                updateStatusText = "Up to date (v${repository.getCurrentAppVersion()})"
                            }
                        }
                    },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth().height(44.dp)
                ) {
                    if (isCheckingUpdate) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    } else {
                        Icon(Icons.Outlined.SystemUpdate, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("CHECK FOR SYSTEM UPDATES", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }

                updateStatusText?.let { status ->
                    Text(
                        text = status,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        color = if (status.startsWith("Update")) StatusEmerald else TechMuted,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                }
            }
        }

        // App Version Telemetry Footer
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "FlowDesk Native Android • v${repository.getCurrentAppVersion()} (Build ${repository.getBuildNumber()}) • Precision Kernel",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    color = TechMuted
                )
            }
        }
    }

    foundUpdate?.let { updateInfo ->
        com.flowdesk.app.ui.components.AppUpdateDialog(
            updateInfo = updateInfo,
            repository = repository,
            onDismiss = { foundUpdate = null }
        )
    }
}
