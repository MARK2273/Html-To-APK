FROM eclipse-temurin:17-jdk-jammy

# Avoid prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# 1. Install required system packages and Node.js 22
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    wget \
    build-essential \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 2. Setup Android SDK Command-line Tools
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/build-tools/34.0.0

RUN mkdir -p ${ANDROID_HOME}/cmdline-tools \
    && wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip \
    && unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools \
    && mv /tmp/cmdline-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest \
    && rm -rf /tmp/cmdline-tools*

# 3. Accept Android SDK licenses & install API 34 + Build Tools
RUN yes | sdkmanager --licenses \
    && sdkmanager "platforms;android-34" "build-tools;34.0.0"

# 4. App Directory
WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

RUN npm install

# Copy source code, native shims, and Android template
COPY . .

# Compile native socket filter shim to protect Gradle IPC from cloud port detectors
RUN gcc -O2 -shared -fPIC native/libgradle_shim.c -o /opt/libgradle_shim.so -ldl

# Normalize line endings for gradlew and make it executable
RUN sed -i 's/\r$//' android/webview-template/gradlew && chmod +x android/webview-template/gradlew

# Build Backend TypeScript
RUN npm --prefix apps/backend run build

# Default environment configuration
ENV PORT=10000
ENV NODE_ENV=production
EXPOSE 10000

# Start Backend Server
CMD ["node", "apps/backend/dist/index.js"]
