package com.htmltoapk.template

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.view.View
import android.view.ViewGroup
import android.webkit.GeolocationPermissions
import android.webkit.JsResult
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.activity.result.ActivityResultLauncher
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class AppWebChromeClient(
    private val activity: AppCompatActivity,
    private val progressBar: ProgressBar,
    private val permissionManager: PermissionManager,
    private val fileChooserLauncher: ActivityResultLauncher<Intent>,
    private val onFilePathCallbackSet: (ValueCallback<Array<Uri>>?) -> Unit
) : WebChromeClient() {

    private var customView: View? = null
    private var customViewCallback: CustomViewCallback? = null
    private var originalOrientation: Int = 0

    override fun onProgressChanged(view: WebView?, newProgress: Int) {
        super.onProgressChanged(view, newProgress)
        if (newProgress < 100) {
            progressBar.visibility = View.VISIBLE
            progressBar.progress = newProgress
        } else {
            progressBar.visibility = View.GONE
        }
    }

    override fun onGeolocationPermissionsShowPrompt(
        origin: String?,
        callback: GeolocationPermissions.Callback?
    ) {
        if (!AppConfig.ENABLE_GEOLOCATION) {
            callback?.invoke(origin, false, false)
            return
        }

        permissionManager.requestPermissions(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
        ) { granted ->
            callback?.invoke(origin, granted, false)
        }
    }

    override fun onPermissionRequest(request: PermissionRequest?) {
        if (request == null) return
        val requestedResources = request.resources
        val permissionsToAsk = mutableListOf<String>()

        for (res in requestedResources) {
            if (res == PermissionRequest.RESOURCE_VIDEO_CAPTURE && AppConfig.ENABLE_CAMERA) {
                permissionsToAsk.add(Manifest.permission.CAMERA)
            }
            if (res == PermissionRequest.RESOURCE_AUDIO_CAPTURE && AppConfig.ENABLE_MICROPHONE) {
                permissionsToAsk.add(Manifest.permission.RECORD_AUDIO)
            }
        }

        if (permissionsToAsk.isEmpty()) {
            request.deny()
            return
        }

        permissionManager.requestPermissions(permissionsToAsk.toTypedArray()) { granted ->
            if (granted) {
                request.grant(requestedResources)
            } else {
                request.deny()
            }
        }
    }

    override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?
    ): Boolean {
        if (!AppConfig.ENABLE_FILE_UPLOAD) {
            return false
        }

        onFilePathCallbackSet(filePathCallback)

        val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "*/*"
            addCategory(Intent.CATEGORY_OPENABLE)
        }

        try {
            fileChooserLauncher.launch(intent)
        } catch (e: ActivityNotFoundException) {
            onFilePathCallbackSet(null)
            return false
        }
        return true
    }

    override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
        AlertDialog.Builder(activity)
            .setMessage(message)
            .setPositiveButton(android.R.string.ok) { _, _ -> result?.confirm() }
            .setOnCancelListener { result?.cancel() }
            .show()
        return true
    }

    override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
        AlertDialog.Builder(activity)
            .setMessage(message)
            .setPositiveButton(android.R.string.ok) { _, _ -> result?.confirm() }
            .setNegativeButton(android.R.string.cancel) { _, _ -> result?.cancel() }
            .setOnCancelListener { result?.cancel() }
            .show()
        return true
    }

    override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
        if (customView != null) {
            onHideCustomView()
            return
        }
        customView = view
        customViewCallback = callback
        originalOrientation = activity.requestedOrientation

        val decorView = activity.window.decorView as FrameLayout
        decorView.addView(
            customView,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
    }

    override fun onHideCustomView() {
        val decorView = activity.window.decorView as FrameLayout
        decorView.removeView(customView)
        customView = null
        customViewCallback?.onCustomViewHidden()
        activity.requestedOrientation = originalOrientation
    }
}

