package com.mushiqr.pro.billing;

import android.app.Activity;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesResponseListener;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Native Google Play Billing Client Bridge for Mushi QR Pro.
 * Adheres strictly to security rules:
 * 1. Never grants Pro locally based on BillingClient state.
 * 2. Uses server-provided obfuscatedAccountId in BillingFlowParams.
 * 3. Never logs raw tokens, hashes, or secrets.
 * 4. Supports subscription query, purchase launch, and restore query.
 */
public class PlayBillingBridge implements PurchasesUpdatedListener {

    private static final String TAG = "PlayBillingBridge";

    public static final List<String> ALLOWED_PRODUCTS = Arrays.asList(
            "mushi_qr_weekly",
            "mushi_qr_monthly",
            "mushi_qr_yearly"
    );

    public interface BillingEventListener {
        void onPurchaseSuccess(String productId, String purchaseToken, String packageName);
        void onPurchasePending(String productId);
        void onPurchaseCancelled(String productId);
        void onPurchaseFailed(String productId, int responseCode, String debugMessage);
    }

    private final Activity activity;
    private BillingClient billingClient;
    private BillingEventListener eventListener;
    private final Map<String, ProductDetails> cachedProductDetails = new HashMap<>();
    private boolean isConnected = false;

    public PlayBillingBridge(Activity activity) {
        this.activity = activity;
        initBillingClient();
    }

    public void setEventListener(BillingEventListener listener) {
        this.eventListener = listener;
    }

    private void initBillingClient() {
        billingClient = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases()
                .build();
    }

