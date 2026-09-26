package com.mushiqr.pro.scanner;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Rect;
import android.hardware.camera2.CameraCharacteristics;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;
import android.util.Rational;
import android.util.Size;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.camera.camera2.interop.Camera2CameraInfo;
import androidx.camera.core.Camera;
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
import androidx.lifecycle.Observer;

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
    private static final long FIRST_FRAME_TIMEOUT_MS = 5000;

    // ── Startup State Machine ──
    public enum ScannerState {
        IDLE,
        STARTING,
        READY,
        STOPPING,
        ERROR
    }

    private volatile ScannerState state = ScannerState.IDLE;

    private final Context context;
    private final LifecycleOwner lifecycleOwner;
    private final FrameLayout containerView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private PreviewView previewView;
    private ProcessCameraProvider cameraProvider;
    private Camera camera;
    private BarcodeScanner barcodeScanner;
    private ExecutorService cameraExecutor;
    private Observer<PreviewView.StreamState> streamStateObserver;

    private int lensFacing = CameraSelector.LENS_FACING_BACK;

    // Diagnostic timing
    private long t0StartRequested = 0;
    private long t1PreviewViewCreated = 0;
    private long t2CameraProviderReady = 0;
    private long t3BindComplete = 0;
    private long t4FirstFrame = 0;
    private long t5FirstScan = 0;

    // Diagnostic counts
    private static int startCount = 0;
    private static int stopCount = 0;

    // FPS measurement
    private long lastAnalysisFpsTimestamp = 0;
    private int analysisFrameCounter = 0;
    private float observedAnalysisFps = 0f;

    // ML Kit analysis flag to avoid backlog
    private final AtomicBoolean isAnalyzing = new AtomicBoolean(false);

    // First-frame timeout runnable
    private Runnable firstFrameTimeoutRunnable;

    // Callbacks for current startup
    private Runnable pendingOnReady;
    private OnErrorCallback pendingOnError;

    public interface ScanListener {
        void onScanResult(JSONObject result);
        void onError(String error);
        void onZoomChanged(float ratio);
        void onCameraReady(JSONObject info);
    }

    public interface OnErrorCallback {
        void onError(String message);
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

    public ScannerState getState() {
        return state;
    }

    // ═══════════════════════════════════════════════════════════════
    // START SCANNER — full fail-safe startup with state machine
    // ═══════════════════════════════════════════════════════════════
    public void startScanner(Runnable onReady, OnErrorCallback onError) {
        startCount++;
        t0StartRequested = SystemClock.elapsedRealtime();
        t1PreviewViewCreated = 0;
        t2CameraProviderReady = 0;
        t3BindComplete = 0;
        t4FirstFrame = 0;
        t5FirstScan = 0;
        Log.d(TAG, "==================== START_SCANNER (count: " + startCount + ") ====================");

        // Block invalid transitions
        if (state == ScannerState.STARTING) {
            Log.w(TAG, "START_SCANNER rejected: already in STARTING state");
            if (onError != null) onError.onError("Scanner is already starting");
            return;
        }
        if (state == ScannerState.READY && camera != null && previewView != null) {
            Log.d(TAG, "START_SCANNER: already READY, re-triggering onReady");
            if (onReady != null) onReady.run();
            return;
        }

        // Transition to STARTING
        state = ScannerState.STARTING;
        pendingOnReady = onReady;
        pendingOnError = onError;

        // 1. Clean up any stale session (idempotent)
        cleanUpSessionInternal();

        // 2. Create executor
        cameraExecutor = Executors.newSingleThreadExecutor();

        // 3. Create PreviewView
        previewView = new PreviewView(context);
        previewView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        previewView.setScaleType(PreviewView.ScaleType.FILL_CENTER);
        previewView.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);

        containerView.removeAllViews();
        containerView.addView(previewView);
        t1PreviewViewCreated = SystemClock.elapsedRealtime();
        Log.d(TAG, "PREVIEW_VIEW_CREATED: +" + (t1PreviewViewCreated - t0StartRequested) + "ms");

        // 4. Wait for layout, then obtain CameraProvider
        previewView.post(() -> {
            if (state != ScannerState.STARTING) {
                Log.w(TAG, "State changed during layout wait, aborting");
                return;
            }

            int pvW = previewView.getWidth();
            int pvH = previewView.getHeight();
            Log.d(TAG, "PREVIEWVIEW_POST_LAYOUT: " + pvW + "x" + pvH);

            if (pvW <= 0 || pvH <= 0) {
                // Fallback: use container dimensions
                pvW = containerView.getWidth();
                pvH = containerView.getHeight();
                Log.w(TAG, "PreviewView zero dimensions, using container: " + pvW + "x" + pvH);
            }

            if (pvW <= 0 || pvH <= 0) {
                failStartup("PreviewView and container have zero dimensions");
                return;
            }

            final int finalW = pvW;
            final int finalH = pvH;

            ListenableFuture<ProcessCameraProvider> future = ProcessCameraProvider.getInstance(context);
            future.addListener(() -> {
                try {
                    cameraProvider = future.get();
                    t2CameraProviderReady = SystemClock.elapsedRealtime();
                    Log.d(TAG, "CAMERA_PROVIDER_READY: +" + (t2CameraProviderReady - t0StartRequested) + "ms");

                    if (state != ScannerState.STARTING) {
                        Log.w(TAG, "State changed while waiting for CameraProvider, aborting");
                        return;
                    }

                    // 5. Bind camera use cases — this can throw
                    bindCameraUseCases(finalW, finalH);

                } catch (Exception e) {
                    Log.e(TAG, "CAMERA_PROVIDER_FAILURE: " + e.getClass().getSimpleName() + " - " + e.getMessage(), e);
                    failStartup("Failed to get camera provider: " + e.getMessage());
                }
            }, ContextCompat.getMainExecutor(context));
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // BIND CAMERA — throws on failure, does NOT swallow errors
    // ═══════════════════════════════════════════════════════════════
    private void bindCameraUseCases(int viewWidth, int viewHeight) {
        if (cameraProvider == null || previewView == null) {
            failStartup("CameraProvider or PreviewView is null before bind");
            return;
        }

        Log.d(TAG, "CAMERA_BIND_START");

        // Unbind any existing use cases
        cameraProvider.unbindAll();

        long bindStartTime = SystemClock.elapsedRealtime();

        CameraSelector cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(lensFacing)
                .build();

        // 4:3 resolution strategy
        ResolutionSelector resolutionSelector = new ResolutionSelector.Builder()
                .setAspectRatioStrategy(AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY)
                .setResolutionStrategy(new ResolutionStrategy(
                        new Size(1920, 1440),
                        ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER
                ))
                .build();

        // Build Preview
        Preview preview = new Preview.Builder()
                .setResolutionSelector(resolutionSelector)
                .build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        // Build ImageAnalysis
        ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                .setResolutionSelector(resolutionSelector)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();
        imageAnalysis.setAnalyzer(cameraExecutor, this::analyzeImage);

        // Build ViewPort from actual measured PreviewView dimensions
        Rational viewportRational = new Rational(viewWidth, viewHeight);
        int rotation = previewView.getDisplay() != null
                ? previewView.getDisplay().getRotation()
                : Surface.ROTATION_0;

        ViewPort viewPort = new ViewPort.Builder(viewportRational, rotation)
                .setScaleType(ViewPort.FILL_CENTER)
                .build();

        UseCaseGroup useCaseGroup = new UseCaseGroup.Builder()
                .addUseCase(preview)
                .addUseCase(imageAnalysis)
                .setViewPort(viewPort)
                .build();

        // ──── THE CRITICAL BIND ────
        // This MUST propagate errors. No catch-and-continue.
        try {
            camera = cameraProvider.bindToLifecycle(lifecycleOwner, cameraSelector, useCaseGroup);
        } catch (Exception e) {
            Log.e(TAG, "CAMERA_BIND_FAILURE: " + e.getClass().getSimpleName() + " - " + e.getMessage(), e);
            failStartup("CameraX bind failed: " + e.getMessage());
            return;
        }

        // Verify camera object
        if (camera == null) {
            failStartup("bindToLifecycle returned null Camera");
            return;
        }

        t3BindComplete = SystemClock.elapsedRealtime();
        Log.d(TAG, "CAMERA_BIND_SUCCESS: +" + (t3BindComplete - t0StartRequested) + "ms (bind took " + (t3BindComplete - bindStartTime) + "ms)");

        // Log full diagnostics
        logFullDiagnostics(viewWidth, viewHeight, viewportRational, preview, imageAnalysis, rotation);

        // ──── VERIFY STREAMING ────
        // Do NOT report ready until PreviewView actually has frames.
        setupStreamStateVerification();

        // Zoom state observer
        camera.getCameraInfo().getZoomState().observe(lifecycleOwner, zoomState -> {
            if (scanListener != null && zoomState != null) {
                scanListener.onZoomChanged(zoomState.getZoomRatio());
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // STREAM STATE VERIFICATION — wait for first real frame
    // ═══════════════════════════════════════════════════════════════
    private void setupStreamStateVerification() {
        // Remove any previous observer
        if (streamStateObserver != null && previewView != null) {
            previewView.getPreviewStreamState().removeObserver(streamStateObserver);
        }

        streamStateObserver = new Observer<PreviewView.StreamState>() {
            @Override
            public void onChanged(PreviewView.StreamState streamState) {
                Log.d(TAG, "PREVIEW_STREAM_STATE: " + streamState);

                if (streamState == PreviewView.StreamState.STREAMING) {
                    t4FirstFrame = SystemClock.elapsedRealtime();
                    Log.d(TAG, "FIRST_FRAME_TIME: +" + (t4FirstFrame - t0StartRequested) + "ms");

                    // Cancel timeout
                    if (firstFrameTimeoutRunnable != null) {
                        mainHandler.removeCallbacks(firstFrameTimeoutRunnable);
                        firstFrameTimeoutRunnable = null;
                    }

                    // Verify PreviewView is visible and has dimensions
                    int w = previewView.getWidth();
                    int h = previewView.getHeight();
                    boolean visible = previewView.getVisibility() == View.VISIBLE;
                    boolean containerVisible = containerView.getVisibility() == View.VISIBLE;

                    Log.d(TAG, "PREVIEWVIEW_WIDTH: " + w);
                    Log.d(TAG, "PREVIEWVIEW_HEIGHT: " + h);
                    Log.d(TAG, "PREVIEWVIEW_VISIBILITY: " + (visible ? "VISIBLE" : "HIDDEN"));
                    Log.d(TAG, "CONTAINER_VISIBILITY: " + (containerVisible ? "VISIBLE" : "HIDDEN"));

                    if (w <= 0 || h <= 0) {
                        Log.w(TAG, "PreviewView streaming but has zero dimensions!");
                    }

                    // ──── TRANSITION TO READY ────
                    if (state == ScannerState.STARTING) {
                        state = ScannerState.READY;
                        Log.d(TAG, "STATE -> READY");

                        // Initialize ML Kit (non-blocking — camera preview is already visible)
                        initializeBarcodeScanner();

                        // Build camera info for JS
                        JSONObject cameraInfo = buildCameraInfoJson();

                        // Notify success
                        if (pendingOnReady != null) {
                            pendingOnReady.run();
                            pendingOnReady = null;
                        }
                        pendingOnError = null;

                        if (scanListener != null) {
                            scanListener.onCameraReady(cameraInfo);
                        }
                    }

                    // Remove observer — we only need first-frame notification
                    if (previewView != null) {
                        previewView.getPreviewStreamState().removeObserver(this);
                    }
                }
            }
        };

        previewView.getPreviewStreamState().observe(lifecycleOwner, streamStateObserver);

        // Set timeout for first frame
        firstFrameTimeoutRunnable = () -> {
            if (state == ScannerState.STARTING) {
                Log.e(TAG, "FIRST_FRAME_TIMEOUT: No frame received within " + FIRST_FRAME_TIMEOUT_MS + "ms");

                // Check PreviewView state for diagnostics
                if (previewView != null) {
                    Log.e(TAG, "TIMEOUT_DIAG: PreviewView=" + previewView.getWidth() + "x" + previewView.getHeight()
                            + " visible=" + (previewView.getVisibility() == View.VISIBLE)
                            + " attached=" + previewView.isAttachedToWindow());
                }
                if (containerView != null) {
                    Log.e(TAG, "TIMEOUT_DIAG: Container=" + containerView.getWidth() + "x" + containerView.getHeight()
                            + " visible=" + (containerView.getVisibility() == View.VISIBLE)
                            + " parent=" + (containerView.getParent() != null ? containerView.getParent().getClass().getSimpleName() : "null"));
                }

                failStartup("Camera preview timed out — no frames received in " + FIRST_FRAME_TIMEOUT_MS + "ms");
            }
        };
        mainHandler.postDelayed(firstFrameTimeoutRunnable, FIRST_FRAME_TIMEOUT_MS);
    }

    // ═══════════════════════════════════════════════════════════════
    // ML KIT INITIALIZATION — separate from camera startup
    // ═══════════════════════════════════════════════════════════════
    private void initializeBarcodeScanner() {
        if (barcodeScanner != null) {
            return; // Already initialized
        }
        try {
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
            Log.d(TAG, "ML_KIT_INIT: " + (SystemClock.elapsedRealtime() - mlKitStart) + "ms");
        } catch (Exception e) {
            Log.e(TAG, "ML_KIT_INIT_FAILURE: " + e.getMessage(), e);
            // Camera still works without ML Kit — just no scanning
            if (scanListener != null) {
                scanListener.onError("Barcode scanner initialization failed: " + e.getMessage());
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // FAIL STARTUP — centralized failure handling
    // ═══════════════════════════════════════════════════════════════
    private void failStartup(String reason) {
        Log.e(TAG, "STARTUP_FAILURE: " + reason);
        state = ScannerState.ERROR;
        Log.d(TAG, "STATE -> ERROR");

        // Clean up partial state
        cleanUpSessionInternal();

        // Notify error callback
        if (pendingOnError != null) {
            pendingOnError.onError(reason);
            pendingOnError = null;
        }
        pendingOnReady = null;

        // Notify scan listener
        if (scanListener != null) {
            scanListener.onError(reason);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BUILD CAMERA INFO JSON
    // ═══════════════════════════════════════════════════════════════
    private JSONObject buildCameraInfoJson() {
        JSONObject info = new JSONObject();
        try {
            if (camera != null) {
                CameraInfo camInfo = camera.getCameraInfo();
                boolean hasFlash = camInfo.hasFlashUnit();
                float minZoom = 1f, maxZoom = 1f, curZoom = 1f;
                if (camInfo.getZoomState().getValue() != null) {
                    minZoom = camInfo.getZoomState().getValue().getMinZoomRatio();
                    maxZoom = camInfo.getZoomState().getValue().getMaxZoomRatio();
                    curZoom = camInfo.getZoomState().getValue().getZoomRatio();
                }
                info.put("flashSupported", hasFlash);
                info.put("minZoom", minZoom);
                info.put("maxZoom", maxZoom);
                info.put("currentZoom", curZoom);
                info.put("lensFacing", lensFacing == CameraSelector.LENS_FACING_BACK ? "back" : "front");
            }
        } catch (JSONException e) {
            Log.e(TAG, "Failed to build camera info JSON", e);
        }
        return info;
    }

    // ═══════════════════════════════════════════════════════════════
    // DIAGNOSTICS
    // ═══════════════════════════════════════════════════════════════
    @SuppressLint("RestrictedApi")
    private void logFullDiagnostics(int viewWidth, int viewHeight, Rational rational,
                                     Preview preview, ImageAnalysis imageAnalysis, int rotation) {
        if (camera == null) return;
        CameraInfo info = camera.getCameraInfo();

        try {
            Camera2CameraInfo cam2Info = Camera2CameraInfo.from(info);

            String cameraId = cam2Info.getCameraId();
            Integer sensorOrientation = cam2Info.getCameraCharacteristic(CameraCharacteristics.SENSOR_ORIENTATION);
            Integer hardwareLevel = cam2Info.getCameraCharacteristic(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL);
            float[] focalLengths = cam2Info.getCameraCharacteristic(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS);
            int[] afModes = cam2Info.getCameraCharacteristic(CameraCharacteristics.CONTROL_AF_AVAILABLE_MODES);

            StringBuilder focalStr = new StringBuilder();
            if (focalLengths != null) {
                for (float f : focalLengths) focalStr.append(f).append("mm ");
            }

            boolean afSupported = false;
            boolean afContinuousSupported = false;
            if (afModes != null) {
                for (int mode : afModes) {
                    if (mode != CameraCharacteristics.CONTROL_AF_MODE_OFF) afSupported = true;
                    if (mode == CameraCharacteristics.CONTROL_AF_MODE_CONTINUOUS_PICTURE
                            || mode == CameraCharacteristics.CONTROL_AF_MODE_CONTINUOUS_VIDEO) {
                        afContinuousSupported = true;
                    }
                }
            }

            Size previewRes = preview.getResolutionInfo() != null ? preview.getResolutionInfo().getResolution() : null;
            Rect previewCrop = preview.getResolutionInfo() != null ? preview.getResolutionInfo().getCropRect() : null;
            Size analysisRes = imageAnalysis.getResolutionInfo() != null ? imageAnalysis.getResolutionInfo().getResolution() : null;
            Rect analysisCrop = imageAnalysis.getResolutionInfo() != null ? imageAnalysis.getResolutionInfo().getCropRect() : null;

            float minZoom = 1f, maxZoom = 1f, curZoom = 1f;
            if (info.getZoomState().getValue() != null) {
                minZoom = info.getZoomState().getValue().getMinZoomRatio();
                maxZoom = info.getZoomState().getValue().getMaxZoomRatio();
                curZoom = info.getZoomState().getValue().getZoomRatio();
            }

            boolean hasFlash = info.hasFlashUnit();

            // Container diagnostics
            int[] containerLoc = new int[2];
            containerView.getLocationOnScreen(containerLoc);
            float density = context.getResources().getDisplayMetrics().density;

            Log.d(TAG, "==================== CAMERA DIAGNOSTICS ====================");
            Log.d(TAG, "CAMERA_ID: " + cameraId);
            Log.d(TAG, "LENS_FACING: " + (lensFacing == CameraSelector.LENS_FACING_BACK ? "BACK" : "FRONT"));
            Log.d(TAG, "SENSOR_ORIENTATION: " + sensorOrientation);
            Log.d(TAG, "HARDWARE_LEVEL: " + hardwareLevel);
            Log.d(TAG, "FOCAL_LENGTHS: " + focalStr.toString().trim());
            Log.d(TAG, "AF_SUPPORTED: " + afSupported);
            Log.d(TAG, "AF_CONTINUOUS_SUPPORTED: " + afContinuousSupported);
            Log.d(TAG, "FLASH_SUPPORTED: " + hasFlash);
            Log.d(TAG, "DISPLAY_ROTATION: " + rotation);
            Log.d(TAG, "DENSITY: " + density);
            Log.d(TAG, "NATIVE_CONTAINER_X: " + containerLoc[0]);
            Log.d(TAG, "NATIVE_CONTAINER_Y: " + containerLoc[1]);
            Log.d(TAG, "NATIVE_CONTAINER_WIDTH: " + containerView.getWidth());
            Log.d(TAG, "NATIVE_CONTAINER_HEIGHT: " + containerView.getHeight());
            Log.d(TAG, "PREVIEWVIEW_WIDTH: " + viewWidth);
            Log.d(TAG, "PREVIEWVIEW_HEIGHT: " + viewHeight);
            Log.d(TAG, "VIEWPORT_ASPECT_RATIO: " + rational.getNumerator() + ":" + rational.getDenominator() + " (" + rational.floatValue() + ")");
            Log.d(TAG, "PREVIEW_RESOLUTION: " + (previewRes != null ? previewRes.getWidth() + "x" + previewRes.getHeight() : "unknown"));
            Log.d(TAG, "PREVIEW_CROP_RECT: " + (previewCrop != null ? previewCrop.toShortString() : "none"));
            Log.d(TAG, "ANALYSIS_RESOLUTION: " + (analysisRes != null ? analysisRes.getWidth() + "x" + analysisRes.getHeight() : "unknown"));
            Log.d(TAG, "ANALYSIS_CROP_RECT: " + (analysisCrop != null ? analysisCrop.toShortString() : "none"));
            Log.d(TAG, "MIN_ZOOM: " + minZoom);
            Log.d(TAG, "MAX_ZOOM: " + maxZoom);
            Log.d(TAG, "CURRENT_ZOOM: " + curZoom);
            Log.d(TAG, "CONTAINER_VISIBILITY: " + (containerView.getVisibility() == View.VISIBLE ? "VISIBLE" : "HIDDEN"));
            Log.d(TAG, "CONTAINER_ALPHA: " + containerView.getAlpha());
            Log.d(TAG, "PREVIEWVIEW_VISIBILITY: " + (previewView.getVisibility() == View.VISIBLE ? "VISIBLE" : "HIDDEN"));
            Log.d(TAG, "PREVIEWVIEW_ALPHA: " + previewView.getAlpha());
            Log.d(TAG, "============================================================");
        } catch (Exception e) {
            Log.e(TAG, "DIAGNOSTICS_ERROR: " + e.getMessage(), e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ML KIT AUTO-ZOOM CALLBACK
    // ═══════════════════════════════════════════════════════════════
    private final ZoomSuggestionOptions.ZoomCallback zoomCallback = zoomRatio -> {
        if (camera != null && camera.getCameraControl() != null && state == ScannerState.READY) {
            CameraInfo info = camera.getCameraInfo();
            if (info != null && info.getZoomState().getValue() != null) {
                float minZoom = info.getZoomState().getValue().getMinZoomRatio();
                float maxZoom = info.getZoomState().getValue().getMaxZoomRatio();
                float clampedZoom = Math.min(Math.max(zoomRatio, minZoom), maxZoom);
                camera.getCameraControl().setZoomRatio(clampedZoom);
                Log.d(TAG, "ML Kit auto-zoom: " + zoomRatio + " -> clamped: " + clampedZoom);
                return true;
            }
        }
        return false;
    };

    // ═══════════════════════════════════════════════════════════════
    // ANALYZE IMAGE — with backpressure guard
    // ═══════════════════════════════════════════════════════════════
    @SuppressLint("UnsafeOptInUsageError")
    private void analyzeImage(@NonNull ImageProxy imageProxy) {
        // FPS measurement
        long now = SystemClock.elapsedRealtime();
        analysisFrameCounter++;
        if (now - lastAnalysisFpsTimestamp >= 2000) {
            observedAnalysisFps = (analysisFrameCounter * 1000.0f) / (now - lastAnalysisFpsTimestamp);
            analysisFrameCounter = 0;
            lastAnalysisFpsTimestamp = now;
            Log.d(TAG, "OBSERVED_ANALYSIS_FPS: " + String.format("%.1f", observedAnalysisFps));
        }

        if (imageProxy.getImage() == null || state != ScannerState.READY || barcodeScanner == null) {
            imageProxy.close();
            return;
        }

        // Backpressure: skip if previous frame still processing
        if (!isAnalyzing.compareAndSet(false, true)) {
            imageProxy.close();
            return;
        }

        try {
            InputImage image = InputImage.fromMediaImage(
                    imageProxy.getImage(),
                    imageProxy.getImageInfo().getRotationDegrees());

            barcodeScanner.process(image)
                    .addOnSuccessListener(barcodes -> {
                        if (barcodes != null && !barcodes.isEmpty() && state == ScannerState.READY) {
                            for (Barcode barcode : barcodes) {
                                if (scanListener != null && barcode.getRawValue() != null) {
                                    if (t5FirstScan == 0) {
                                        t5FirstScan = SystemClock.elapsedRealtime();
                                        Log.d(TAG, "FIRST_SCAN_TIME: +" + (t5FirstScan - t0StartRequested) + "ms");
                                    }
                                    try {
                                        JSONObject result = new JSONObject();
                                        result.put("text", barcode.getRawValue());
                                        result.put("format", barcode.getFormat());
                                        scanListener.onScanResult(result);
                                    } catch (JSONException e) {
                                        Log.e(TAG, "JSON error creating scan result", e);
                                    }
                                    break;
                                }
                            }
                        }
                    })
                    .addOnFailureListener(e -> Log.e(TAG, "BARCODE_ANALYSIS_FAILURE: " + e.getMessage()))
                    .addOnCompleteListener(task -> {
                        isAnalyzing.set(false);
                        imageProxy.close();
                    });
        } catch (Exception e) {
            isAnalyzing.set(false);
            imageProxy.close();
            Log.e(TAG, "ANALYZE_IMAGE_EXCEPTION: " + e.getClass().getSimpleName() + " - " + e.getMessage(), e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CLEAN UP SESSION — internal, does not change state
    // ═══════════════════════════════════════════════════════════════
    private void cleanUpSessionInternal() {
        // Cancel first-frame timeout
        if (firstFrameTimeoutRunnable != null) {
            mainHandler.removeCallbacks(firstFrameTimeoutRunnable);
            firstFrameTimeoutRunnable = null;
        }

        // Remove stream state observer
        if (streamStateObserver != null && previewView != null) {
            try {
                previewView.getPreviewStreamState().removeObserver(streamStateObserver);
            } catch (Exception e) {
                Log.w(TAG, "Failed to remove stream state observer", e);
            }
            streamStateObserver = null;
        }

        // Unbind camera
        if (cameraProvider != null) {
            try {
                cameraProvider.unbindAll();
            } catch (Exception e) {
                Log.w(TAG, "Error unbinding camera", e);
            }
        }

        // Close barcode scanner
        if (barcodeScanner != null) {
            try {
                barcodeScanner.close();
            } catch (Exception e) {
                Log.w(TAG, "Error closing barcode scanner", e);
            }
            barcodeScanner = null;
        }

        // Shutdown executor — do NOT use awaitTermination on main thread
        if (cameraExecutor != null) {
            cameraExecutor.shutdownNow();
            cameraExecutor = null;
        }

        // Remove PreviewView
        if (previewView != null && containerView != null) {
            try {
                containerView.removeView(previewView);
            } catch (Exception e) {
                Log.w(TAG, "Error removing preview view", e);
            }
            previewView = null;
        }

        camera = null;
        isAnalyzing.set(false);
    }

    // ═══════════════════════════════════════════════════════════════
    // STOP SCANNER — idempotent public API
    // ═══════════════════════════════════════════════════════════════
    public void stopScanner() {
        stopCount++;
        Log.d(TAG, "==================== STOP_SCANNER (count: " + stopCount + ", state: " + state + ") ====================");

        if (state == ScannerState.IDLE) {
            Log.d(TAG, "Already IDLE, nothing to stop");
            return;
        }

        state = ScannerState.STOPPING;
        cleanUpSessionInternal();
        state = ScannerState.IDLE;
        Log.d(TAG, "STATE -> IDLE");
    }

    // ═══════════════════════════════════════════════════════════════
    // ZOOM
    // ═══════════════════════════════════════════════════════════════
    public void setZoom(float ratio) {
        if (camera != null && state == ScannerState.READY) {
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
                    Log.d(TAG, "ZOOM_CAPABILITIES: min=" + minZoom + " max=" + maxZoom + " current=" + currentZoom);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting zoom capabilities", e);
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════════════
    // TORCH
    // ═══════════════════════════════════════════════════════════════
    public void setTorch(boolean enabled) {
        if (camera != null && state == ScannerState.READY) {
            boolean hasFlash = camera.getCameraInfo().hasFlashUnit();
            if (hasFlash) {
                camera.getCameraControl().enableTorch(enabled);
                Log.d(TAG, "TORCH: " + enabled);
            } else {
                Log.w(TAG, "TORCH: requested but camera has no flash unit");
            }
        }
    }

    public boolean hasFlash() {
        if (camera != null) {
            return camera.getCameraInfo().hasFlashUnit();
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════
    // FOCUS
    // ═══════════════════════════════════════════════════════════════
    public void focus(float x, float y) {
        if (camera == null || previewView == null || state != ScannerState.READY) return;

        // Clamp normalized coordinates [0.0, 1.0]
        float normX = Math.min(Math.max(x, 0.0f), 1.0f);
        float normY = Math.min(Math.max(y, 0.0f), 1.0f);

        float pxX = normX * previewView.getWidth();
        float pxY = normY * previewView.getHeight();

        MeteringPointFactory factory = previewView.getMeteringPointFactory();
        MeteringPoint point = factory.createPoint(pxX, pxY);

        FocusMeteringAction action = new FocusMeteringAction.Builder(
                point, FocusMeteringAction.FLAG_AF | FocusMeteringAction.FLAG_AE)
                .setAutoCancelDuration(3, TimeUnit.SECONDS)
                .build();

        camera.getCameraControl().startFocusAndMetering(action)
                .addListener(() -> Log.d(TAG, "TAP_FOCUS: completed at (" + normX + ", " + normY + ")"),
                        ContextCompat.getMainExecutor(context));

        Log.d(TAG, "TAP_FOCUS: triggered at norm(" + normX + ", " + normY + ") -> px(" + pxX + ", " + pxY + ")");
    }

    // ═══════════════════════════════════════════════════════════════
    // SWITCH CAMERA
    // ═══════════════════════════════════════════════════════════════
    public void switchCamera(Runnable onReady, OnErrorCallback onError) {
        if (state != ScannerState.READY && state != ScannerState.IDLE) {
            Log.w(TAG, "SWITCH_CAMERA: rejected, state=" + state);
            if (onError != null) onError.onError("Cannot switch camera in state: " + state);
            return;
        }

        int newFacing = (lensFacing == CameraSelector.LENS_FACING_BACK)
                ? CameraSelector.LENS_FACING_FRONT
                : CameraSelector.LENS_FACING_BACK;

        // Verify opposite lens exists
        if (cameraProvider != null) {
            try {
                CameraSelector testSelector = new CameraSelector.Builder()
                        .requireLensFacing(newFacing)
                        .build();
                if (!cameraProvider.hasCamera(testSelector)) {
                    String msg = (newFacing == CameraSelector.LENS_FACING_FRONT ? "Front" : "Back") + " camera not available";
                    Log.w(TAG, "SWITCH_CAMERA: " + msg);
                    if (onError != null) onError.onError(msg);
                    return;
                }
            } catch (Exception e) {
                Log.e(TAG, "SWITCH_CAMERA: error checking camera", e);
                if (onError != null) onError.onError("Error checking camera: " + e.getMessage());
                return;
            }
        }

        Log.d(TAG, "SWITCH_CAMERA: " + (lensFacing == CameraSelector.LENS_FACING_BACK ? "BACK" : "FRONT")
                + " -> " + (newFacing == CameraSelector.LENS_FACING_BACK ? "BACK" : "FRONT"));

        lensFacing = newFacing;

        // Full restart with new lens
        stopScanner();
        startScanner(onReady, onError);
    }
}
