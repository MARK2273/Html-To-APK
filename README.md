# HTML to Android APK Converter Platform

> **A professional, local developer tool that compiles standard static HTML, CSS, JavaScript, and asset projects into high-performance, native-accelerated Android APK and AAB packages.**

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B%20%7C%20v24%2B-green.svg)](https://nodejs.org/)
[![Java Version](https://img.shields.io/badge/Java-OpenJDK%2017%20%2F%2021-blue.svg)](https://openjdk.org/)
[![Android Target](https://img.shields.io/badge/Android%20API-34%20(Android%2014)-brightgreen.svg)](https://developer.android.com/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

---

## 🌟 Key Capabilities

- 🚀 **Real APK Generation Engine**: Built on Gradle, AndroidX, and Kotlin. Compiles real `.apk` and `.aab` binaries locally without mockups or cloud third-parties.
- 🌐 **Modern WebView Architecture**: Utilizes `WebViewAssetLoader` from `androidx.webkit:webkit:1.11.0` to serve local assets over a secure HTTPS origin (`https://appassets.androidplatform.net/assets/www/`), eliminating `file:///` restrictions and enabling full CORS, ES6 modules, and IndexedDB.
- 📱 **Native Device Hardware Integration**:
  - File Uploads (`<input type="file">` hooked into native document/camera picker)
  - Geolocation (`navigator.geolocation` linked to Android GPS)
  - WebRTC Camera & Microphone (`getUserMedia` with runtime permission prompts)
  - Android `DownloadManager` integration for downloaded files
  - Android Hardware Back navigation (`OnBackPressedDispatcher`)
  - Pull-to-refresh (`SwipeRefreshLayout`)
- 🔒 **Security-First Pipeline**:
  - **Zip Slip protection**: Validates canonical paths against directory traversal.
  - **Zip Bomb prevention**: Strictly caps max uncompressed size, file count, and compression ratios.
  - **Credential masking**: Keystore passwords and sensitive signing arguments are stripped from compiler logs.
  - **Isolated Sandboxes**: Builds run in uniquely generated ephemeral workspaces that auto-clean upon completion.
- ⚡ **Real-Time Streaming Build Pipeline**:
  - Live 8-step build progression (Validating files -> Preparing workspace -> Synchronizing assets -> Configuring manifest -> Applying settings -> Running Gradle -> Signing -> Finalizing).
  - Server-Sent Events (SSE) streaming live compiler stdout and stderr directly to an interactive terminal UI.
- 🖥️ **Live Interactive Device Preview**: Real-time responsive phone (Google Pixel 8, iPhone) and tablet bezels to test navigation, styles, and logic before compiling.
- 📦 **Local SQLite Persistence**: Zero-setup relational project metadata and build history storage using Node 24's built-in `node:sqlite`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React |
| **Backend** | Node.js (v24), Express.js, TypeScript, `node:sqlite` (SQLite3 with WAL mode), AdmZip, SSE |
| **Android** | Kotlin 2.0, AndroidX, `WebViewAssetLoader`, Material Components, ViewBinding |
| **Build System** | Gradle 8.7 Wrapper, Android SDK Command-line Tools, `apksigner` |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20 or v24
- **Java JDK**: OpenJDK 17 or 21 (`JAVA_HOME` set)
- **Android SDK**: API 34 platform & build-tools 34.0.0 (`ANDROID_HOME` set)

*(For detailed Ubuntu/Debian or Windows setup commands, see [docs/INSTALLATION.md](docs/INSTALLATION.md))*

### 2. Install Dependencies
From the repository root:
```bash
npm install
npm --prefix apps/backend install
npm --prefix apps/frontend install
```

### 3. Launch Development Environment
```bash
# Start backend (port 3001) and frontend (port 5173) concurrently:
npm start
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Automated Testing & Verification

Run the full automated test suite:

```bash
# 1. Run unit & security test suite (validation, Zip Slip, SQLite, manifest generator):
npm test

# 2. Run complete end-to-end APK compiler verification:
cd apps/backend
npx tsx ../../tests/e2e-apk-build.test.ts
```

### End-to-End Test Output:
```
===============================================================
STARTING END-TO-END HTML TO ANDROID APK GENERATION VERIFICATION
===============================================================
[1/5] Checking Toolchain Environment...
Java: 21.0.10 (JAVA_HOME: C:\Program Files\Amazon Corretto\jdk21.0.10_7)
Android SDK: D:\Android\sdk
Platforms: android-34
Build Tools: 34.0.0
Ready for build: true

[2/5] Creating Sample Web Project (Interactive Calculator)...
Sample project archived to: storage/temp/calculator-project.zip

[3/5] Initializing Platform Project & Extracting Archive...
Extracted 3 files. Default entry point: index.html

[4/5] Executing Real APK Generation Engine via Gradle...
Build launched with ID: dd5b2805-0bcf-49f7-be41-fba644b10910
[INFO] Gradle build succeeded.
Build ended with status: success

[5/5] Inspecting Generated Android APK Artifact...
APK Output Path: storage/builds/dd5b2805-0bcf-49f7-be41-fba644b10910/output/modern-calculator-debug.apk
APK File Size: 5.46 MB (5721233 bytes)
  ✓ Verified APK entry: AndroidManifest.xml
  ✓ Verified APK entry: classes.dex
  ✓ Verified APK entry: resources.arsc
  ✓ Verified APK entry: assets/www/index.html
  ✓ Verified APK entry: assets/www/style.css
  ✓ Verified APK entry: assets/www/script.js
  ✓ Verified web content integrity inside APK package.

===============================================================
SUCCESS: REAL ANDROID APK SUCCESSFULLY GENERATED & VERIFIED!
===============================================================
```

---

## 📖 Documentation Directory

- **[Installation Guide](docs/INSTALLATION.md)**: Ubuntu Linux and Windows instructions, dependencies, and environment variable configuration.
- **[System Architecture](docs/ARCHITECTURE.md)**: Deep dive into the monorepo structure, `WebViewAssetLoader`, security guards, and database schema.
- **[Build & Packaging Guide](docs/BUILD_GUIDE.md)**: Step-by-step instructions for converting web apps, configuring permissions, and signing release APKs.

---

## 🔒 Security Highlights

- **Zip Slip Guard**: Canonical path checks prevent file writes outside project source boundaries.
- **Zip Bomb Guard**: File count, uncompressed byte sizes, and compression ratios are enforced before extraction.
- **No Remote JavaScript Execution**: Uploaded scripts are strictly packaged into the APK and never executed in the backend runtime.
- **Isolated Android Origins**: Uses `appassets.androidplatform.net` to provide a secure context with modern browser security boundaries.

