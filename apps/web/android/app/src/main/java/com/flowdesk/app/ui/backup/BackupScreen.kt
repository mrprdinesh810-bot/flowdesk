package com.flowdesk.app.ui.backup

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun BackupScreen(
    repository: FlowDeskRepository,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var isBackingUp by remember { mutableStateOf(false) }
    var isRestoring by remember { mutableStateOf(false) }
    var statusFeedbackMessage by remember { mutableStateOf<String?>(null) }
    var dbStats by remember { mutableStateOf<FlowDeskRepository.DatabaseStats?>(null) }

    // Load actual database telemetry from Room on mount and after operations
    LaunchedEffect(Unit) {
        dbStats = repository.getDatabaseStats()
    }

    // Android Storage Access Framework (SAF) document creators/pickers
    val createDocumentLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        if (uri != null) {
            isBackingUp = true
            coroutineScope.launch {
                val result = repository.exportBackupToUri(uri)
                isBackingUp = false
                result.onSuccess { count ->
                    statusFeedbackMessage = "SUCCESS: Backup created ($count tasks written to file)"
                    dbStats = repository.getDatabaseStats()
                }.onFailure { err ->
                    statusFeedbackMessage = "ERROR: Failed to create backup: ${err.localizedMessage}"
                }
            }
        }
    }

    val openDocumentLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            isRestoring = true
            coroutineScope.launch {
                val result = repository.restoreBackupFromUri(uri)
                isRestoring = false
                result.onSuccess { count ->
                    statusFeedbackMessage = "SUCCESS: Restored $count tasks from backup archive"
                    dbStats = repository.getDatabaseStats()
                }.onFailure { err ->
                    statusFeedbackMessage = "ERROR: Invalid backup archive: ${err.localizedMessage}"
                }
            }
        }
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

                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(9999.dp))
                        .background(CardSurface)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(9999.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(modifier = Modifier.size(6.dp).background(StatusEmerald, CircleShape))
                    Text(
                        text = "ROOM DB • AUTHENTIC LOCAL",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = AerospaceSlate
                    )
                }
            }
        }

        // Title Chassis
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(20.dp))
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "[SYS_LEDGER // SAF_STORAGE]",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = ElectricCobalt,
                        modifier = Modifier
                            .background(CyanSoft, RoundedCornerShape(4.dp))
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    )

                    Text(
                        text = "Backup & Local Ledger",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = AerospaceNavy
                    )

                    Text(
                        text = "Real Room database storage and Storage Access Framework export. Zero mock fallbacks.",
                        fontSize = 12.sp,
                        color = TechMuted,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Storage Telemetry Card
        item {
            val stats = dbStats
            val dbSizeKb = if (stats != null) stats.fileSizeBytes / 1024 else 0
            val walSizeKb = if (stats != null) stats.walSizeBytes / 1024 else 0

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
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(modifier = Modifier.size(7.dp).background(StatusEmerald, CircleShape))
                        Text(
                            text = "ROOM TELEMETRY",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = AerospaceNavy
                        )
                    }

                    Text(
                        text = "PERSISTENT",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = StatusEmerald,
                        modifier = Modifier
                            .background(MintSoft, RoundedCornerShape(4.dp))
                            .border(1.dp, StatusEmerald.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StorageInfoSlot("ROOM DATABASE", stats?.dbName ?: "flowdesk_local.db", "${dbSizeKb} KB on disk", Modifier.weight(1f))
                    StorageInfoSlot("WAL JOURNAL", "flowdesk_local.db-wal", "${walSizeKb} KB", Modifier.weight(1f))
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StorageInfoSlot("STORED TASKS", "${stats?.taskCount ?: 0} Nodes", "Authoritative", Modifier.weight(1f))
                    StorageInfoSlot("BRAIN DUMPS", "${stats?.brainDumpCount ?: 0} Sessions", "Local Vault", Modifier.weight(1f))
                }
            }
        }

        // Actions: Create Backup & Restore via SAF
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = {
                        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
                        createDocumentLauncher.launch("flowdesk_backup_$timestamp.json")
                    },
                    enabled = !isBackingUp && !isRestoring,
                    colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    if (isBackingUp) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Outlined.CloudUpload, contentDescription = null, modifier = Modifier.size(18.dp))
                            Text(
                                text = "EXPORT BACKUP (SAF JSON FILE)",
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Black,
                                fontSize = 11.sp,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }
                }

                OutlinedButton(
                    onClick = {
                        openDocumentLauncher.launch(arrayOf("application/json", "*/*"))
                    },
                    enabled = !isBackingUp && !isRestoring,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    if (isRestoring) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = ElectricCobalt, strokeWidth = 2.dp)
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Outlined.Restore, contentDescription = null, modifier = Modifier.size(18.dp))
                            Text(
                                text = "RESTORE BACKUP FROM FILE",
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp
                            )
                        }
                    }
                }

                statusFeedbackMessage?.let { msg ->
                    val isErr = msg.startsWith("ERROR")
                    Text(
                        text = msg,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isErr) P1Red else StatusEmerald,
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(if (isErr) P1Red.copy(alpha = 0.1f) else MintSoft, RoundedCornerShape(8.dp))
                            .border(1.dp, (if (isErr) P1Red else StatusEmerald).copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun StorageInfoSlot(
    label: String,
    primary: String,
    secondary: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(GlacierBg)
            .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
            .padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Text(label, fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TechMuted)
        Text(primary, fontFamily = FontFamily.Monospace, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AerospaceNavy, maxLines = 1)
        Text(secondary, fontFamily = FontFamily.Monospace, fontSize = 9.sp, color = ElectricCobalt)
    }
}
