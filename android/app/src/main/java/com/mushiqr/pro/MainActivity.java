package com.mushiqr.pro;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int CAMERA_REQUEST_CODE = 100;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request Android-level camera permission immediately on launch.
        // This ensures the system permission is granted BEFORE the WebView
        // ever tries to use getUserMedia(). Capacitor's BridgeWebChromeClient
        // already handles the WebView-level onPermissionRequest by launching
        // a permission dialog, but if the Android permission is already granted,
        // it auto-grants instantly without showing a dialog.
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{ Manifest.permission.CAMERA },
                    CAMERA_REQUEST_CODE);
        }

        // Configure WebView for camera streaming
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setMediaPlaybackRequiresUserGesture(false);
    }
}
