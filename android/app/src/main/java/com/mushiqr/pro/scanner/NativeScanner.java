package com.mushiqr.pro.scanner;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.util.Log;
import android.view.ViewGroup;
import android.view.View;
import android.widget.FrameLayout;

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

public class NativeScanner {

    private static final String TAG = "NativeScanner";
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
        if (isScanning) {
            if (onReady != null) onReady.run();
            return;
        }

        cameraExecutor = Executors.newSingleThreadExecutor();

        // Configure ML Kit
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
                // If zoom suggestion is supported by mlkit version
                .setZoomSuggestionOptions(
                    new ZoomSuggestionOptions.Builder(zoomCallback).build()
                )
                .build();
        barcodeScanner = BarcodeScanning.getClient(options);

        // Setup PreviewView
        previewView = new PreviewView(context);
        previewView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        previewView.setScaleType(PreviewView.ScaleType.FILL_CENTER);

        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(context);
        cameraProviderFuture.addListener(() -> {
            try {
                cameraProvider = cameraProviderFuture.get();
                bindCameraUseCases();
                
                // Add preview view to container
                containerView.addView(previewView);
                isScanning = true;
                
                if (onReady != null) onReady.run();
            } catch (Exception e) {
                Log.e(TAG, "Failed to start camera", e);
                if (onError != null) onError.run();
            }
        }, ContextCompat.getMainExecutor(context));
    }

    private void bindCameraUseCases() {
        if (cameraProvider == null) return;
        cameraProvider.unbindAll();

        CameraSelector cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(lensFacing)
                .build();

        ResolutionSelector resolutionSelector = new ResolutionSelector.Builder()
                .setAspectRatioStrategy(AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY)
                .build();
        Log.d(TAG, "Configuring ResolutionSelector with RATIO_4_3_FALLBACK_AUTO_STRATEGY");

        Preview preview = new Preview.Builder()
                .setResolutionSelector(resolutionSelector)
                .build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                .setResolutionSelector(resolutionSelector)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        imageAnalysis.setAnalyzer(cameraExecutor, this::analyzeImage);

        Rational aspectRatio;
        int width = containerView.getLayoutParams().width;
        int height = containerView.getLayoutParams().height;
        if (width > 0 && height > 0) {
            aspectRatio = new Rational(width, height);
            Log.d(TAG, "Creating ViewPort with aspect ratio from container bounds: " + width + "x" + height);
        } else {
            aspectRatio = new Rational(3, 4);
            Log.d(TAG, "Creating ViewPort with fallback portrait 3:4 aspect ratio");
        }

        int rotation = previewView.getDisplay() != null ? previewView.getDisplay().getRotation() : Surface.ROTATION_0;

        ViewPort viewPort = new ViewPort.Builder(aspectRatio, rotation)
                .setScaleType(ViewPort.FILL_CENTER)
                .build();

        UseCaseGroup useCaseGroup = new UseCaseGroup.Builder()
                .addUseCase(preview)
                .addUseCase(imageAnalysis)
                .setViewPort(viewPort)
                .build();

        try {
            camera = cameraProvider.bindToLifecycle(lifecycleOwner, cameraSelector, useCaseGroup);
            Log.d(TAG, "Camera bound to lifecycle with UseCaseGroup and ViewPort.");
            
            camera.getCameraInfo().getZoomState().observe(lifecycleOwner, zoomState -> {
                if (scanListener != null && zoomState != null) {
                    scanListener.onZoomChanged(zoomState.getZoomRatio());
                }
            });
        } catch(Exception e) {
            Log.e(TAG, "Use case binding failed", e);
        }
    }

    private ZoomSuggestionOptions.ZoomCallback zoomCallback = zoomRatio -> {
        if (camera != null && camera.getCameraControl() != null) {
            camera.getCameraControl().setZoomRatio(zoomRatio);
            return true;
        }
        return false;
    };

    @SuppressLint("UnsafeOptInUsageError")
    private void analyzeImage(@NonNull ImageProxy imageProxy) {
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
        if (!isScanning) return;
        
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
        
        isScanning = false;
        camera = null;
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
        if (camera != null && previewView != null) {
            float pxX = x * previewView.getWidth();
            float pxY = y * previewView.getHeight();
            MeteringPointFactory factory = previewView.getMeteringPointFactory();
            MeteringPoint point = factory.createPoint(pxX, pxY);
            FocusMeteringAction action = new FocusMeteringAction.Builder(point, FocusMeteringAction.FLAG_AF)
                    .setAutoCancelDuration(3, java.util.concurrent.TimeUnit.SECONDS)
                    .build();
            camera.getCameraControl().startFocusAndMetering(action);
            Log.d(TAG, "Triggered tap to focus at normalized " + x + ", " + y + " -> pixels " + pxX + ", " + pxY);
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
