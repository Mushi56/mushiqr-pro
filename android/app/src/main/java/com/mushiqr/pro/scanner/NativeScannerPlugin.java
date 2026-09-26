package com.mushiqr.pro.scanner;

import android.graphics.Color;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "NativeScanner",
    permissions = {
        @Permission(
            strings = { android.Manifest.permission.CAMERA },
            alias = "camera"
        )
    }
)
public class NativeScannerPlugin extends Plugin {

    private static final String TAG = "MushiCamera";

    private NativeScanner nativeScanner;
    private FrameLayout containerView;

    @Override
    public void load() {
        containerView = new FrameLayout(getContext());
        containerView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        // Ensure container is visible
        containerView.setVisibility(View.VISIBLE);
        containerView.setAlpha(1f);

        nativeScanner = new NativeScanner(getContext(), getActivity(), containerView);
        nativeScanner.setScanListener(new NativeScanner.ScanListener() {
            @Override
            public void onScanResult(org.json.JSONObject result) {
                try {
                    JSObject ret = JSObject.fromJSONObject(result);
                    notifyListeners("scanResult", ret);
                } catch (org.json.JSONException e) {
                    Log.e(TAG, "Failed to convert scan result to JSObject", e);
                }
            }

            @Override
            public void onError(String error) {
                JSObject ret = new JSObject();
                ret.put("error", error);
                notifyListeners("cameraError", ret);
            }

            @Override
            public void onZoomChanged(float ratio) {
                JSObject ret = new JSObject();
                ret.put("ratio", ratio);
                notifyListeners("zoomChanged", ret);
            }

            @Override
            public void onCameraReady(org.json.JSONObject info) {
                try {
                    JSObject ret = JSObject.fromJSONObject(info);
                    notifyListeners("cameraReady", ret);
                } catch (org.json.JSONException e) {
                    notifyListeners("cameraReady", new JSObject());
                }
            }
        });
    }

    @PluginMethod
    public void startScanner(PluginCall call) {
        if (getPermissionState("camera") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermsCallback");
        } else {
            startCamera(call);
        }
    }

    @PermissionCallback
    private void cameraPermsCallback(PluginCall call) {
        if (getPermissionState("camera") == com.getcapacitor.PermissionState.GRANTED) {
            startCamera(call);
        } else {
            call.reject("Camera permission denied. Please allow camera access in Settings.");
        }
    }

    private void startCamera(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Integer x = call.getInt("x");
            Integer y = call.getInt("y");
            Integer width = call.getInt("width");
            Integer height = call.getInt("height");

            float density = getActivity().getResources().getDisplayMetrics().density;

            // Convert CSS coordinates to physical pixels
            // Account for WebView position on screen
            int[] webViewLoc = new int[2];
            bridge.getWebView().getLocationOnScreen(webViewLoc);

            int pxX = 0;
            int pxY = 0;
            int pxW = ViewGroup.LayoutParams.MATCH_PARENT;
            int pxH = ViewGroup.LayoutParams.MATCH_PARENT;

            Log.d(TAG, "PLUGIN_START_CAMERA:");
            Log.d(TAG, "  CSS_BOUNDS: x=" + x + " y=" + y + " w=" + width + " h=" + height);
            Log.d(TAG, "  DENSITY: " + density);
            Log.d(TAG, "  PX_BOUNDS: x=" + pxX + " y=" + pxY + " w=" + pxW + " h=" + pxH);
            Log.d(TAG, "  WEBVIEW_SCREEN_LOC: x=" + webViewLoc[0] + " y=" + webViewLoc[1]);
            Log.d(TAG, "  WEBVIEW_SIZE: w=" + bridge.getWebView().getWidth() + " h=" + bridge.getWebView().getHeight());

            ViewGroup parent = (ViewGroup) bridge.getWebView().getParent();

            // Set layout params according to parent ViewGroup type
            ViewGroup.LayoutParams params;
            if (parent instanceof androidx.coordinatorlayout.widget.CoordinatorLayout) {
                androidx.coordinatorlayout.widget.CoordinatorLayout.LayoutParams cParams =
                        new androidx.coordinatorlayout.widget.CoordinatorLayout.LayoutParams(pxW, pxH);
                cParams.leftMargin = pxX;
                cParams.topMargin = pxY;
                params = cParams;
            } else if (parent instanceof FrameLayout) {
                FrameLayout.LayoutParams fParams = new FrameLayout.LayoutParams(pxW, pxH);
                fParams.leftMargin = pxX;
                fParams.topMargin = pxY;
                params = fParams;
            } else {
                ViewGroup.MarginLayoutParams mParams = new ViewGroup.MarginLayoutParams(pxW, pxH);
                mParams.leftMargin = pxX;
                mParams.topMargin = pxY;
                params = mParams;
            }
            containerView.setLayoutParams(params);

            // Make WebView transparent so native camera shows through
            bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);

