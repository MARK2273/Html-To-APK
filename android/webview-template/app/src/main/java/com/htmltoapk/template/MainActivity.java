package com.htmltoapk.template;

import android.app.DownloadManager;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private View errorLayout;
    private Button btnRetry;
    private PermissionManager permissionManager;
    private ValueCallback<Uri[]> filePathCallback;

    private final ActivityResultLauncher<Intent> fileChooserLauncher = registerForActivityResult(
        new ActivityResultContracts.StartActivityForResult(),
        (ActivityResult result) -> {
            if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                Intent data = result.getData();
                Uri[] uris = null;
                ClipData clipData = data.getClipData();
                if (clipData != null) {
                    List<Uri> list = new ArrayList<>();
                    for (int i = 0; i < clipData.getItemCount(); i++) {
                        Uri uri = clipData.getItemAt(i).getUri();
                        if (uri != null) list.add(uri);
                    }
                    uris = list.toArray(new Uri[0]);
                } else if (data.getData() != null) {
                    uris = new Uri[]{data.getData()};
                }
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(uris);
                }
            } else {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
            }
            filePathCallback = null;
        }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        progressBar = findViewById(R.id.progressBar);
        errorLayout = findViewById(R.id.errorLayout);
        btnRetry = findViewById(R.id.btnRetry);

        permissionManager = new PermissionManager(this);
        setupWebView();
        setupSwipeRefresh();
        setupErrorLayout();
        setupBackNavigation();

        loadHomePage();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(AppConfig.ENABLE_JAVASCRIPT);
        settings.setDomStorageEnabled(AppConfig.ENABLE_DOM_STORAGE);
        settings.setDatabaseEnabled(AppConfig.ENABLE_DATABASE);

        settings.setSupportZoom(AppConfig.ENABLE_ZOOM);
        settings.setBuiltInZoomControls(AppConfig.ENABLE_ZOOM);
        settings.setDisplayZoomControls(false);

        settings.setGeolocationEnabled(AppConfig.ENABLE_GEOLOCATION);

        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        if (AppConfig.OFFLINE_CACHE_ENABLED) {
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        } else {
            settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        }

        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new AppWebViewClient(
            this,
            errorLayout,
            () -> swipeRefreshLayout.setRefreshing(false)
        ));

        webView.setWebChromeClient(new AppWebChromeClient(
            this,
            progressBar,
            permissionManager,
            fileChooserLauncher,
            (ValueCallback<Uri[]> callback) -> filePathCallback = callback
        ));

        if (AppConfig.ENABLE_DOWNLOADS) {
            webView.setDownloadListener((String url, String userAgent, String contentDisposition, String mimetype, long contentLength) -> {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimetype);
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setDescription("Downloading file...");
                    String fileName = URLUtil.guessFileName(url, contentDisposition, mimetype);
                    request.setTitle(fileName);
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(this, "Download started...", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(this, "Download failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private void setupSwipeRefresh() {
        swipeRefreshLayout.setEnabled(AppConfig.ENABLE_PULL_TO_REFRESH);
        swipeRefreshLayout.setOnRefreshListener(() -> webView.reload());
    }

    private void setupErrorLayout() {
        btnRetry.setOnClickListener(v -> {
            errorLayout.setVisibility(View.GONE);
            webView.reload();
        });
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    private void loadHomePage() {
        webView.loadUrl(AppConfig.ENTRY_URL);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
