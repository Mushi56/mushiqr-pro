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
            public void onError(String error) {
                JSObject ret = new JSObject();
                ret.put("error", error);
                notifyListeners("cameraError", ret);
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
            Integer x = call.getInt("x");
            Integer y = call.getInt("y");
            Integer width = call.getInt("width");
            Integer height = call.getInt("height");

            float density = getActivity().getResources().getDisplayMetrics().density;
            int pxX = x != null ? Math.round(x * density) : 0;
            int pxY = y != null ? Math.round(y * density) : 0;
            int pxW = width != null ? Math.round(width * density) : ViewGroup.LayoutParams.MATCH_PARENT;
            int pxH = height != null ? Math.round(height * density) : ViewGroup.LayoutParams.MATCH_PARENT;

            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(pxW, pxH);
            params.leftMargin = pxX;
            params.topMargin = pxY;
            containerView.setLayoutParams(params);

            bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);
            ViewGroup parent = (ViewGroup) bridge.getWebView().getParent();
            if (containerView.getParent() == null) {
                parent.addView(containerView, 0); // Add behind webview
            }
            
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
    public void stopScanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            nativeScanner.stopScanner();
            bridge.getWebView().setBackgroundColor(Color.WHITE);
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
            nativeScanner.focus(x, y);
        }
        call.resolve();
    }

    @PluginMethod
    public void switchCamera(PluginCall call) {
        nativeScanner.switchCamera();
        call.resolve();
    }
}
