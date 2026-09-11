package com.flowdesk.app;

import android.os.Bundle;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class LegacyWebActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FlowDeskPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(() -> {
                bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('flowdesk:backbutton'));",
                    null
                );
            });
        } else {
            super.onBackPressed();
        }
    }
}