    public void startConnection(@Nullable final Runnable onConnectedCallback) {
        if (billingClient == null) {
            initBillingClient();
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    isConnected = true;
                    Log.d(TAG, "BillingClient connected successfully");
                    queryProductsInternal(onConnectedCallback);
                } else {
                    isConnected = false;
                    Log.w(TAG, "BillingClient connection error code: " + billingResult.getResponseCode());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                isConnected = false;
                Log.w(TAG, "BillingClient disconnected from Google Play");
            }
        });
    }

    private void queryProductsInternal(@Nullable final Runnable onComplete) {
        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        for (String pid : ALLOWED_PRODUCTS) {
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(pid)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
            );
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(@NonNull BillingResult billingResult, @NonNull List<ProductDetails> list) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    cachedProductDetails.clear();
                    for (ProductDetails pd : list) {
                        cachedProductDetails.put(pd.getProductId(), pd);
                    }
                    Log.d(TAG, "Cached " + list.size() + " product details from Play Store");
                }
                if (onComplete != null) {
                    activity.runOnUiThread(onComplete);
                }
            }
        });
    }

    /**
     * Launches the Google Play billing flow with server-provided account binding.
     *
     * @param productId Authoritative product ID from ALLOWED_PRODUCTS
     * @param obfuscatedAccountId Keyed HMAC-SHA256 account binding ID from server
     * @param oldPurchaseToken Optional purchase token being replaced (deferred/upgrade)
     * @param replacementMode Optional proration/replacement mode
     */
    public void launchPurchase(
            @NonNull final String productId,
            @NonNull final String obfuscatedAccountId,
            @Nullable final String oldPurchaseToken,
            final int replacementMode
    ) {
        if (!ALLOWED_PRODUCTS.contains(productId)) {
            if (eventListener != null) {
                eventListener.onPurchaseFailed(productId, BillingClient.BillingResponseCode.DEVELOPER_ERROR, "Product not in allowlist");
            }
            return;
        }

        if (!isConnected) {
            startConnection(new Runnable() {
                @Override
                public void run() {
                    launchPurchase(productId, obfuscatedAccountId, oldPurchaseToken, replacementMode);
                }
            });
            return;
        }

        ProductDetails productDetails = cachedProductDetails.get(productId);
        if (productDetails == null) {
            queryProductsInternal(new Runnable() {
                @Override
                public void run() {
                    ProductDetails retryPd = cachedProductDetails.get(productId);
                    if (retryPd != null) {
                        executeBillingFlow(retryPd, obfuscatedAccountId, oldPurchaseToken, replacementMode);
                    } else if (eventListener != null) {
                        eventListener.onPurchaseFailed(productId, BillingClient.BillingResponseCode.ITEM_UNAVAILABLE, "Product details not found on Google Play");
                    }
                }
            });
            return;
        }

        executeBillingFlow(productDetails, obfuscatedAccountId, oldPurchaseToken, replacementMode);
    }

    private void executeBillingFlow(
            ProductDetails productDetails,
            String obfuscatedAccountId,
            @Nullable String oldPurchaseToken,
            int replacementMode
    ) {
        List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) {
            if (eventListener != null) {
                eventListener.onPurchaseFailed(productDetails.getProductId(), BillingClient.BillingResponseCode.ITEM_UNAVAILABLE, "No subscription offers found");
            }
            return;
        }

        String offerToken = offers.get(0).getOfferToken();

        BillingFlowParams.ProductDetailsParams productParams = BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(offerToken)
                .build();

        BillingFlowParams.Builder flowParamsBuilder = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Arrays.asList(productParams))
                .setObfuscatedAccountId(obfuscatedAccountId);

        if (oldPurchaseToken != null && !oldPurchaseToken.trim().isEmpty()) {
            BillingFlowParams.SubscriptionUpdateParams.Builder subUpdateBuilder =
                    BillingFlowParams.SubscriptionUpdateParams.newBuilder()
                            .setOldPurchaseToken(oldPurchaseToken);

            if (replacementMode > 0) {
                subUpdateBuilder.setSubscriptionReplacementMode(replacementMode);
            } else {
                // Default deferred replacement mode if not specified
                subUpdateBuilder.setSubscriptionReplacementMode(
                        BillingFlowParams.SubscriptionUpdateParams.ReplacementMode.DEFERRED
                );
            }

            flowParamsBuilder.setSubscriptionUpdateParams(subUpdateBuilder.build());
        }

        BillingResult result = billingClient.launchBillingFlow(activity, flowParamsBuilder.build());
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            if (eventListener != null) {
                eventListener.onPurchaseFailed(
                        productDetails.getProductId(),
                        result.getResponseCode(),
                        result.getDebugMessage()
                );
            }
        }
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, @Nullable List<Purchase> purchases) {
        int code = billingResult.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePurchaseInternal(purchase);
            }
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            Log.d(TAG, "User canceled billing flow");
            if (eventListener != null) {
                eventListener.onPurchaseCancelled(null);
            }
        } else {
            Log.w(TAG, "Purchase failed with code: " + code + " message: " + billingResult.getDebugMessage());
            if (eventListener != null) {
                eventListener.onPurchaseFailed(null, code, billingResult.getDebugMessage());
            }
        }
    }

    private void handlePurchaseInternal(Purchase purchase) {
        List<String> products = purchase.getProducts();
        String productId = products != null && !products.isEmpty() ? products.get(0) : "unknown";

        if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            Log.d(TAG, "Purchase is in PENDING state. Not conferring Pro entitlement.");
            if (eventListener != null) {
                eventListener.onPurchasePending(productId);
            }
            return;
        }

        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            // Forward verified structural values to backend listener
            // Security rule: DO NOT grant Pro locally.
            if (eventListener != null) {
                eventListener.onPurchaseSuccess(
                        productId,
                        purchase.getPurchaseToken(),
                        activity.getPackageName()
                );
            }
        }
    }

    /**
     * Queries active purchases from Google Play for restoration / reconciliation.
     */
    public void queryActivePurchases(final PurchasesQueryCallback callback) {
        if (!isConnected) {
            startConnection(new Runnable() {
                @Override
                public void run() {
                    queryActivePurchases(callback);
                }
            });
            return;
        }

        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();

        billingClient.queryPurchasesAsync(params, new PurchasesResponseListener() {
            @Override
            public void onQueryPurchasesResponse(@NonNull BillingResult billingResult, @NonNull List<Purchase> list) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    List<PurchaseRecordDto> records = new ArrayList<>();
                    for (Purchase p : list) {
                        if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            List<String> prods = p.getProducts();
                            String pid = (prods != null && !prods.isEmpty()) ? prods.get(0) : "";
                            records.add(new PurchaseRecordDto(pid, p.getPurchaseToken(), activity.getPackageName()));
                        }
                    }
                    callback.onSuccess(records);
                } else {
                    callback.onError(billingResult.getResponseCode(), billingResult.getDebugMessage());
                }
            }
        });
    }

    public static class PurchaseRecordDto {
        public final String productId;
        public final String purchaseToken;
        public final String packageName;

        public PurchaseRecordDto(String productId, String purchaseToken, String packageName) {
            this.productId = productId;
            this.purchaseToken = purchaseToken;
            this.packageName = packageName;
        }
    }

    public interface PurchasesQueryCallback {
        void onSuccess(List<PurchaseRecordDto> purchases);
        void onError(int responseCode, String message);
    }
}
