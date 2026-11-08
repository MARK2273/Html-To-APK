package com.htmltoapk.template

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.view.View
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

class AppWebViewClient(
    private val activity: AppCompatActivity,
    private val errorLayout: View,
    private val onPageFinishedCallback: () -> Unit
) : WebViewClient() {

    private val assetLoader = WebViewAssetLoader.Builder()
        .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(activity))
        .build()

    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        val url = request.url
        // Intercept assets mapped under appassets.androidplatform.net
        if (url.host == "appassets.androidplatform.net") {
            val response = assetLoader.shouldInterceptRequest(url)
            if (response != null) {
                return response
            }
        }
        return super.shouldInterceptRequest(view, request)
    }

    override fun shouldOverrideUrlLoading(
        view: WebView,
        request: WebResourceRequest
    ): Boolean {
        val url = request.url.toString()
        val uri = request.url

        // Allow app assets and local navigation
        if (uri.host == "appassets.androidplatform.net" || url.startsWith("file:///android_asset/")) {
            return false
        }

        // Handle custom URL schemes (mailto, tel, sms, intent, geo)
        val scheme = uri.scheme?.lowercase()
        if (scheme != "http" && scheme != "https" && scheme != null) {
            return try {
                val intent = Intent(Intent.ACTION_VIEW, uri)
                activity.startActivity(intent)
                true
            } catch (e: Exception) {
                true
            }
        }

        // Handle external web links
        if (AppConfig.ALLOW_EXTERNAL_LINKS) {
            if (AppConfig.OPEN_EXTERNAL_IN_BROWSER) {
                return try {
                    val intent = Intent(Intent.ACTION_VIEW, uri)
                    activity.startActivity(intent)
                    true
                } catch (e: Exception) {
                    false
                }
            } else {
                return false
            }
        }

        return true
    }

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        errorLayout.visibility = View.GONE
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        onPageFinishedCallback()
    }

    override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: WebResourceError?
    ) {
        super.onReceivedError(view, request, error)
        if (request?.isForMainFrame == true) {
            errorLayout.visibility = View.VISIBLE
        }
    }
}

