package com.flowdesk.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.flowdesk.app.data.model.UpdateCheckResponse
import com.flowdesk.app.data.repository.FlowDeskRepository
import com.flowdesk.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun AppUpdateDialog(
    updateInfo: UpdateCheckResponse,
    repository: FlowDeskRepository,
    onDismiss: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var isDownloading by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableFloatStateOf(0f) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var needsPermission by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = {
            if (!isDownloading && !updateInfo.mandatory) {
                onDismiss()
            }
        },
        properties = DialogProperties(
            dismissOnBackPress = !isDownloading && !updateInfo.mandatory,
            dismissOnClickOutside = !isDownloading && !updateInfo.mandatory
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(CardSurface)
                .border(1.dp, GlacierBorder, RoundedCornerShape(24.dp))
                .padding(20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header Banner
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(CyanSoft)
                                .border(1.dp, ArcticCyan, RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.SystemUpdate,
                                contentDescription = "Update",
                                tint = ElectricCobalt,
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        Column {
                            Text(
                                text = "UPDATE AVAILABLE",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = ElectricCobalt,
                                letterSpacing = 0.5.sp
                            )
                            Text(
                                text = "FlowDesk Mobile",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = AerospaceNavy
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(StatusEmerald)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "v${updateInfo.latestVersion}",
                            color = Color.White,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                    }
                }

                // Version comparison bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(GlacierBg)
                        .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("INSTALLED", fontFamily = FontFamily.Monospace, fontSize = 9.sp, color = TechMuted)
                        Text("v${updateInfo.clientVersion}", fontFamily = FontFamily.Monospace, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = AerospaceSlate)
                    }

                    Icon(Icons.Outlined.ArrowForward, contentDescription = null, tint = TechMuted, modifier = Modifier.size(16.dp))

                    Column(horizontalAlignment = Alignment.End) {
                        Text("TARGET BUILD", fontFamily = FontFamily.Monospace, fontSize = 9.sp, color = StatusEmerald)
                        Text("v${updateInfo.latestVersion}", fontFamily = FontFamily.Monospace, fontSize = 12.sp, fontWeight = FontWeight.Black, color = StatusEmerald)
                    }
                }

                // Release notes section
                if (updateInfo.releaseNotes.isNotEmpty()) {
                    Text(
                        text = "WHAT'S NEW IN THIS VERSION:",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechMuted
                    )

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(InsetWell)
                            .border(1.dp, GlacierBorder, RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        updateInfo.releaseNotes.forEach { note ->
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.CheckCircle,
                                    contentDescription = null,
                                    tint = StatusEmerald,
                                    modifier = Modifier.size(14.dp).padding(top = 2.dp)
                                )
                                Text(
                                    text = note,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = AerospaceSlate
                                )
                            }
                        }
                    }
                }

                // File size indication
                if (updateInfo.apkSize > 0) {
                    val sizeMb = String.format("%.1f", updateInfo.apkSize / (1024.0 * 1024.0))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Outlined.Storage, contentDescription = null, tint = TechMuted, modifier = Modifier.size(14.dp))
                        Text(
                            text = "Package size: ~$sizeMb MB (Direct Native APK)",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            color = TechMuted
                        )
                    }
                }

                // Download Progress or Status
                if (isDownloading) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(CyanSoft)
                            .border(1.dp, ArcticCyan, RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "DOWNLOADING UPDATE...",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricCobalt
                            )
                            Text(
                                text = "${(downloadProgress * 100).toInt()}%",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                color = ElectricCobalt
                            )
                        }

                        LinearProgressIndicator(
                            progress = { downloadProgress },
                            modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
                            color = ElectricCobalt,
                            trackColor = Color.White
                        )
                    }
                }

                // Permission Warning (Android 8+)
                if (needsPermission) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(P2Soft)
                            .border(1.dp, P2Border, RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "PERMISSION REQUIRED",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = P2High
                        )
                        Text(
                            text = "Please enable 'Allow from this source' so FlowDesk can trigger the update installer.",
                            fontSize = 11.sp,
                            color = AerospaceSlate
                        )
                        Button(
                            onClick = {
                                repository.updateManager.openInstallPermissionSettings()
                                needsPermission = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = P2High),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth().height(36.dp)
                        ) {
                            Text("OPEN PERMISSION SETTINGS", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Error Message
                errorMessage?.let { err ->
                    Text(
                        text = "Error: $err",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        color = StateError,
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(P1Soft, RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    )
                }

                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (!updateInfo.mandatory) {
                        OutlinedButton(
                            onClick = onDismiss,
                            enabled = !isDownloading,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f).height(46.dp)
                        ) {
                            Text("LATER", fontFamily = FontFamily.Monospace, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Button(
                        onClick = {
                            if (!repository.updateManager.canRequestPackageInstalls()) {
                                needsPermission = true
                                return@Button
                            }

                            isDownloading = true
                            errorMessage = null
                            downloadProgress = 0f

                            coroutineScope.launch {
                                val result = repository.installAppUpdate(updateInfo.downloadUrl) { progress ->
                                    downloadProgress = progress
                                }
                                isDownloading = false
                                if (result.isFailure) {
                                    errorMessage = result.exceptionOrNull()?.message ?: "Failed to download update"
                                } else {
                                    onDismiss()
                                }
                            }
                        },
                        enabled = !isDownloading,
                        colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f).height(46.dp)
                    ) {
                        if (isDownloading) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text(
                                text = "UPDATE NOW",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
