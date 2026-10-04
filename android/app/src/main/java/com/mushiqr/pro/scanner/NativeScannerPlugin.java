package com.mushiqr.pro.scanner;

import android.graphics.Color;
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

    private NativeScanner nativeScanner;
    private FrameLayout containerView;

    @Override
    public void load() {
        containerView = new FrameLayout(getContext());
        containerView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        
        nativeScanner = new NativeScanner(getContext(), getActivity(), containerView);
        nativeScanner.setScanListener(new NativeScanner.ScanListener() {
            @Override
            public void onScanResult(org.json.JSONObject result) {
                try {
                    JSObject ret = JSObject.fromJSONObject(result);
                    notifyListeners("scanResult", ret);
                } catch (org.json.JSONException e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(String error, org.json.JSONObject details) {
                JSObject ret = new JSObject();
                ret.put("error", error);
                if (details != null) {
                    try {
                        ret.put("details", JSObject.fromJSONObject(details));
                    } catch (org.json.JSONException e) {
                        e.printStackTrace();
                    }
                }
                notifyListeners("cameraError", ret);
            }

            @Override
            public void onZoomChanged(float ratio) {
                JSObject ret = new JSObject();
                ret.put("ratio", ratio);
                notifyListeners("zoomChanged", ret);
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
            call.reject("Permission is required to take a picture");
        }
    }

    private void startCamera(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            ViewGroup parent = (ViewGroup) bridge.getWebView().getParent();

            // Sizing containerView to MATCH_PARENT x MATCH_PARENT so the camera preview
            // fills the entire view behind the WebView without margin/offset clipping.
            ViewGroup.LayoutParams params = new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            );
            containerView.setLayoutParams(params);

            // Ensure window, parent layout, and webview are completely transparent
            getActivity().getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));
            if (parent != null) {
                parent.setBackgroundColor(Color.TRANSPARENT);
            }
            android.view.View content = getActivity().findViewById(android.R.id.content);
            if (content != null) {
                content.setBackgroundColor(Color.TRANSPARENT);
            }
            bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);
            bridge.getWebView().setLayerType(android.view.View.LAYER_TYPE_NONE, null);
            containerView.setBackgroundColor(Color.TRANSPARENT);

            if (containerView.getParent() != null) {
                ((ViewGroup) containerView.getParent()).removeView(containerView);
            }
            parent.addView(containerView, 0); // Add behind webview
            
            nativeScanner.startScanner(
                    () -> {
                        notifyListeners("cameraReady", new JSObject());
                        call.resolve();
                    },
                    () -> call.reject("Failed to start camera")
            );
        });
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (nativeScanner != null) nativeScanner.pause();
        call.resolve();
    }

    @PluginMethod
    public void resume(PluginCall call) {
        if (nativeScanner != null) nativeScanner.resume();
        call.resolve();
    }

    @PluginMethod
    public void stopScanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            nativeScanner.stopScanner();
            bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);
            ViewGroup parent = (ViewGroup) bridge.getWebView().getParent();
            if (containerView.getParent() != null) {
                parent.removeView(containerView);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void setZoom(PluginCall call) {
        Float ratio = call.getFloat("ratio");
        if (ratio != null) {
            nativeScanner.setZoom(ratio);
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
            nativeScanner.setTorch(enabled);
        }
        call.resolve();
    }

    @PluginMethod
    public void focus(PluginCall call) {
        Float x = call.getFloat("x");
        Float y = call.getFloat("y");
        if (x != null && y != null) {
            getActivity().runOnUiThread(() -> {
                try {
                    nativeScanner.focus(x, y);
                } catch (Throwable t) {
                    android.util.Log.e("MushiCamera", "Failed to focus", t);
                }
            });
        }
        call.resolve();
    }

    @PluginMethod
    public void switchCamera(PluginCall call) {
        nativeScanner.switchCamera();
        call.resolve();
    }

    @PluginMethod
    public void capture(PluginCall call) {
        if (nativeScanner == null) {
            JSObject ret = new JSObject();
            ret.put("found", false);
            ret.put("error", "No QR code or barcode found in the captured image.");
            call.resolve(ret);
            return;
        }

        nativeScanner.capture((found, text, format, error) -> {
            JSObject ret = new JSObject();
            ret.put("found", found);
            if (found) {
                ret.put("text", text);
                ret.put("format", format);
            } else {
                ret.put("error", error != null ? error : "No QR code or barcode found in the captured image.");
            }
            call.resolve(ret);
        });
    }
}
