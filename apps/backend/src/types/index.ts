export interface Project {
  id: string;
  name: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  description: string;
  minSdk: number;
  targetSdk: number;
  orientation: 'portrait' | 'landscape' | 'unspecified';
  permissions: ProjectPermissions;
  webviewConfig: WebViewConfig;
  entryPoint: string;
  iconPath?: string;
  splashPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPermissions {
  internet: boolean;
  camera: boolean;
  microphone: boolean;
  location: boolean;
  fineLocation: boolean;
  coarseLocation: boolean;
  fileAccess: boolean;
  notifications: boolean;
  vibration: boolean;
}

export interface WebViewConfig {
  enableJavaScript: boolean;
  enableDomStorage: boolean;
  enableLocalStorage: boolean;
  enableFileUpload: boolean;
  enableCameraAccess: boolean;
  enableMicrophoneAccess: boolean;
  enableGeolocation: boolean;
  enableZoom: boolean;
  enableFullscreen: boolean;
  enableDownloadSupport: boolean;
  enableExternalLinks: boolean;
  enableOfflineMode: boolean;
}

export type BuildStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
export type BuildType = 'debug' | 'release';

export interface BuildRecord {
  id: string;
  projectId: string;
  buildType: BuildType;
  status: BuildStatus;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  apkPath?: string;
  apkSize?: number;
  aabPath?: string;
  logs: string;
  errorMessage?: string;
  configSnapshot?: string;
}

export interface BuildProgressEvent {
  buildId: string;
  stage: string;
  stepIndex: number;
  totalSteps: number;
  status: BuildStatus;
  log?: string;
  progressPercent: number;
  durationMs?: number;
  apkUrl?: string;
  error?: string;
}

export interface EnvironmentStatus {
  isReady: boolean;
  os: {
    platform: string;
    type: string;
    release: string;
  };
  java: {
    installed: boolean;
    version?: string;
    javaHome?: string;
    valid: boolean;
  };
  androidSdk: {
    installed: boolean;
    sdkPath?: string;
    platforms: string[];
    buildTools: string[];
    valid: boolean;
  };
  gradle: {
    installed: boolean;
    version?: string;
    wrapperAvailable: boolean;
  };
  issues: string[];
  suggestions: string[];
}

