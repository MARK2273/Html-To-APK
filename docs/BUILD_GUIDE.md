# Comprehensive Website to Android APK Build Guide

This guide walks you through converting any standard HTML, CSS, and JavaScript website into an installable Android APK or Google Play App Bundle (.aab).

---

## 1. Web Project Preparation Best Practices

### Directory Layout
Keep all project files organized relative to `index.html`:

```
my-web-project/
├── index.html              <-- Main Entry Point (Detected automatically)
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── assets/
    ├── logo.png
    └── icons/
```

### Relative vs Absolute Paths
- **Always use relative paths** for assets and scripts:
  - Good: `<link rel="stylesheet" href="css/styles.css">`
  - Good: `<script src="./js/app.js"></script>`
  - Good: `<img src="assets/logo.png">`
  - Avoid: `<script src="/js/app.js"></script>` (root-slashed paths can break local subdirectory nesting).

### Viewport Configuration
Always include a mobile viewport tag in `<head>`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

---

## 2. Using the 5-Step Platform Wizard

### Step 1: Upload Website
1. Drag and drop your `.zip` archive or select individual HTML/CSS/JS files.
2. The platform validates against Zip Slip directory traversal attacks and extracts files to `storage/projects/:id/source/`.
3. If multiple `.html` files exist (e.g., `index.html`, `login.html`), choose your desired start screen from the Entry Point dropdown.

### Step 2: Application Configuration
- **Application Name**: Name shown under the launcher icon on Android home screens.
- **Package Name**: Reverse domain notation (e.g. `com.company.mygame`). Must contain at least two segments and cannot use Java keywords.
- **Version Name & Code**: e.g., `1.0.0` with Version Code `1`. Increment for updates.
- **Orientation**: Lock to `Portrait`, `Landscape` (great for games), or `Auto/Sensor`.
- **Icon**: Upload a 512×512 PNG square image. The platform automatically generates mipmap densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).

### Step 3: Permissions Configuration
Select only the permissions your application actually uses:
- **Internet**: Default for remote API calls and external links.
- **Camera / Microphone**: Adds permissions and wires WebRTC `onPermissionRequest` in `WebChromeClient`.
- **Geolocation**: Hooks `navigator.geolocation` to Android Location Services.
- **File Access**: Required if your app uploads or saves local photos/documents.
- **Notifications**: Required on Android 13+ (API 33+) for web push alerts.

### Step 4: WebView Engine Settings
- **JavaScript Execution**: Enabled by default.
- **DOM & Local Storage**: Enables `localStorage`, `sessionStorage`, and `IndexedDB`.
- **File Upload**: Wires native document picker to `<input type="file">`.
- **Fullscreen**: Expands HTML5 video to immersive mode on orientation change.
- **Download Support**: Intercepts downloadable links and queues them via Android `DownloadManager`.
- **External Links**: Out-of-domain links launch in the default device browser (Chrome).
- **Offline Mode**: Local assets are served through `https://appassets.androidplatform.net/assets/www/` with HTTPS CORS origin support.

### Step 5: Live Preview & Build
1. Interact with your live website in the simulated Google Pixel 8 / Tablet mobile frame.
2. Choose **Debug APK** for testing or **Release APK / AAB** for production.
3. Click **Build Android APK**.
4. Watch real-time compilation steps and compiler logs in the streaming terminal modal.
5. Click **Download APK** upon completion.

---

## 3. Installing the APK on an Android Device

### Option A: Direct Download via Phone Browser
1. Connect your phone to the same local network, or copy the downloaded `.apk` to your phone via Google Drive, Telegram, or USB.
2. Tap the `.apk` file on your phone.
3. When prompted, toggle "Allow from this source" in Android Settings.
4. Tap **Install** and launch your new application!

### Option B: Install via ADB Command Line
If your Android phone has USB Debugging enabled:
```bash
adb install dist/my-calculator-debug.apk
```