            // Set parent background to matching indigo camera dark
            if (parent != null) {
                parent.setBackgroundColor(Color.parseColor("#111625"));
            }

            // Add container behind WebView
            if (containerView.getParent() != null) {
                ((ViewGroup) containerView.getParent()).removeView(containerView);
            }
            if (parent != null) {
                parent.addView(containerView, 0); // Index 0 = behind WebView
            }

            // Verify container is positioned correctly
            containerView.post(() -> {
                int[] containerLoc = new int[2];
                containerView.getLocationOnScreen(containerLoc);
                Log.d(TAG, "  CONTAINER_SCREEN_LOC: x=" + containerLoc[0] + " y=" + containerLoc[1]);
                Log.d(TAG, "  CONTAINER_SIZE: w=" + containerView.getWidth() + " h=" + containerView.getHeight());
                Log.d(TAG, "  CONTAINER_VISIBLE: " + (containerView.getVisibility() == View.VISIBLE));
                Log.d(TAG, "  CONTAINER_ALPHA: " + containerView.getAlpha());
            });

            nativeScanner.startScanner(
                    // onReady
                    () -> {
                        JSObject ret = new JSObject();
                        ret.put("started", true);
                        ret.put("flashSupported", nativeScanner.hasFlash());
                        call.resolve(ret);
                    },
                    // onError
                    (String errorMsg) -> {
                        Log.e(TAG, "PLUGIN: Camera startup failed: " + errorMsg);
                        // Remove container from parent on failure
                        getActivity().runOnUiThread(() -> {
                            bridge.getWebView().setBackgroundColor(Color.WHITE);
                            if (parent != null) {
                                parent.setBackgroundColor(Color.TRANSPARENT);
                            }
                            if (containerView.getParent() != null) {
                                ((ViewGroup) containerView.getParent()).removeView(containerView);
                            }
                        });
                        call.reject("Camera startup failed: " + errorMsg);
                    }
            );
        });
    }

    @PluginMethod
    public void stopScanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            nativeScanner.stopScanner();
            bridge.getWebView().setBackgroundColor(Color.WHITE);
            ViewGroup parent = (ViewGroup) bridge.getWebView().getParent();
            if (parent != null) {
                parent.setBackgroundColor(Color.TRANSPARENT);
            }
            if (containerView.getParent() != null) {
                ((ViewGroup) containerView.getParent()).removeView(containerView);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void setZoom(PluginCall call) {
        Float ratio = call.getFloat("ratio");
        if (ratio != null) {
            getActivity().runOnUiThread(() -> nativeScanner.setZoom(ratio));
        }
        call.resolve();
    }

    @PluginMethod
    public void getZoomCapabilities(PluginCall call) {
        try {
            org.json.JSONObject caps = nativeScanner.getZoomCapabilities();
            call.resolve(JSObject.fromJSONObject(caps));
        } catch (Exception e) {
            call.reject("Failed to get zoom capabilities", e);
        }
    }

    @PluginMethod
    public void setTorch(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled != null) {
            getActivity().runOnUiThread(() -> nativeScanner.setTorch(enabled));
        }
        call.resolve();
    }

    @PluginMethod
    public void focus(PluginCall call) {
        Float x = call.getFloat("x");
        Float y = call.getFloat("y");
        if (x != null && y != null) {
            getActivity().runOnUiThread(() -> nativeScanner.focus(x, y));
        }
        call.resolve();
    }

    @PluginMethod
    public void switchCamera(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            nativeScanner.switchCamera(
                    () -> call.resolve(),
                    (String errorMsg) -> call.reject("Switch camera failed: " + errorMsg)
            );
        });
    }
}
