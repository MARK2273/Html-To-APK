package com.htmltoapk.template;

import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

public class AppWebViewClient extends WebViewClient {
    public interface PageFinishedListener {
        void onPageFinished();
    }

    private final AppCompatActivity activity;
    private final View errorLayout;
    private final PageFinishedListener pageFinishedListener;
    private final WebViewAssetLoader assetLoader;

    public AppWebViewClient(
        AppCompatActivity activity,
        View errorLayout,
        PageFinishedListener pageFinishedListener
    ) {
        this.activity = activity;
        this.errorLayout = errorLayout;
        this.pageFinishedListener = pageFinishedListener;
        this.assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(activity))
            .build();
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        if ("appassets.androidplatform.net".equals(url.getHost())) {
            WebResourceResponse response = assetLoader.shouldInterceptRequest(url);
            if (response != null) {
                return response;
            }
        }
        return super.shouldInterceptRequest(view, request);
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        String url = uri.toString();

        if ("appassets.androidplatform.net".equals(uri.getHost()) || url.startsWith("file:///android_asset/")) {
            return false;
        }

        String scheme = uri.getScheme();
        if (scheme != null) {
            scheme = scheme.toLowerCase();
            if (!"http".equals(scheme) && !"https".equals(scheme)) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    activity.startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return true;
                }
            }
        }

        if (AppConfig.ALLOW_EXTERNAL_LINKS) {
            if (AppConfig.OPEN_EXTERNAL_IN_BROWSER) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    activity.startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            } else {
                return false;
            }
        }

        return true;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        errorLayout.setVisibility(View.GONE);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        if (pageFinishedListener != null) {
            pageFinishedListener.onPageFinished();
        }
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        super.onReceivedError(view, request, error);
        if (request != null && request.isForMainFrame()) {
            errorLayout.setVisibility(View.VISIBLE);
        }
    }
}
