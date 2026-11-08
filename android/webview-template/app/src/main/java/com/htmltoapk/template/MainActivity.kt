package com.htmltoapk.template

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.webkit.CookieManager
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var errorLayout: View
    private lateinit var btnRetry: Button
    private lateinit var permissionManager: PermissionManager
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val data: Intent? = result.data
            val uris: Array<Uri>? = when {
                data?.clipData != null -> {
                    val count = data.clipData!!.itemCount
                    val list = mutableListOf<Uri>()
                    for (i in 0 until count) {
                        data.clipData!!.getItemAt(i).uri?.let { list.add(it) }
                    }
                    list.toTypedArray()
                }
                data?.data != null -> arrayOf(data.data!!)
                else -> null
            }
            filePathCallback?.onReceiveValue(uris)
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        progressBar = findViewById(R.id.progressBar)
        errorLayout = findViewById(R.id.errorLayout)
        btnRetry = findViewById(R.id.btnRetry)

        permissionManager = PermissionManager(this)
        setupWebView()
        setupSwipeRefresh()
        setupErrorLayout()
        setupBackNavigation()

        loadHomePage()
    }

    private fun setupWebView() {
        val settings = webView.settings

        // JavaScript & DOM Storage
        settings.javaScriptEnabled = AppConfig.ENABLE_JAVASCRIPT
        settings.domStorageEnabled = AppConfig.ENABLE_DOM_STORAGE
        settings.databaseEnabled = AppConfig.ENABLE_DATABASE

        // Zoom controls
        settings.setSupportZoom(AppConfig.ENABLE_ZOOM)
        settings.builtInZoomControls = AppConfig.ENABLE_ZOOM
        settings.displayZoomControls = false

        // Geolocation
        settings.setGeolocationEnabled(AppConfig.ENABLE_GEOLOCATION)

        // File access for local assets
        settings.allowFileAccess = true
        settings.allowContentAccess = true

        // Offline and Caching
        if (AppConfig.OFFLINE_CACHE_ENABLED) {
            settings.cacheMode = WebSettings.LOAD_DEFAULT
        } else {
            settings.cacheMode = WebSettings.LOAD_NO_CACHE
        }

        // Viewport and responsiveness
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // Media playback without user gesture
        settings.mediaPlaybackRequiresUserGesture = false

        // Cookie Manager
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        // Web Clients
        webView.webViewClient = AppWebViewClient(
            activity = this,
            errorLayout = errorLayout,
            onPageFinishedCallback = {
                swipeRefreshLayout.isRefreshing = false
            }
        )

        webView.webChromeClient = AppWebChromeClient(
            activity = this,
            progressBar = progressBar,
            permissionManager = permissionManager,
            fileChooserLauncher = fileChooserLauncher,
            onFilePathCallbackSet = { callback ->
                filePathCallback = callback
            }
        )

        // Download support
        if (AppConfig.ENABLE_DOWNLOADS) {
            webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
                try {
                    val request = DownloadManager.Request(Uri.parse(url)).apply {
                        setMimeType(mimetype)
                        addRequestHeader("User-Agent", userAgent)
                        setDescription("Downloading file...")
                        setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype))
                        setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                        setDestinationInExternalPublicDir(
                            Environment.DIRECTORY_DOWNLOADS,
                            URLUtil.guessFileName(url, contentDisposition, mimetype)
                        )
                    }
                    val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                    dm.enqueue(request)
                    Toast.makeText(this, "Download started...", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    Toast.makeText(this, "Download failed: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefreshLayout.isEnabled = AppConfig.ENABLE_PULL_TO_REFRESH
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }
    }

    private fun setupErrorLayout() {
        btnRetry.setOnClickListener {
            errorLayout.visibility = View.GONE
            webView.reload()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun loadHomePage() {
        webView.loadUrl(AppConfig.ENTRY_URL)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
