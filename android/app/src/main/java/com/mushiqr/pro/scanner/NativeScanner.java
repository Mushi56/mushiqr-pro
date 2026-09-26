package com.mushiqr.pro.scanner;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Rect;
import android.hardware.camera2.CameraCharacteristics;
import android.os.SystemClock;
import android.util.Log;
import android.util.Rational;
import android.util.Size;
import android.view.Surface;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.camera.camera2.interop.Camera2CameraInfo;
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
import androidx.camera.core.UseCaseGroup;
import androidx.camera.core.ViewPort;
import androidx.camera.core.resolutionselector.AspectRatioStrategy;
import androidx.camera.core.resolutionselector.ResolutionSelector;
import androidx.camera.core.resolutionselector.ResolutionStrategy;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LifecycleOwner;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.ZoomSuggestionOptions;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class NativeScanner {

    private static final String TAG = "MushiCamera";

    private final Context context;
    private final LifecycleOwner lifecycleOwner;
    private final FrameLayout containerView;

    private PreviewView previewView;
    private ProcessCameraProvider cameraProvider;
    private Camera camera;
    private BarcodeScanner barcodeScanner;
    private ExecutorService cameraExecutor;

    private boolean isScanning = false;
    private int lensFacing = CameraSelector.LENS_FACING_BACK;

    // Diagnostic timing
    private long t0StartScanner = 0;
    private long t1PreviewViewReady = 0;
    private long t2CameraBindingComplete = 0;
    private long t3FirstFrameTime = 0;
    private long t4MlKitReadyTime = 0;
    private long t5FirstScanTime = 0;

    // Diagnostic counts
    private static int startCount = 0;
    private static int stopCount = 0;

    // FPS measurement
    private long lastAnalysisFpsTimestamp = 0;
    private int analysisFrameCounter = 0;
    private float observedAnalysisFps = 0f;

    private long lastPreviewFpsTimestamp = 0;
    private int previewFrameCounter = 0;
    private float observedPreviewFps = 0f;

    // ML Kit analysis flag to avoid backlog
    private final AtomicBoolean isAnalyzing = new AtomicBoolean(false);

    public interface ScanListener {
        void onScanResult(JSONObject result);
        void onError(String error);
        void onZoomChanged(float ratio);
    }

    private ScanListener scanListener;

    public NativeScanner(Context context, LifecycleOwner lifecycleOwner, FrameLayout containerView) {
        this.context = context;
        this.lifecycleOwner = lifecycleOwner;
        this.containerView = containerView;
    }

    public void setScanListener(ScanListener listener) {
        this.scanListener = listener;
    }

    public void startScanner(Runnable onReady, Runnable onError) {
        startCount++;
        t0StartScanner = SystemClock.elapsedRealtime();
        Log.d(TAG, "==================== START SCANNER (count: " + startCount + ") ====================");

        if (isScanning && camera != null && previewView != null) {
            Log.d(TAG, "Scanner already active and running. Re-triggering onReady callback.");
            if (onReady != null) onReady.run();
            return;
        }

        // Clean up any stale state first (idempotent startup)
        cleanUpSession();

        cameraExecutor = Executors.newSingleThreadExecutor();

        // 1. Configure ML Kit Barcode Scanner
        long mlKitStart = SystemClock.elapsedRealtime();
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
                        new ZoomSuggestionOptions.Builder(zoomCallback).build()
                )
                .build();
        barcodeScanner = BarcodeScanning.getClient(options);
        t4MlKitReadyTime = SystemClock.elapsedRealtime();
        Log.d(TAG, "ML_KIT_READY_TIME: " + (t4MlKitReadyTime - mlKitStart) + "ms");

        // 2. Setup PreviewView with exact 3:4 geometry inside container
        previewView = new PreviewView(context);
        previewView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        previewView.setScaleType(PreviewView.ScaleType.FILL_CENTER);

        // Track first visible frame rendered
        previewView.getPreviewStreamState().observe(lifecycleOwner, state -> {
            Log.d(TAG, "Preview StreamState changed: " + state);
            if (state == PreviewView.StreamState.STREAMING && t3FirstFrameTime == 0) {
                t3FirstFrameTime = SystemClock.elapsedRealtime();
                Log.d(TAG, "FIRST_FRAME_TIME (from startScanner): " + (t3FirstFrameTime - t0StartScanner) + "ms");
            }
        });

        containerView.removeAllViews();
        containerView.addView(previewView);
        t1PreviewViewReady = SystemClock.elapsedRealtime();
        Log.d(TAG, "PREVIEW_VIEW_READY: " + (t1PreviewViewReady - t0StartScanner) + "ms");

        // Wait until PreviewView is laid out so dimensions are exact non-zero physical measurements
        previewView.post(() -> {
            ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(context);
            cameraProviderFuture.addListener(() -> {
                try {
                    cameraProvider = cameraProviderFuture.get();
                    bindCameraUseCases();

                    isScanning = true;
                    if (onReady != null) onReady.run();
                } catch (Exception e) {
                    Log.e(TAG, "CAMERA_ERRORS: Failed to start camera", e);
                    if (onError != null) onError.run();
                }
            }, ContextCompat.getMainExecutor(context));
        });
    }

    private void bindCameraUseCases() {
        if (cameraProvider == null || previewView == null) return;
        cameraProvider.unbindAll();

        long bindStartTime = SystemClock.elapsedRealtime();

        CameraSelector cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(lensFacing)
                .build();

        // High quality 4:3 native sensor resolution strategy with fallback
        ResolutionSelector resolutionSelector = new ResolutionSelector.Builder()
                .setAspectRatioStrategy(AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY)
                .setResolutionStrategy(new ResolutionStrategy(
                        new Size(1920, 1440),
                        ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER
                ))
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

        // Compute exact ViewPort matching the scanner viewfinder
        int viewWidth = previewView.getWidth();
        int viewHeight = previewView.getHeight();
        if (viewWidth <= 0 || viewHeight <= 0) {
            viewWidth = containerView.getWidth();
            viewHeight = containerView.getHeight();
        }

        Rational viewportRational;
        if (viewWidth > 0 && viewHeight > 0) {
            viewportRational = new Rational(viewWidth, viewHeight);
        } else {
            viewportRational = new Rational(3, 4);
        }

        int rotation = previewView.getDisplay() != null ? previewView.getDisplay().getRotation() : Surface.ROTATION_0;

        ViewPort viewPort = new ViewPort.Builder(viewportRational, rotation)
                .setScaleType(ViewPort.FILL_CENTER)
                .build();

        UseCaseGroup useCaseGroup = new UseCaseGroup.Builder()
                .addUseCase(preview)
                .addUseCase(imageAnalysis)
                .setViewPort(viewPort)
                .build();

        try {
            camera = cameraProvider.bindToLifecycle(lifecycleOwner, cameraSelector, useCaseGroup);
            t2CameraBindingComplete = SystemClock.elapsedRealtime();
            Log.d(TAG, "CAMERA_BIND_TIME: " + (t2CameraBindingComplete - bindStartTime) + "ms");

            // Diagnostic inspection and logging
            logDiagnostics(viewWidth, viewHeight, viewportRational, preview, imageAnalysis, rotation);

            // Zoom state observer
            camera.getCameraInfo().getZoomState().observe(lifecycleOwner, zoomState -> {
                if (scanListener != null && zoomState != null) {
                    scanListener.onZoomChanged(zoomState.getZoomRatio());
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "CAMERA_ERRORS: Use case binding failed", e);
        }
    }

    private void logDiagnostics(int viewWidth, int viewHeight, Rational rational, Preview preview, ImageAnalysis imageAnalysis, int rotation) {
        if (camera == null) return;
        CameraInfo info = camera.getCameraInfo();
        Camera2CameraInfo cam2Info = Camera2CameraInfo.from(info);

        String cameraId = cam2Info.getCameraId();
        Integer sensorOrientation = cam2Info.getCameraCharacteristic(CameraCharacteristics.SENSOR_ORIENTATION);
        Integer hardwareLevel = cam2Info.getCameraCharacteristic(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL);
        float[] focalLengths = cam2Info.getCameraCharacteristic(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS);

        String focalStr = "";
        if (focalLengths != null) {
            for (float f : focalLengths) focalStr += f + "mm ";
        }

        Size previewRes = preview.getResolutionInfo() != null ? preview.getResolutionInfo().getResolution() : null;
        Rect previewCrop = preview.getResolutionInfo() != null ? preview.getResolutionInfo().getCropRect() : null;

        Size analysisRes = imageAnalysis.getResolutionInfo() != null ? imageAnalysis.getResolutionInfo().getResolution() : null;
        Rect analysisCrop = imageAnalysis.getResolutionInfo() != null ? imageAnalysis.getResolutionInfo().getCropRect() : null;

        float minZoom = 1.0f;
        float maxZoom = 1.0f;
        float curZoom = 1.0f;
        if (info.getZoomState().getValue() != null) {
            minZoom = info.getZoomState().getValue().getMinZoomRatio();
            maxZoom = info.getZoomState().getValue().getMaxZoomRatio();
            curZoom = info.getZoomState().getValue().getZoomRatio();
        }

        boolean hasFlash = info.hasFlashUnit();

        Log.d(TAG, "==================== CAMERA DIAGNOSTICS ====================");
        Log.d(TAG, "CAMERA_ID: " + cameraId);
        Log.d(TAG, "LENS_FACING: " + (lensFacing == CameraSelector.LENS_FACING_BACK ? "BACK" : "FRONT"));
        Log.d(TAG, "SENSOR_ORIENTATION: " + sensorOrientation);
        Log.d(TAG, "HARDWARE_LEVEL: " + hardwareLevel);
        Log.d(TAG, "FOCAL_LENGTHS: " + focalStr.trim());
        Log.d(TAG, "PREVIEW_VIEW_WIDTH: " + viewWidth);
        Log.d(TAG, "PREVIEW_VIEW_HEIGHT: " + viewHeight);
        Log.d(TAG, "SCANNER_VIEW_WIDTH: " + containerView.getWidth());
        Log.d(TAG, "SCANNER_VIEW_HEIGHT: " + containerView.getHeight());
        Log.d(TAG, "VIEWPORT_ASPECT_RATIO: " + rational.getNumerator() + ":" + rational.getDenominator() + " (" + rational.floatValue() + ")");
        Log.d(TAG, "PREVIEW_ASPECT_RATIO: " + (viewHeight > 0 ? ((float) viewWidth / viewHeight) : 0));
        Log.d(TAG, "PREVIEW_RESOLUTION: " + (previewRes != null ? previewRes.getWidth() + "x" + previewRes.getHeight() : "unknown"));
        Log.d(TAG, "PREVIEW_CROP_RECT: " + (previewCrop != null ? previewCrop.toShortString() : "none"));
        Log.d(TAG, "ANALYSIS_RESOLUTION: " + (analysisRes != null ? analysisRes.getWidth() + "x" + analysisRes.getHeight() : "unknown"));
        Log.d(TAG, "ANALYSIS_CROP_RECT: " + (analysisCrop != null ? analysisCrop.toShortString() : "none"));
        Log.d(TAG, "MIN_ZOOM: " + minZoom);
        Log.d(TAG, "MAX_ZOOM: " + maxZoom);
        Log.d(TAG, "CURRENT_ZOOM: " + curZoom);
        Log.d(TAG, "AF_SUPPORTED: true");
        Log.d(TAG, "FLASH_SUPPORTED: " + hasFlash);
        Log.d(TAG, "ROTATION: " + rotation);
        Log.d(TAG, "============================================================");
    }

    private final ZoomSuggestionOptions.ZoomCallback zoomCallback = zoomRatio -> {
        if (camera != null && camera.getCameraControl() != null) {
            CameraInfo info = camera.getCameraInfo();
            if (info != null && info.getZoomState().getValue() != null) {
                float minZoom = info.getZoomState().getValue().getMinZoomRatio();
                float maxZoom = info.getZoomState().getValue().getMaxZoomRatio();
                float clampedZoom = Math.min(Math.max(zoomRatio, minZoom), maxZoom);
                camera.getCameraControl().setZoomRatio(clampedZoom);
                Log.d(TAG, "ML Kit auto-zoom suggested: " + zoomRatio + " -> clamped applied: " + clampedZoom);
                return true;
            }
        }
        return false;
    };

    @SuppressLint("UnsafeOptInUsageError")
    private void analyzeImage(@NonNull ImageProxy imageProxy) {
        // Measure Analysis FPS
        long now = SystemClock.elapsedRealtime();
        analysisFrameCounter++;
        if (now - lastAnalysisFpsTimestamp >= 1000) {
            observedAnalysisFps = (analysisFrameCounter * 1000.0f) / (now - lastAnalysisFpsTimestamp);
            analysisFrameCounter = 0;
            lastAnalysisFpsTimestamp = now;
            Log.d(TAG, "OBSERVED_ANALYSIS_FPS: " + String.format("%.1f", observedAnalysisFps));
        }

        if (imageProxy.getImage() == null || !isScanning) {
            imageProxy.close();
            return;
        }

        // Backpressure guarantee: skip if previous frame ML processing is still in flight
        if (!isAnalyzing.compareAndSet(false, true)) {
            imageProxy.close();
            return;
        }

        try {
            InputImage image = InputImage.fromMediaImage(imageProxy.getImage(), imageProxy.getImageInfo().getRotationDegrees());
            barcodeScanner.process(image)
                    .addOnSuccessListener(barcodes -> {
                        if (barcodes != null && !barcodes.isEmpty()) {
                            for (Barcode barcode : barcodes) {
                                if (scanListener != null && barcode.getRawValue() != null) {
                                    if (t5FirstScanTime == 0) {
                                        t5FirstScanTime = SystemClock.elapsedRealtime();
                                        Log.d(TAG, "FIRST_SCAN_TIME (from startScanner): " + (t5FirstScanTime - t0StartScanner) + "ms");
                                    }
                                    try {
                                        JSONObject result = new JSONObject();
                                        result.put("text", barcode.getRawValue());
                                        result.put("format", barcode.getFormat());
                                        scanListener.onScanResult(result);
                                    } catch (JSONException e) {
                                        Log.e(TAG, "JSON error creating scan result", e);
                                    }
                                    break; // Only report first detected barcode per frame
                                }
                            }
                        }
                    })
                    .addOnFailureListener(e -> Log.e(TAG, "CAMERA_ERRORS: Barcode analysis failed", e))
                    .addOnCompleteListener(task -> {
                        isAnalyzing.set(false);
                        imageProxy.close();
                    });
        } catch (Exception e) {
            isAnalyzing.set(false);
            imageProxy.close();
            Log.e(TAG, "CAMERA_ERRORS: Exception during analyzeImage", e);
        }
    }

    private void cleanUpSession() {
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
        }
        if (barcodeScanner != null) {
            barcodeScanner.close();
            barcodeScanner = null;
        }
        if (cameraExecutor != null) {
            cameraExecutor.shutdown();
            try {
                if (!cameraExecutor.awaitTermination(300, TimeUnit.MILLISECONDS)) {
                    cameraExecutor.shutdownNow();
                }
            } catch (InterruptedException ignored) {}
            cameraExecutor = null;
        }
        if (previewView != null && containerView != null) {
            containerView.removeView(previewView);
            previewView = null;
        }
        camera = null;
        isScanning = false;
        isAnalyzing.set(false);
    }

    public void stopScanner() {
        stopCount++;
        Log.d(TAG, "==================== STOP SCANNER (count: " + stopCount + ") ====================");
        cleanUpSession();
    }

    public void setZoom(float ratio) {
        if (camera != null && camera.getCameraInfo() != null && camera.getCameraControl() != null) {
            CameraInfo info = camera.getCameraInfo();
            if (info.getZoomState().getValue() != null) {
                float minZoom = info.getZoomState().getValue().getMinZoomRatio();
                float maxZoom = info.getZoomState().getValue().getMaxZoomRatio();
                float clamped = Math.min(Math.max(ratio, minZoom), maxZoom);
                camera.getCameraControl().setZoomRatio(clamped);
            }
        }
    }

    public JSONObject getZoomCapabilities() {
        JSONObject result = new JSONObject();
        try {
            if (camera != null && camera.getCameraInfo() != null) {
                CameraInfo info = camera.getCameraInfo();
                if (info.getZoomState().getValue() != null) {
                    float minZoom = info.getZoomState().getValue().getMinZoomRatio();
                    float maxZoom = info.getZoomState().getValue().getMaxZoomRatio();
                    float currentZoom = info.getZoomState().getValue().getZoomRatio();
                    result.put("min", minZoom);
                    result.put("max", maxZoom);
                    result.put("current", currentZoom);
                    Log.d(TAG, "ZOOM_CAPABILITIES - Min: " + minZoom + ", Max: " + maxZoom + ", Current: " + currentZoom);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "CAMERA_ERRORS: Error getting zoom capabilities", e);
        }
        return result;
    }

    public void setTorch(boolean enabled) {
        if (camera != null && camera.getCameraInfo() != null && camera.getCameraInfo().hasFlashUnit()) {
            camera.getCameraControl().enableTorch(enabled);
            Log.d(TAG, "Torch set to: " + enabled);
        }
    }

    public void focus(float x, float y) {
        if (camera != null && previewView != null) {
            // Clamp normalized coordinates [0.0, 1.0]
            float normX = Math.min(Math.max(x, 0.0f), 1.0f);
            float normY = Math.min(Math.max(y, 0.0f), 1.0f);

            float pxX = normX * previewView.getWidth();
            float pxY = normY * previewView.getHeight();

            MeteringPointFactory factory = previewView.getMeteringPointFactory();
            MeteringPoint point = factory.createPoint(pxX, pxY);

            // Focus + Auto Exposure metering with 3-second auto-cancel back to continuous AF
            FocusMeteringAction action = new FocusMeteringAction.Builder(point, FocusMeteringAction.FLAG_AF | FocusMeteringAction.FLAG_AE)
                    .setAutoCancelDuration(3, TimeUnit.SECONDS)
                    .build();

            ListenableFuture<?> future = camera.getCameraControl().startFocusAndMetering(action);
            future.addListener(() -> {
                Log.d(TAG, "Tap-to-focus completed. Reverting to continuous AF after timeout.");
            }, ContextCompat.getMainExecutor(context));

            Log.d(TAG, "Triggered tap-to-focus at (" + normX + ", " + normY + ") -> PreviewView pixels (" + pxX + ", " + pxY + ")");
        }
    }

    public void switchCamera() {
        if (lensFacing == CameraSelector.LENS_FACING_BACK) {
            lensFacing = CameraSelector.LENS_FACING_FRONT;
        } else {
            lensFacing = CameraSelector.LENS_FACING_BACK;
        }
        if (isScanning) {
            bindCameraUseCases();
        }
    }
}
