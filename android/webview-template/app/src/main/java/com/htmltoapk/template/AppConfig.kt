package com.htmltoapk.template

/**
 * Configuration applied dynamically during the APK build process.
 */
object AppConfig {
    const val ENTRY_URL = "https://appassets.androidplatform.net/assets/www/index.html"
    const val FALLBACK_ASSET_URL = "file:///android_asset/www/index.html"
    
    // Feature toggles
    const val ENABLE_JAVASCRIPT = true
    const val ENABLE_DOM_STORAGE = true
    const val ENABLE_DATABASE = true
    const val ENABLE_GEOLOCATION = true
    const val ENABLE_ZOOM = false
    const val ENABLE_FILE_UPLOAD = true
    const val ENABLE_CAMERA = true
    const val ENABLE_MICROPHONE = true
    const val ENABLE_DOWNLOADS = true
    const val ENABLE_PULL_TO_REFRESH = true
    const val ALLOW_EXTERNAL_LINKS = true
    const val OPEN_EXTERNAL_IN_BROWSER = true
    const val OFFLINE_CACHE_ENABLED = true
}

