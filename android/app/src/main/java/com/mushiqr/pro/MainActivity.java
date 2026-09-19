package com.mushiqr.pro;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.PermissionRequest;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 100;
    private String pendingAction = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enforce FLAG_SECURE window policy to block screenshots & screen recordings
        getWindow().setFlags(
            android.view.WindowManager.LayoutParams.FLAG_SECURE,
            android.view.WindowManager.LayoutParams.FLAG_SECURE
        );

        // Request all needed permissions at launch so they're granted
        // before the user tries to use camera or save files.
        requestAllPermissions();

        // Configure WebView for camera streaming
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Explicitly grant WebRTC camera stream requests
        webView.setWebChromeClient(new com.getcapacitor.BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }

            @Override
            public android.graphics.Bitmap getDefaultVideoPoster() {
                return android.graphics.Bitmap.createBitmap(1, 1, android.graphics.Bitmap.Config.ARGB_8888);
            }
        });

        // Initialize native Google Play Billing bridge
        final com.mushiqr.pro.billing.PlayBillingBridge billingBridge = new com.mushiqr.pro.billing.PlayBillingBridge(this);
        billingBridge.setEventListener(new com.mushiqr.pro.billing.PlayBillingBridge.BillingEventListener() {
            @Override
            public void onPurchaseSuccess(final String productId, final String purchaseToken, final String packageName) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            org.json.JSONObject payload = new org.json.JSONObject();
                            payload.put("productId", productId);
                            payload.put("purchaseToken", purchaseToken);
                            payload.put("packageName", packageName);
                            String js = "window.dispatchEvent(new CustomEvent('onPlayPurchaseSuccess', { detail: " + payload.toString() + " }));";
                            getBridge().getWebView().evaluateJavascript(js, null);
                        } catch (Exception e) {
                            android.util.Log.e("MainActivity", "Failed to dispatch onPlayPurchaseSuccess", e);
                        }
                    }
                });
            }

            @Override
            public void onPurchasePending(final String productId) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            org.json.JSONObject payload = new org.json.JSONObject();
                            payload.put("productId", productId);
                            String js = "window.dispatchEvent(new CustomEvent('onPlayPurchasePending', { detail: " + payload.toString() + " }));";
                            getBridge().getWebView().evaluateJavascript(js, null);
                        } catch (Exception e) {
                            android.util.Log.e("MainActivity", "Failed to dispatch onPlayPurchasePending", e);
                        }
                    }
                });
            }

            @Override
            public void onPurchaseCancelled(final String productId) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        String js = "window.dispatchEvent(new CustomEvent('onPlayPurchaseCancelled', { detail: {} }));";
                        getBridge().getWebView().evaluateJavascript(js, null);
                    }
                });
            }

            @Override
            public void onPurchaseFailed(final String productId, final int responseCode, final String debugMessage) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            org.json.JSONObject payload = new org.json.JSONObject();
                            payload.put("productId", productId != null ? productId : "");
                            payload.put("responseCode", responseCode);
                            payload.put("debugMessage", debugMessage != null ? debugMessage : "Purchase failed");
                            String js = "window.dispatchEvent(new CustomEvent('onPlayPurchaseFailed', { detail: " + payload.toString() + " }));";
                            getBridge().getWebView().evaluateJavascript(js, null);
                        } catch (Exception e) {
                            android.util.Log.e("MainActivity", "Failed to dispatch onPlayPurchaseFailed", e);
                        }
                    }
                });
            }
        });
        billingBridge.startConnection(null);

        // Add native Javascript Interface for cold-boot launcher actions, security, and Play Billing
        webView.addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public String getPendingAction() {
                String act = pendingAction;
                pendingAction = null; // consume
                return act;
            }

            @android.webkit.JavascriptInterface
            public void setScreenSecurity(final boolean enable) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (enable) {
                            getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE, android.view.WindowManager.LayoutParams.FLAG_SECURE);
                        } else {
                            getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
                        }
                    }
                });
            }

            @android.webkit.JavascriptInterface
            public void launchGooglePlayPurchase(final String productId, final String obfuscatedAccountId, final String oldPurchaseToken, final int replacementMode) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        billingBridge.launchPurchase(productId, obfuscatedAccountId, oldPurchaseToken, replacementMode);
                    }
                });
            }

            @android.webkit.JavascriptInterface
            public void queryGooglePlayPurchases() {
                billingBridge.queryActivePurchases(new com.mushiqr.pro.billing.PlayBillingBridge.PurchasesQueryCallback() {
                    @Override
                    public void onSuccess(final java.util.List<com.mushiqr.pro.billing.PlayBillingBridge.PurchaseRecordDto> purchases) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    org.json.JSONArray array = new org.json.JSONArray();
                                    for (com.mushiqr.pro.billing.PlayBillingBridge.PurchaseRecordDto p : purchases) {
                                        org.json.JSONObject obj = new org.json.JSONObject();
                                        obj.put("productId", p.productId);
                                        obj.put("purchaseToken", p.purchaseToken);
                                        obj.put("packageName", p.packageName);
                                        array.put(obj);
                                    }
                                    org.json.JSONObject payload = new org.json.JSONObject();
                                    payload.put("purchases", array);
                                    String js = "window.dispatchEvent(new CustomEvent('onPlayPurchasesRestored', { detail: " + payload.toString() + " }));";
                                    getBridge().getWebView().evaluateJavascript(js, null);
                                } catch (Exception e) {
                                    android.util.Log.e("MainActivity", "Failed to dispatch onPlayPurchasesRestored", e);
                                }
                            }
                        });
                    }

                    @Override
                    public void onError(final int responseCode, final String message) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    org.json.JSONObject payload = new org.json.JSONObject();
                                    payload.put("responseCode", responseCode);
                                    payload.put("message", message != null ? message : "Restore query failed");
                                    String js = "window.dispatchEvent(new CustomEvent('onPlayPurchasesRestoreFailed', { detail: " + payload.toString() + " }));";
                                    getBridge().getWebView().evaluateJavascript(js, null);
                                } catch (Exception e) {
                                    android.util.Log.e("MainActivity", "Failed to dispatch onPlayPurchasesRestoreFailed", e);
                                }
                            }
                        });
                    }
                });
            }
        }, "NativeAndroidApp");

        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && "scan".equals(intent.getStringExtra("action"))) {
            pendingAction = "scan";
            // Dispatch custom event for already running app (hot boot)
            Bridge bridge = getBridge();
            if (bridge != null) {
                final WebView webView = bridge.getWebView();
                if (webView != null) {
                    webView.post(new Runnable() {
                        @Override
                        public void run() {
                            webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('appAction', { detail: 'scan' }));", null);
                        }
                    });
                }
            }
        }
    }

    private void requestAllPermissions() {
        java.util.List<String> needed = new java.util.ArrayList<>();

        // Camera permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.CAMERA);
        }

        // Storage permissions depend on Android version
        if (Build.VERSION.SDK_INT >= 33) {
            // Android 13+: use granular media permissions
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.READ_MEDIA_IMAGES);
            }
        } else {
            // Android 10-12: use legacy storage permissions
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
            if (Build.VERSION.SDK_INT <= 32) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                        != PackageManager.PERMISSION_GRANTED) {
                    needed.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
                }
            }
        }

        if (!needed.isEmpty()) {
            ActivityCompat.requestPermissions(this,
                    needed.toArray(new String[0]),
                    PERMISSION_REQUEST_CODE);
        }
    }
}
