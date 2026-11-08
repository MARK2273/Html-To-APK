# Architecture & System Design

The **HTML to Android APK Converter** is an industrial-grade developer platform that compiles standard static HTML, CSS, JavaScript, and assets into production-ready Android APK packages locally without requiring Android Studio.

---

## 1. High-Level System Architecture

```
                                      +-------------------------------+
                                      |         React 19 UI           |
                                      |   Vite + Tailwind CSS v4      |
                                      +---------------+---------------+
                                                      |
                                                      | REST APIs & SSE Stream
                                                      v
                                      +-------------------------------+
                                      |     Node.js / Express API     |
                                      |      TypeScript Backend       |
                                      +---------------+---------------+
                                                      |
                    +---------------------------------+---------------------------------+
                    |                                 |                                 |
                    v                                 v                                 v
          +-------------------+             +-------------------+             +-------------------+
          |  Project Service  |             |    Zip Service    |             |   Build Engine    |
          |  SQLite Database  |             | Zip Slip & Bomb   |             |  Gradle Runner &  |
          |  (node:sqlite)    |             |    Protections    |             | Template Pipeline |
          +-------------------+             +-------------------+             +---------+---------+
                                                                                        |
                                                                                        v
                                                                              +-------------------+
                                                                              | Android Template  |
                                                                              | WebViewAssetLoader|
                                                                              |  AndroidX + Kotlin|
                                                                              +---------+---------+
                                                                                        |
                                                                                        v
                                                                              +-------------------+
                                                                              |  Generated APK    |
                                                                              | storage/builds/   |
                                                                              +-------------------+
```

---

## 2. Directory Structure

```
html-to-apk/
├── apps/
│   ├── frontend/                       # React 19 Client Dashboard
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── build/              # Real-time build modal & logs
│   │   │   │   ├── common/             # Navbar, Sidebar, Theme
│   │   │   │   ├── preview/            # Interactive Mobile Device Frame
│   │   │   │   └── wizard/             # 5-step conversion wizard
│   │   │   ├── pages/                  # Dashboard, Projects, History, Env
│   │   │   ├── services/               # REST API client
│   │   │   └── types/                  # Shared TypeScript interfaces
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── backend/                        # Express.js REST API & Engine
│       ├── src/
│       │   ├── controllers/            # Project, Build, System APIs
│       │   ├── database/               # SQLite schema (node:sqlite)
│       │   ├── middleware/             # Multer upload & error handling
│       │   ├── routes/                 # Express route definitions
│       │   ├── services/
│       │   │   ├── buildEngine.ts      # 8-step build orchestrator
│       │   │   ├── environmentService.ts # Android SDK & Java detector
│       │   │   ├── gradleService.ts    # Child process runner with SSE
│       │   │   ├── manifestGenerator.ts# Dynamic AndroidManifest generator
│       │   │   ├── projectService.ts   # Project CRUD & file manager
│       │   │   ├── signingService.ts   # apksigner release signing
│       │   │   ├── templateService.ts  # Workspace cloning & injection
│       │   │   └── zipService.ts       # Secure zip extractor
│       │   └── utils/
│       │       └── security.ts         # Zip Slip & package regex guards
│       ├── package.json
│       └── tsconfig.json
│
├── android/
│   └── webview-template/               # Reusable Android Studio Project
│       ├── app/
│       │   ├── src/main/
│       │   │   ├── java/com/htmltoapk/template/
│       │   │   │   ├── MainActivity.kt
│       │   │   │   ├── AppWebViewClient.kt
│       │   │   │   ├── AppWebChromeClient.kt
│       │   │   │   ├── PermissionManager.kt
│       │   │   │   └── AppConfig.kt
│       │   │   ├── res/                # XML layouts, mipmaps, colors
│       │   │   ├── assets/www/         # Target web files injection point
│       │   │   └── AndroidManifest.xml
│       │   └── build.gradle.kts
│       ├── gradle/wrapper/             # Gradle 8.7 Wrapper
│       ├── build.gradle.kts
│       └── settings.gradle.kts
│
├── storage/                            # Persistent Local Storage
│   ├── projects/                       # User website source files
│   ├── builds/                         # Generated APK & AAB artifacts
│   ├── temp/                           # Ephemeral isolated build folders
│   └── database.sqlite                 # SQLite persistence database
│
├── docs/                               # Documentation
│   ├── INSTALLATION.md
│   ├── ARCHITECTURE.md
│   └── BUILD_GUIDE.md
│
├── tests/                              # Automated test suites
│   └── e2e-apk-build.test.ts
│
├── package.json                        # Root monorepo workspace
└── README.md
```

---

## 3. Android WebViewAssetLoader Security Architecture

Rather than loading web files through the insecure and restricted `file:///android_asset/` protocol (which causes strict CORS errors, breaks Web Workers, and disables modern Storage APIs), the template uses **`WebViewAssetLoader`** from AndroidX Webkit:

1. Assets placed in `app/src/main/assets/www/` are mapped dynamically to:
   ```
   https://appassets.androidplatform.net/assets/www/index.html
   ```
2. Modern web features (ES6 modules, `fetch()`, `localStorage`, `IndexedDB`, Canvas, CSS variables) function seamlessly within a secure origin.
3. Out-of-domain hyperlinks are intercepted and routed to the native system browser to protect the local HTTPS application origin.

---

## 4. Security Defenses

- **Zip Slip Protection**: `isSafePath()` verifies that extracted relative paths strictly resolve within the project destination directory.
- **Zip Bomb Mitigation**: Limits maximum uncompressed archive size to 250 MB, maximum files to 3,000, and checks compression ratios.
- **Package Name Sanitization**: Strict regular expression validation (`^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$`) and reserved Java keyword rejections.
- **Credential Masking**: Keystore passwords and private signing tokens are stripped from compiler logs.
- **Isolated Build Sandboxes**: Every build is executed in a uniquely named ephemeral workspace (`storage/temp/build-:id/`), safely deleted upon completion.

