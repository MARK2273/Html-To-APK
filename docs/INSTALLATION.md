# Installation & Environment Setup Guide

This guide covers complete setup instructions for running the **HTML to Android APK Converter** locally on **Linux (Ubuntu/Debian)** and **Windows**.

---

## System Requirements

- **Node.js**: v20+ or v24+
- **Java JDK**: OpenJDK 17 or 21
- **Android SDK**: API 34 Platform and Build-Tools 34.0.0
- **Storage**: At least 4 GB free disk space for Android SDK components and build caches

---

## 1. Ubuntu / Debian Linux Setup

### Step 1.1: Install Node.js & Core Utilities

```bash
# Update package repositories
sudo apt update && sudo apt upgrade -y

# Install Java 17 OpenJDK, unzip, curl, and build essentials
sudo apt install -y openjdk-17-jdk unzip curl git build-essential

# Verify Java
java -version
```

If Node.js is not installed:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### Step 1.2: Install Android SDK Command-line Tools

```bash
# Create Android SDK directory
mkdir -p ~/Android/Sdk/cmdline-tools

# Download official Android Command Line Tools
cd /tmp
curl -L -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip

# Extract to ~/Android/Sdk/cmdline-tools/latest
unzip -q cmdline-tools.zip -d ~/Android/Sdk/cmdline-tools
mv ~/Android/Sdk/cmdline-tools/cmdline-tools ~/Android/Sdk/cmdline-tools/latest
rm cmdline-tools.zip
```

### Step 1.3: Configure Environment Variables

Add the following to your `~/.bashrc` (or `~/.zshrc`):

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

Apply the changes:
```bash
source ~/.bashrc
```

### Step 1.4: Accept Licenses and Install SDK Platforms

```bash
# Accept all Android SDK licenses
yes | sdkmanager --licenses

# Install platform-tools, platform 34, and build-tools 34.0.0
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

---

## 2. Windows Setup

### Step 2.1: Install Java JDK
Download and install OpenJDK 17 or 21 from [Amazon Corretto](https://aws.amazon.com/corretto/) or [Eclipse Temurin](https://adoptium.net/).
Ensure `JAVA_HOME` is set to your JDK path (e.g. `C:\Program Files\Amazon Corretto\jdk21.0.10_7`).

### Step 2.2: Install Android SDK
You can install via Android Studio (default location: `%LOCALAPPDATA%\Android\Sdk`), or via command-line tools:
1. Download `commandlinetools-win-11076708_latest.zip` from Google.
2. Unpack to `D:\Android\sdk\cmdline-tools\latest`.
3. Set environment variable `ANDROID_HOME` to `D:\Android\sdk`.
4. Run:
```powershell
& "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="$env:ANDROID_HOME" --licenses
& "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="$env:ANDROID_HOME" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

---

## 3. Project Installation & Execution

From the project root:

```bash
# 1. Install root & backend dependencies
npm install
cd apps/backend && npm install
cd ../frontend && npm install
cd ../..

# 2. Run backend & frontend concurrently
npm start
```

Or run each service individually:

```bash
# Terminal 1 - Backend (port 3001)
npm run start:backend

# Terminal 2 - Frontend (port 5173)
npm run start:frontend
```

Open your browser at `http://localhost:5173`.
Navigate to **Environment Setup** to verify that your Java JDK and Android SDK are detected with green checkmarks!

