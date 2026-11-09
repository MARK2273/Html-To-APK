package com.htmltoapk.template;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.JsResult;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import androidx.activity.result.ActivityResultLauncher;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import java.util.ArrayList;
import java.util.List;

public class AppWebChromeClient extends WebChromeClient {
    public interface FilePathCallbackHandler {
        void setCallback(ValueCallback<Uri[]> callback);
    }

    private final AppCompatActivity activity;
    private final ProgressBar progressBar;
    private final PermissionManager permissionManager;
    private final ActivityResultLauncher<Intent> fileChooserLauncher;
    private final FilePathCallbackHandler filePathCallbackHandler;

    private View customView;
    private CustomViewCallback customViewCallback;
    private int originalOrientation;

    public AppWebChromeClient(
        AppCompatActivity activity,
        ProgressBar progressBar,
        PermissionManager permissionManager,
        ActivityResultLauncher<Intent> fileChooserLauncher,
        FilePathCallbackHandler filePathCallbackHandler
    ) {
        this.activity = activity;
        this.progressBar = progressBar;
        this.permissionManager = permissionManager;
        this.fileChooserLauncher = fileChooserLauncher;
        this.filePathCallbackHandler = filePathCallbackHandler;
    }

    @Override
    public void onProgressChanged(WebView view, int newProgress) {
        super.onProgressChanged(view, newProgress);
        if (newProgress < 100) {
            progressBar.setVisibility(View.VISIBLE);
            progressBar.setProgress(newProgress);
        } else {
            progressBar.setVisibility(View.GONE);
        }
    }

    @Override
    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        if (!AppConfig.ENABLE_GEOLOCATION) {
            callback.invoke(origin, false, false);
            return;
        }

        permissionManager.requestPermissions(
            new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            },
            (boolean granted) -> callback.invoke(origin, granted, false)
        );
    }

    @Override
    public void onPermissionRequest(PermissionRequest request) {
        if (request == null) return;
        String[] resources = request.getResources();
        List<String> permissionsToAsk = new ArrayList<>();

        for (String res : resources) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res) && AppConfig.ENABLE_CAMERA) {
                permissionsToAsk.add(Manifest.permission.CAMERA);
            }
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res) && AppConfig.ENABLE_MICROPHONE) {
                permissionsToAsk.add(Manifest.permission.RECORD_AUDIO);
            }
        }

        if (permissionsToAsk.isEmpty()) {
            request.deny();
            return;
        }

        permissionManager.requestPermissions(
            permissionsToAsk.toArray(new String[0]),
            (boolean granted) -> {
                if (granted) {
                    request.grant(resources);
                } else {
                    request.deny();
                }
            }
        );
    }

    @Override
    public boolean onShowFileChooser(
        WebView webView,
        ValueCallback<Uri[]> filePathCallback,
        FileChooserParams fileChooserParams
    ) {
        if (!AppConfig.ENABLE_FILE_UPLOAD) {
            return false;
        }

        filePathCallbackHandler.setCallback(filePathCallback);

        Intent intent = null;
        if (fileChooserParams != null) {
            intent = fileChooserParams.createIntent();
        }
        if (intent == null) {
            intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.setType("*/*");
            intent.addCategory(Intent.CATEGORY_OPENABLE);
        }

        try {
            fileChooserLauncher.launch(intent);
        } catch (ActivityNotFoundException e) {
            filePathCallbackHandler.setCallback(null);
            return false;
        }
        return true;
    }

    @Override
    public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
        new AlertDialog.Builder(activity)
            .setMessage(message)
            .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm())
            .setOnCancelListener(dialog -> result.cancel())
            .show();
        return true;
    }

    @Override
    public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
        new AlertDialog.Builder(activity)
            .setMessage(message)
            .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm())
            .setNegativeButton(android.R.string.cancel, (dialog, which) -> result.cancel())
            .setOnCancelListener(dialog -> result.cancel())
            .show();
        return true;
    }

    @Override
    public void onShowCustomView(View view, CustomViewCallback callback) {
        if (customView != null) {
            onHideCustomView();
            return;
        }
        customView = view;
        customViewCallback = callback;
        originalOrientation = activity.getRequestedOrientation();

        FrameLayout decorView = (FrameLayout) activity.getWindow().getDecorView();
        decorView.addView(
            customView,
            new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        );
    }

    @Override
    public void onHideCustomView() {
        if (customView != null) {
            FrameLayout decorView = (FrameLayout) activity.getWindow().getDecorView();
            decorView.removeView(customView);
            customView = null;
            if (customViewCallback != null) {
                customViewCallback.onCustomViewHidden();
            }
            activity.setRequestedOrientation(originalOrientation);
        }
    }
}
