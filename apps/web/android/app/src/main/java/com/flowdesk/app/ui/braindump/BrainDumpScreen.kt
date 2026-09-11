package com.flowdesk.app.ui.braindump

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
fun BrainDumpScreen(
    repository: FlowDeskRepository,
    onNavigateToPipeline: () -> Unit,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var rawText by remember { mutableStateOf("") }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val settings by repository.settings.collectAsState()

    fun executeParse() {
        if (rawText.isBlank()) return
        isProcessing = true
        errorMessage = null
        coroutineScope.launch {
            val result = repository.parseBrainDump(rawText)
            isProcessing = false
            if (result.isSuccess) {
                onNavigateToPipeline()
            } else {
                errorMessage = result.exceptionOrNull()?.message ?: "AI parsing failed. Please verify provider configuration in Settings."
            }
        }
    }

    val providerBadgeText = when (settings.selectedProvider) {
        "openrouter" -> if (repository.isOpenRouterConfigured()) "OPENROUTER • DIRECT CLOUD" else "OPENROUTER • KEY REQUIRED"
        "flowdesk_server" -> "FLOWDESK SERVER • REMOTE"
        "on_device" -> "ON-DEVICE • PREPARED"
        else -> "AI ENGINE STANDBY"
    }
    val providerDotColor = when {
        settings.selectedProvider == "openrouter" && repository.isOpenRouterConfigured() -> StatusEmerald
        settings.selectedProvider == "openrouter" && !repository.isOpenRouterConfigured() -> StateWarning
        settings.selectedProvider == "flowdesk_server" -> ElectricCobalt
        else -> ArcticCyan
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
                    Box(modifier = Modifier.size(6.dp).background(providerDotColor, CircleShape))
                    Text(
                        text = providerBadgeText,
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
                        text = "[SYS // BRAIN_DUMP]",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = ElectricCobalt,
                        modifier = Modifier
                            .background(CyanSoft, RoundedCornerShape(4.dp))
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    )

                    Text(
                        text = "What's on your mind?",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = AerospaceNavy
                    )

                    Text(
                        text = "Stream unorganized thoughts, obligations, or ideas. The local LLM will extract priorities, durations, and dependencies.",
                        fontSize = 12.sp,
                        color = TechMuted,
                        lineHeight = 17.sp
                    )
                }
            }
        }

        // Quick Input Prompts
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickPromptChip("Lab Study 2h", Modifier.weight(1f)) {
                    rawText += if (rawText.isBlank()) "Study EDC for 2 hours in the lab" else ", Study EDC for 2 hours in the lab"
                }
                QuickPromptChip("Firmware Flash", Modifier.weight(1f)) {
                    rawText += if (rawText.isBlank()) "Deploy firmware flash v2.1 to prototype" else ", Deploy firmware flash v2.1 to prototype"
                }
                QuickPromptChip("QA Call", Modifier.weight(1f)) {
                    rawText += if (rawText.isBlank()) "Sync telemetry logs with QA team at 4pm" else ", Sync telemetry logs with QA team at 4pm"
                }
            }
        }

        // Main Textarea Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(CardSurface)
                    .border(1.dp, GlacierBorder, RoundedCornerShape(18.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    TextField(
                        value = rawText,
                        onValueChange = { if (it.length <= 2000) rawText = it },
                        placeholder = {
                            Text(
                                "e.g. College until 4, study EDC for 2 hours, finish the TRAKAE parser, review sensor logs, gym at 6:30...",
                                color = TechMuted,
                                fontSize = 13.sp,
                                lineHeight = 19.sp
                            )
                        },
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 160.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(GlacierBg)
                                .clickable {
                                    rawText = "College until 4, study EDC for 2 hours, finish the TRAKAE parser, gym at 6:30, check GitHub issue, revise Python if possible."
                                }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("💡 PASTE SAMPLE", fontFamily = FontFamily.Monospace, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = ElectricCobalt)
                        }

                        Text(
                            text = "${rawText.length} / 2000",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = TechMuted
                        )
                    }
                }
            }
        }

        // Action Buttons
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = { executeParse() },
                    enabled = rawText.isNotBlank() && !isProcessing,
                    colors = ButtonDefaults.buttonColors(containerColor = ElectricCobalt),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    if (isProcessing) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Outlined.AutoAwesome, contentDescription = null, modifier = Modifier.size(18.dp))
                            Text(
                                "PARSE & EXTRACT WITH AI",
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Black,
                                fontSize = 12.sp,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }
                }

                // Error Message Card if parsing failed
                errorMessage?.let { msg ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(P1Bg)
                            .border(1.dp, P1Border, RoundedCornerShape(12.dp))
                            .padding(12.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Box(modifier = Modifier.size(6.dp).background(P1Red, CircleShape))
                                Text("AI PARSING FAILED", fontFamily = FontFamily.Monospace, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = P1Red)
                            }
                            Text(text = msg, fontSize = 12.sp, color = AerospaceNavy)
                        }
                    }
                }

                // Privacy Indication Notice
                val privacyNotice = when (settings.selectedProvider) {
                    "openrouter" -> "Privacy: Stream will be sent directly to OpenRouter via HTTPS."
                    "flowdesk_server" -> "Privacy: Stream will be processed on your local FlowDesk server."
                    else -> "Privacy: On-device inference runtime."
                }
                Text(
                    text = privacyNotice,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp,
                    color = TechMuted,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
        }
    }
}

@Composable
private fun QuickPromptChip(
    label: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(CardSurface)
            .border(1.dp, GlacierBorder, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 7.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "+ $label",
            fontFamily = FontFamily.Monospace,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = AerospaceNavy,
            maxLines = 1
        )
    }
}
