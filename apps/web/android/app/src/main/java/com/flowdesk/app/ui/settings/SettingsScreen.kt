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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
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
    val syncStatusText by repository.syncStatus.collectAsState()

    var serverUrl by remember { mutableStateOf(settings.server_url.ifBlank { repository.api.getServerBaseUrl() }) }
    var selectedProvider by remember { mutableStateOf(settings.selectedProvider) }
    var selectedModel by remember { mutableStateOf(settings.openrouterModel) }

    // OpenRouter Secure Key Input State
    var openRouterKeyInput by remember { mutableStateOf("") }
    var isKeyVisible by remember { mutableStateOf(false) }
    var maskedKeyPreview by remember { mutableStateOf(repository.getMaskedOpenRouterKey()) }
    var isKeySavedSuccess by remember { mutableStateOf(false) }

    // Connection testing
    var isTestingConnection by remember { mutableStateOf(false) }
    var connectionStatus by remember { mutableStateOf<String?>(null) }
    var saveSuccessMessage by remember { mutableStateOf(false) }

    // History Import
    var showImportConfirmDialog by remember { mutableStateOf(false) }
    var isImportingHistory by remember { mutableStateOf(false) }
    var importStatusMessage by remember { mutableStateOf<String?>(null) }

    // App Update State
    var isCheckingUpdate by remember { mutableStateOf(false) }
    var updateStatusText by remember { mutableStateOf<String?>(null) }
    var foundUpdate by remember { mutableStateOf<com.flowdesk.app.data.model.UpdateCheckResponse?>(null) }

    // Database task stats
    var localTaskCount by remember { mutableIntStateOf(0) }
    var localDumpCount by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        localTaskCount = repository.dao.getTaskCount()
        localDumpCount = repository.dao.getBrainDumpCount()
    }

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

        // 1. Data Authority & Local Database Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(20.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "LOCAL PERSISTENT DATABASE",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = TechMuted
                        )
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(6.dp).background(StatusEmerald, CircleShape))
                            Text("ROOM SQLITE", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = StatusEmerald)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(GlacierBg)
                                .border(1.dp, GlacierBorder, RoundedCornerShape(10.dp))
                                .padding(10.dp)
                        ) {
                            Column {
                                Text("TASKS SAVED", fontFamily = FontFamily.Monospace, fontSize = 9.sp, color = TechMuted)
                                Text("$localTaskCount Nodes", fontFamily = FontFamily.Monospace, fontSize = 14.sp, fontWeight = FontWeight.Black, color = AerospaceNavy)
                            }
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(GlacierBg)
                                .border(1.dp, GlacierBorder, RoundedCornerShape(10.dp))
                                .padding(10.dp)
                        ) {
                            Column {
                                Text("BRAIN DUMPS", fontFamily = FontFamily.Monospace, fontSize = 9.sp, color = TechMuted)
                                Text("$localDumpCount Prompts", fontFamily = FontFamily.Monospace, fontSize = 14.sp, fontWeight = FontWeight.Black, color = AerospaceNavy)
                            }
                        }
                    }

                    Text(
                        text = "Sync Status: $syncStatusText",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        color = AerospaceSlate
                    )

                    OutlinedButton(
                        onClick = { showImportConfirmDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        if (isImportingHistory) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Outlined.CloudDownload, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("IMPORT EXISTING FLOWDESK HISTORY", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    importStatusMessage?.let { msg ->
                        Text(
                            text = msg,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            color = if (msg.startsWith("Success")) StatusEmerald else StateWarning
                        )
                    }
                }
            }
        }

        // 2. AI Provider Selection Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(20.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
                            val activeColor = if (selectedProvider == "openrouter" && repository.isOpenRouterConfigured()) StatusEmerald else ElectricCobalt
                            Box(modifier = Modifier.size(6.dp).background(activeColor, CircleShape))
                            Text(
                                text = selectedProvider.uppercase(),
                                fontFamily = FontFamily.Monospace,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = activeColor
                            )
                        }
                    }

                    // 3-Way Provider Switcher
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf(
                            Triple("openrouter", "OpenRouter (Direct Cloud)", "Encrypted HTTPS direct from phone"),
                            Triple("flowdesk_server", "FlowDesk Server (Local Network)", "Proxied via desktop server :4000"),
                            Triple("on_device", "On-Device Inference (Upcoming)", "100% offline NPU/CPU runtime")
                        ).forEach { (key, label, sub) ->
                            val isSel = selectedProvider == key
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (isSel) CyanSoft else GlacierBg)
                                    .border(1.dp, if (isSel) ElectricCobalt else GlacierBorder, RoundedCornerShape(10.dp))
                                    .clickable { selectedProvider = key }
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(
                                        text = label,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSel) ElectricCobalt else AerospaceNavy
                                    )
                                    Text(text = sub, fontSize = 9.sp, color = TechMuted)
                                }
                                if (isSel) {
                                    Text("ACTIVE", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Black, color = ElectricCobalt)
                                }
                            }
                        }
                    }

                    // OpenRouter Dedicated Configuration Section
                    if (selectedProvider == "openrouter") {
                        HorizontalDivider(color = GlacierBorder)

                        Text(
                            text = "OPENROUTER CLIENT CREDENTIALS",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = TechMuted
                        )

                        // Status pill
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(GlacierBg)
                                .border(1.dp, GlacierBorder, RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Key Status:", fontFamily = FontFamily.Monospace, fontSize = 10.sp, color = TechMuted)
                            Text(
                                text = maskedKeyPreview,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (repository.isOpenRouterConfigured()) StatusEmerald else StateWarning
                            )
                        }

                        // API Key Input
                        OutlinedTextField(
                            value = openRouterKeyInput,
                            onValueChange = { openRouterKeyInput = it },
                            label = { Text("Enter OpenRouter API Key (sk-or-v1-...)") },
                            placeholder = { Text("Paste your personal key here") },
                            visualTransformation = if (isKeyVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { isKeyVisible = !isKeyVisible }) {
                                    Icon(
                                        imageVector = if (isKeyVisible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                        contentDescription = "Toggle Visibility",
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    if (openRouterKeyInput.isNotBlank()) {
                                        repository.saveOpenRouterApiKey(openRouterKeyInput.trim())
                                        openRouterKeyInput = ""
                                        maskedKeyPreview = repository.getMaskedOpenRouterKey()
                                        isKeySavedSuccess = true
                                    }
                                },
                                enabled = openRouterKeyInput.isNotBlank(),
                                colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f).height(44.dp)
                            ) {
                                Text(if (isKeySavedSuccess) "KEY PERSISTED ✓" else "SAVE API KEY", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }

                            if (repository.isOpenRouterConfigured()) {
                                OutlinedButton(
                                    onClick = {
                                        repository.credentials.clearOpenRouterKey()
                                        maskedKeyPreview = repository.getMaskedOpenRouterKey()
                                        isKeySavedSuccess = false
                                    },
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.height(44.dp)
                                ) {
                                    Text("CLEAR", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = P1Red)
                                }
                            }
                        }

                        // Cloud Model Picker
                        Text("OPENROUTER MODEL", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TechMuted)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            listOf("nex-agi/nex-n2.5-pro:free", "meta-llama/llama-3.2-3b-instruct:free", "google/gemini-2.0-flash-exp:free").forEach { model ->
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
                                        text = model.substringAfter("/").take(14),
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSel) Color.White else AerospaceNavy
                                    )
                                }
                            }
                        }
                    }

                    // FlowDesk Server Section
                    if (selectedProvider == "flowdesk_server") {
                        HorizontalDivider(color = GlacierBorder)

                        OutlinedTextField(
                            value = serverUrl,
                            onValueChange = { serverUrl = it },
                            label = { Text("Server Base URL (Local Node)") },
                            placeholder = { Text("http://10.0.2.2:4000") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )

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
                                        connectionStatus = if (ok) "CONNECTED (HTTP 200)" else "OFFLINE"
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
            }
        }

        // Save Engine Configuration Button
        item {
            Button(
                onClick = {
                    coroutineScope.launch {
                        val updated = settings.copy(
                            serverUrl = serverUrl,
                            selectedProvider = selectedProvider,
                            openrouterModel = selectedModel
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
                    text = if (saveSuccessMessage) "CONFIGURATION SAVED ✓" else "SAVE ENGINE CONFIGURATION",
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
                    text = "FlowDesk Native Android • v${repository.getCurrentAppVersion()} (Build ${repository.getBuildNumber()}) • Room Persistent Kernel",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    color = TechMuted
                )
            }
        }
    }

    // Historical Data Import Confirmation Modal
    if (showImportConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showImportConfirmDialog = false },
            title = { Text("Import FlowDesk Server History?", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Text("This will fetch all legitimate historical tasks from the connected FlowDesk Server and insert them into your phone's Room database. No credentials will be copied.", fontSize = 13.sp)
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showImportConfirmDialog = false
                        isImportingHistory = true
                        importStatusMessage = null
                        coroutineScope.launch {
                            val res = repository.importServerHistory()
                            isImportingHistory = false
                            if (res.isSuccess) {
                                val summary = res.getOrNull()
                                importStatusMessage = summary?.message ?: "Import complete"
                                localTaskCount = repository.dao.getTaskCount()
                            } else {
                                importStatusMessage = res.exceptionOrNull()?.message ?: "Import failed"
                            }
                        }
                    }
                ) {
                    Text("START IMPORT", fontWeight = FontWeight.Bold, color = ElectricCobalt)
                }
            },
            dismissButton = {
                TextButton(onClick = { showImportConfirmDialog = false }) {
                    Text("CANCEL")
                }
            }
        )
    }

    foundUpdate?.let { updateInfo ->
        com.flowdesk.app.ui.components.AppUpdateDialog(
            updateInfo = updateInfo,
            repository = repository,
            onDismiss = { foundUpdate = null }
        )
    }
}
