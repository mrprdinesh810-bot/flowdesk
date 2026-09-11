package com.flowdesk.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.flowdesk.app.ui.theme.FlowDeskColors
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlowDeskTopBar(
    title: String? = null,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    onBackClick: (() -> Unit)? = onBack,
    badgeCount: Int = 2,
    actions: @Composable (RowScope.() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var currentTimeString by remember { mutableStateOf("") }
    val currentDateString = remember {
        SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault()).format(Date())
    }

    LaunchedEffect(Unit) {
        val format = SimpleDateFormat("h:mm a", Locale.getDefault())
        while (true) {
            currentTimeString = format.format(Date())
            delay(1000)
        }
    }

    TopAppBar(
        title = {
            Column {
                if (title != null) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = FlowDeskColors.TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                } else {
                    Text(
                        text = currentDateString,
                        style = MaterialTheme.typography.bodySmall,
                        color = FlowDeskColors.TextSecondary,
                        fontWeight = FontWeight.Medium
                    )
                }
                if (subtitle != null) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = FlowDeskColors.TextMuted,
                        fontSize = 11.sp,
                        maxLines = 1
                    )
                }
            }
        },
        navigationIcon = {
            val backHandler = onBackClick ?: onBack
            if (backHandler != null) {
                IconButton(onClick = backHandler) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = FlowDeskColors.TextPrimary
                    )
                }
            }
        },
        actions = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(end = 12.dp)
            ) {
                if (actions != null) {
                    actions()
                }

                Text(
                    text = currentTimeString,
                    color = FlowDeskColors.TextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )

                Box(contentAlignment = Alignment.TopEnd) {
                    IconButton(onClick = { /* notification click */ }, modifier = Modifier.size(36.dp)) {
                        Icon(
                            imageVector = Icons.Outlined.Notifications,
                            contentDescription = "Notifications",
                            tint = FlowDeskColors.TextSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    if (badgeCount > 0) {
                        Box(
                            modifier = Modifier
                                .offset(x = (-2).dp, y = 2.dp)
                                .size(14.dp)
                                .background(FlowDeskColors.PrimaryIndigo, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = badgeCount.toString(),
                                color = FlowDeskColors.CardSurface,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = FlowDeskColors.CardSurface
        ),
        modifier = modifier
    )
}
