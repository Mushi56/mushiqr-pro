package com.mushiqr.pro;

import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();

        // Grant WebView camera/microphone permission requests automatically.
        // This is CRITICAL for html5-qrcode to access the camera inside the WebView.
        WebView webView = getBridge().getWebView();
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // Auto-grant camera and microphone permissions to the WebView
                request.grant(request.getResources());
            }
        });
    }
}
