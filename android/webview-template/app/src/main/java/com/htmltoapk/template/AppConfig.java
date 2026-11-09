package com.htmltoapk.template;

import android.content.Context;
import org.json.JSONObject;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class AppConfig {
    public static String APP_NAME = "HTML App";
    public static String ORIENTATION = "unspecified";
    public static String ENTRY_URL = "https://appassets.androidplatform.net/assets/www/index.html";
    public static String FALLBACK_ASSET_URL = "file:///android_asset/www/index.html";

    public static boolean ENABLE_JAVASCRIPT = true;
    public static boolean ENABLE_DOM_STORAGE = true;
    public static boolean ENABLE_DATABASE = true;
    public static boolean ENABLE_GEOLOCATION = true;
    public static boolean ENABLE_ZOOM = false;
    public static boolean ENABLE_FILE_UPLOAD = true;
    public static boolean ENABLE_CAMERA = true;
    public static boolean ENABLE_MICROPHONE = true;
    public static boolean ENABLE_DOWNLOADS = true;
    public static boolean ENABLE_PULL_TO_REFRESH = true;
    public static boolean ALLOW_EXTERNAL_LINKS = true;
    public static boolean OPEN_EXTERNAL_IN_BROWSER = true;
    public static boolean OFFLINE_CACHE_ENABLED = true;

    private static boolean initialized = false;

    private AppConfig() {}

    public static synchronized void init(Context context) {
        if (initialized) return;
        try {
            InputStream is = context.getAssets().open("app-config.json");
            byte[] buffer = new byte[is.available()];
            int bytesRead = is.read(buffer);
            is.close();
            if (bytesRead > 0) {
                String jsonStr = new String(buffer, 0, bytesRead, StandardCharsets.UTF_8);
                JSONObject obj = new JSONObject(jsonStr);

                if (obj.has("appName")) {
                    APP_NAME = obj.getString("appName");
                }
                if (obj.has("orientation")) {
                    ORIENTATION = obj.getString("orientation");
                }
                if (obj.has("entryPoint")) {
                    String entry = obj.getString("entryPoint");
                    if (entry.startsWith("http://") || entry.startsWith("https://")) {
                        ENTRY_URL = entry;
                        FALLBACK_ASSET_URL = entry;
                    } else {
                        String clean = entry.startsWith("/") ? entry.substring(1) : entry;
                        ENTRY_URL = "https://appassets.androidplatform.net/assets/www/" + clean;
                        FALLBACK_ASSET_URL = "file:///android_asset/www/" + clean;
                    }
                }
                if (obj.has("enableJavaScript")) ENABLE_JAVASCRIPT = obj.getBoolean("enableJavaScript");
                if (obj.has("enableDomStorage")) ENABLE_DOM_STORAGE = obj.getBoolean("enableDomStorage");
                if (obj.has("enableDatabase")) ENABLE_DATABASE = obj.getBoolean("enableDatabase");
                if (obj.has("enableGeolocation")) ENABLE_GEOLOCATION = obj.getBoolean("enableGeolocation");
                if (obj.has("enableZoom")) ENABLE_ZOOM = obj.getBoolean("enableZoom");
                if (obj.has("enableFileUpload")) ENABLE_FILE_UPLOAD = obj.getBoolean("enableFileUpload");
                if (obj.has("enableCamera")) ENABLE_CAMERA = obj.getBoolean("enableCamera");
                if (obj.has("enableMicrophone")) ENABLE_MICROPHONE = obj.getBoolean("enableMicrophone");
                if (obj.has("enableDownloads")) ENABLE_DOWNLOADS = obj.getBoolean("enableDownloads");
                if (obj.has("enablePullToRefresh")) ENABLE_PULL_TO_REFRESH = obj.getBoolean("enablePullToRefresh");
                if (obj.has("allowExternalLinks")) ALLOW_EXTERNAL_LINKS = obj.getBoolean("allowExternalLinks");
                if (obj.has("openExternalInBrowser")) OPEN_EXTERNAL_IN_BROWSER = obj.getBoolean("openExternalInBrowser");
                if (obj.has("offlineCacheEnabled")) OFFLINE_CACHE_ENABLED = obj.getBoolean("offlineCacheEnabled");
            }
        } catch (Exception ignored) {
            // Uses default values if app-config.json is absent
        }
        initialized = true;
    }
}
