package com.mushiqr.pro.scanner;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.util.Log;
import android.view.ViewGroup;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraControl;
import androidx.camera.core.CameraInfo;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.FocusMeteringAction;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.MeteringPoint;
import androidx.camera.core.MeteringPointFactory;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.core.UseCaseGroup;
import androidx.camera.core.ViewPort;
import android.util.Rational;
import android.view.Surface;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.Observer;
import androidx.camera.core.resolutionselector.ResolutionSelector;
import androidx.camera.core.resolutionselector.AspectRatioStrategy;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.barcode.ZoomSuggestionOptions;
import com.google.mlkit.vision.common.InputImage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.io.PrintWriter;
import java.io.StringWriter;

public class NativeScanner {

    private static final String TAG = "MushiCamera";
    
    public enum State {
        IDLE, STARTING, READY, STOPPING, ERROR
    }
    
    private State currentState = State.IDLE;
    
    private final Context context;
    private final LifecycleOwner lifecycleOwner;
    private final FrameLayout containerView;

    private PreviewView previewView;
    private ProcessCameraProvider cameraProvider;
    private Camera camera;
    private BarcodeScanner barcodeScanner;
    private ExecutorService cameraExecutor;

    private int lensFacing = CameraSelector.LENS_FACING_BACK;
    
    public interface ScanListener {
        void onScanResult(JSONObject result);
        void onError(String error, JSONObject details);
        void onZoomChanged(float ratio);
    }
    
    private ScanListener scanListener;
    private Runnable onReadyCallback;
    private Runnable onErrorCallback;
    
    private Handler mainHandler;
    private Runnable firstFrameTimeout;

    public NativeScanner(Context context, LifecycleOwner lifecycleOwner, FrameLayout containerView) {
        this.context = context;
        this.lifecycleOwner = lifecycleOwner;
        this.containerView = containerView;
        this.mainHandler = new Handler(Looper.getMainLooper());
    }
    
    public void setScanListener(ScanListener listener) {
        this.scanListener = listener;
    }

    private void logDetailedError(String message, Exception e, String errorType) {
        Log.e(TAG, "CAMERA_START_FAILURE: " + errorType + " - " + message, e);
        JSONObject details = new JSONObject();
        try {
            details.put("errorType", errorType);
            details.put("message", message);
            if (e != null) {
                details.put("exceptionClass", e.getClass().getName());
                details.put("exceptionMessage", e.getMessage());
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                details.put("stackTrace", sw.toString());
            }
            details.put("state", currentState.name());
            details.put("lensFacing", lensFacing);
            if (previewView != null) {
                details.put("previewWidth", previewView.getWidth());
                details.put("previewHeight", previewView.getHeight());
            }
            details.put("containerWidth", containerView.getWidth());
            details.put("containerHeight", containerView.getHeight());
        } catch (JSONException ex) {
            ex.printStackTrace();
        }
        
        if (scanListener != null) {
            scanListener.onError(message, details);
        }
        if (onErrorCallback != null) {
            onErrorCallback.run();
            onErrorCallback = null;
        }
        onReadyCallback = null;
        stopScanner();
        currentState = State.ERROR;
    }

    public void startScanner(Runnable onReady, Runnable onError) {
        if (currentState == State.STARTING || currentState == State.READY) {
            if (currentState == State.READY && onReady != null) {
                onReady.run();
            }
            return;
        }

        currentState = State.STARTING;
        this.onReadyCallback = onReady;
        this.onErrorCallback = onError;

        Log.d(TAG, "CAMERA_START_BEGIN");

        if (lifecycleOwner.getLifecycle().getCurrentState() == Lifecycle.State.DESTROYED) {
            logDetailedError("Lifecycle is destroyed", null, "LIFECYCLE_DESTROYED");
            return;
        }

        if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.CAMERA) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            logDetailedError("Camera permission denied", null, "PERMISSION_DENIED");
            return;
        }

        cameraExecutor = Executors.newSingleThreadExecutor();

        previewView = new PreviewView(context);
        previewView.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
        previewView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        previewView.setScaleType(PreviewView.ScaleType.FILL_CENTER);
        
        containerView.removeAllViews();
        containerView.addView(previewView);
        Log.d(TAG, "PREVIEW_ATTACHED");

        firstFrameTimeout = () -> {
            if (currentState == State.STARTING) {
                logDetailedError("First frame timeout", null, "FIRST_FRAME_TIMEOUT");
            }
        };
        mainHandler.postDelayed(firstFrameTimeout, 5000);

        waitForPreviewViewDimensions();
    }

    private void waitForPreviewViewDimensions() {
        // Check immediately in case layout already happened
        if (containerView.getWidth() > 0 && containerView.getHeight() > 0
                && previewView.getWidth() > 0 && previewView.getHeight() > 0) {
            logDimensions("IMMEDIATE");
            onPreviewViewMeasured();
            return;
        }

        // Use a real layout listener — the single post() was not reliable
        ViewTreeObserver.OnGlobalLayoutListener layoutListener = new ViewTreeObserver.OnGlobalLayoutListener() {
            @Override
            public void onGlobalLayout() {
                if (currentState != State.STARTING || previewView == null) {
                    previewView.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                    return;
                }
                if (containerView.getWidth() > 0 && containerView.getHeight() > 0
                        && previewView.getWidth() > 0 && previewView.getHeight() > 0) {
                    previewView.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                    logDimensions("LAYOUT_LISTENER");
                    onPreviewViewMeasured();
                }
            }
        };
        previewView.getViewTreeObserver().addOnGlobalLayoutListener(layoutListener);

        // Safety timeout — if dimensions never arrive, fail cleanly
        mainHandler.postDelayed(() -> {
            if (currentState == State.STARTING && previewView != null
                    && (previewView.getWidth() == 0 || previewView.getHeight() == 0)) {
                previewView.getViewTreeObserver().removeOnGlobalLayoutListener(layoutListener);
                logDetailedError("PreviewView has zero dimensions after layout timeout", null, "PREVIEW_ZERO_DIMENSIONS");
            }
        }, 3000);
    }

    private void logDimensions(String source) {
        int[] containerLoc = new int[2];
        containerView.getLocationOnScreen(containerLoc);
        int[] previewLoc = new int[2];
        previewView.getLocationOnScreen(previewLoc);
        Log.d(TAG, "DIMENSIONS_SOURCE: " + source);
        Log.d(TAG, "CONTAINER_SIZE: " + containerView.getWidth() + "x" + containerView.getHeight());
        Log.d(TAG, "CONTAINER_SCREEN_POS: " + containerLoc[0] + ", " + containerLoc[1]);
        Log.d(TAG, "PREVIEW_SIZE: " + previewView.getWidth() + "x" + previewView.getHeight());
        Log.d(TAG, "PREVIEW_SCREEN_POS: " + previewLoc[0] + ", " + previewLoc[1]);
    }

    private void onPreviewViewMeasured() {
        Log.d(TAG, "PREVIEW_MEASURED: " + previewView.getWidth() + "x" + previewView.getHeight());
        
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(context);
        cameraProviderFuture.addListener(() -> {
            if (currentState != State.STARTING) return;
            try {
                cameraProvider = cameraProviderFuture.get();
                Log.d(TAG, "CAMERA_PROVIDER_READY");
                bindCameraUseCases();
            } catch (Exception e) {
                logDetailedError("Failed to get camera provider", e, "PROVIDER_FAILURE");
            }
        }, ContextCompat.getMainExecutor(context));
    }

    private void bindCameraUseCases() {
        if (cameraProvider == null) return;
        cameraProvider.unbindAll();

        Log.d(TAG, "CAMERA_BIND_BEGIN");

        CameraSelector cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(lensFacing)
                .build();

        ResolutionSelector resolutionSelector = new ResolutionSelector.Builder()
                .setAspectRatioStrategy(AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY)
                .build();

        Preview preview = new Preview.Builder()
                .setResolutionSelector(resolutionSelector)
                .build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                .setResolutionSelector(resolutionSelector)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        imageAnalysis.setAnalyzer(cameraExecutor, this::analyzeImage);

        try {
            camera = cameraProvider.bindToLifecycle(lifecycleOwner, cameraSelector, preview, imageAnalysis);
            Log.d(TAG, "CAMERA_BIND_SUCCESS");
            
            if (camera == null) {
                logDetailedError("Camera is null after bind", null, "BIND_NULL");
                return;
            }

            camera.getCameraInfo().getZoomState().observe(lifecycleOwner, zoomState -> {
                if (scanListener != null && zoomState != null) {
                    scanListener.onZoomChanged(zoomState.getZoomRatio());
                }
            });

            waitForStream(preview);

        } catch(Exception e) {
            logDetailedError("Use case binding failed", e, "CAMERA_BIND_FAILURE");
        }
    }
    
    private void waitForStream(Preview preview) {
        Observer<PreviewView.StreamState> streamStateObserver = new Observer<PreviewView.StreamState>() {
            @Override
            public void onChanged(PreviewView.StreamState streamState) {
                if (streamState == PreviewView.StreamState.STREAMING) {
                    Log.d(TAG, "PREVIEW_STREAMING");
                    previewView.getPreviewStreamState().removeObserver(this);
                    
                    if (currentState == State.STARTING) {
                        mainHandler.removeCallbacks(firstFrameTimeout);
                        currentState = State.READY;
                        Log.d(TAG, "CAMERA_START_COMPLETE");
                        
                        initMlKit();
                        
                        if (onReadyCallback != null) {
                            onReadyCallback.run();
                            onReadyCallback = null;
                        }
                    }
                }
            }
        };
        previewView.getPreviewStreamState().observe(lifecycleOwner, streamStateObserver);
    }
    
    private void initMlKit() {
        try {
            BarcodeScannerOptions options = new BarcodeScannerOptions.Builder()
                    .setBarcodeFormats(
                            Barcode.FORMAT_QR_CODE,
                            Barcode.FORMAT_AZTEC,
                            Barcode.FORMAT_DATA_MATRIX,
                            Barcode.FORMAT_PDF417,
                            Barcode.FORMAT_CODE_128,
                            Barcode.FORMAT_CODE_39,
                            Barcode.FORMAT_CODE_93,
                            Barcode.FORMAT_CODABAR,
                            Barcode.FORMAT_EAN_13,
                            Barcode.FORMAT_EAN_8,
                            Barcode.FORMAT_ITF,
                            Barcode.FORMAT_UPC_A,
                            Barcode.FORMAT_UPC_E)
                    .setZoomSuggestionOptions(
                        new ZoomSuggestionOptions.Builder(zoomRatio -> {
                            if (camera != null && camera.getCameraControl() != null) {
                                camera.getCameraControl().setZoomRatio(zoomRatio);
                                return true;
                            }
                            return false;
                        }).build()
                    )
                    .build();
            barcodeScanner = BarcodeScanning.getClient(options);
        } catch (Exception e) {
            Log.e(TAG, "Failed to init ML Kit", e);
        }
    }

    @SuppressLint("UnsafeOptInUsageError")
    private void analyzeImage(@NonNull ImageProxy imageProxy) {
        if (currentState != State.READY || barcodeScanner == null) {
            imageProxy.close();
            return;
        }

        if (imageProxy.getImage() == null) {
            imageProxy.close();
            return;
        }

        InputImage image = InputImage.fromMediaImage(imageProxy.getImage(), imageProxy.getImageInfo().getRotationDegrees());
        barcodeScanner.process(image)
                .addOnSuccessListener(barcodes -> {
                    for (Barcode barcode : barcodes) {
                        if (scanListener != null) {
                            try {
                                JSONObject result = new JSONObject();
                                result.put("text", barcode.getRawValue());
                                result.put("format", barcode.getFormat());
                                scanListener.onScanResult(result);
                            } catch (JSONException e) {
                                e.printStackTrace();
                            }
                        }
                    }
                })
                .addOnFailureListener(e -> Log.e(TAG, "Barcode analysis failed", e))
                .addOnCompleteListener(task -> imageProxy.close());
    }

    public void stopScanner() {
        if (currentState == State.IDLE || currentState == State.STOPPING) return;
        
        currentState = State.STOPPING;
        Log.d(TAG, "STOPPING_SCANNER");
        
        mainHandler.removeCallbacks(firstFrameTimeout);

        if (cameraProvider != null) {
            cameraProvider.unbindAll();
            cameraProvider = null;
        }
        if (barcodeScanner != null) {
            barcodeScanner.close();
            barcodeScanner = null;
        }
        if (cameraExecutor != null) {
            cameraExecutor.shutdown();
            cameraExecutor = null;
        }
        if (previewView != null && containerView != null) {
            containerView.removeView(previewView);
            previewView = null;
        }
        
        camera = null;
        onReadyCallback = null;
        onErrorCallback = null;
        
        currentState = State.IDLE;
        Log.d(TAG, "Scanner stopped and resources released.");
    }

    public void setZoom(float ratio) {
        if (camera != null) {
            camera.getCameraControl().setZoomRatio(ratio);
        }
    }

    public JSONObject getZoomCapabilities() {
        JSONObject result = new JSONObject();
        try {
            if (camera != null) {
                CameraInfo info = camera.getCameraInfo();
                float minZoom = info.getZoomState().getValue().getMinZoomRatio();
                float maxZoom = info.getZoomState().getValue().getMaxZoomRatio();
                float currentZoom = info.getZoomState().getValue().getZoomRatio();
                result.put("min", minZoom);
                result.put("max", maxZoom);
                result.put("current", currentZoom);
                Log.d(TAG, "Zoom capabilities - Min: " + minZoom + ", Max: " + maxZoom + ", Current: " + currentZoom);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting zoom capabilities", e);
        }
        return result;
    }

    public void setTorch(boolean enabled) {
        if (camera != null && camera.getCameraInfo().hasFlashUnit()) {
            camera.getCameraControl().enableTorch(enabled);
        }
    }

    public void focus(float x, float y) {
        try {
            if (camera != null && previewView != null && previewView.getWidth() > 0 && previewView.getHeight() > 0) {
                float clampedX = Math.max(0.05f, Math.min(0.95f, x));
                float clampedY = Math.max(0.05f, Math.min(0.95f, y));
                float pxX = clampedX * previewView.getWidth();
                float pxY = clampedY * previewView.getHeight();
                MeteringPointFactory factory = previewView.getMeteringPointFactory();
                MeteringPoint point = factory.createPoint(pxX, pxY);
                FocusMeteringAction action = new FocusMeteringAction.Builder(point, FocusMeteringAction.FLAG_AF | FocusMeteringAction.FLAG_AE)
                        .setAutoCancelDuration(3, java.util.concurrent.TimeUnit.SECONDS)
                        .build();
                if (camera.getCameraInfo().isFocusMeteringSupported(action)) {
                    camera.getCameraControl().startFocusAndMetering(action);
                    Log.d(TAG, "Triggered tap to focus at normalized " + clampedX + ", " + clampedY + " -> pixels " + pxX + ", " + pxY);
                } else {
                    Log.w(TAG, "Focus and metering action is not supported by current camera");
                }
            }
        } catch (Throwable t) {
            Log.e(TAG, "Error performing tap-to-focus", t);
        }
    }

    public void switchCamera() {
        if (lensFacing == CameraSelector.LENS_FACING_BACK) {
            lensFacing = CameraSelector.LENS_FACING_FRONT;
        } else {
            lensFacing = CameraSelector.LENS_FACING_BACK;
        }
        if (currentState == State.READY) {
            stopScanner();
            startScanner(null, null); // Callbacks handled by state or caller if needed
        }
    }
}
