import { ProjectPermissions } from '../types/index.js';

export interface ManifestOptions {
  packageName: string;
  appName: string;
  orientation: 'portrait' | 'landscape' | 'unspecified';
  permissions: ProjectPermissions;
  allowExternalLinks?: boolean;
}

export class ManifestGenerator {
  static generate(options: ManifestOptions): string {
    const { permissions, orientation } = options;

    const usesPermissions: string[] = [];
    const usesFeatures: string[] = [];

    // Always include Internet & Network state
    if (permissions.internet !== false) {
      usesPermissions.push('android.permission.INTERNET');
      usesPermissions.push('android.permission.ACCESS_NETWORK_STATE');
    }

    // Camera
    if (permissions.camera) {
      usesPermissions.push('android.permission.CAMERA');
      usesFeatures.push('<uses-feature android:name="android.hardware.camera" android:required="false" />');
      usesFeatures.push('<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />');
    }

    // Microphone / Audio
    if (permissions.microphone) {
      usesPermissions.push('android.permission.RECORD_AUDIO');
      usesPermissions.push('android.permission.MODIFY_AUDIO_SETTINGS');
      usesFeatures.push('<uses-feature android:name="android.hardware.microphone" android:required="false" />');
    }

    // Location
    if (permissions.fineLocation || permissions.location) {
      usesPermissions.push('android.permission.ACCESS_FINE_LOCATION');
    }
    if (permissions.coarseLocation || permissions.location) {
      usesPermissions.push('android.permission.ACCESS_COARSE_LOCATION');
    }
    if (permissions.location || permissions.fineLocation || permissions.coarseLocation) {
      usesFeatures.push('<uses-feature android:name="android.hardware.location" android:required="false" />');
      usesFeatures.push('<uses-feature android:name="android.hardware.location.gps" android:required="false" />');
    }

    // Storage / File Access
    if (permissions.fileAccess) {
      usesPermissions.push('android.permission.READ_EXTERNAL_STORAGE');
      usesPermissions.push('android.permission.WRITE_EXTERNAL_STORAGE');
      usesPermissions.push('android.permission.READ_MEDIA_IMAGES');
      usesPermissions.push('android.permission.READ_MEDIA_VIDEO');
      usesPermissions.push('android.permission.READ_MEDIA_AUDIO');
    }

    // Notifications
    if (permissions.notifications) {
      usesPermissions.push('android.permission.POST_NOTIFICATIONS');
    }

    // Vibration
    if (permissions.vibration) {
      usesPermissions.push('android.permission.VIBRATE');
    }

    // Deduplicate permissions
    const uniquePermissions = Array.from(new Set(usesPermissions));

    const permissionTags = uniquePermissions
      .map(p => `    <uses-permission android:name="${p}" />`)
      .join('\n');

    const featureTags = usesFeatures.join('\n    ');

    const orientationAttr = orientation === 'portrait'
      ? 'android:screenOrientation="portrait"'
      : orientation === 'landscape'
        ? 'android:screenOrientation="landscape"'
        : 'android:screenOrientation="unspecified"';

    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

${permissionTags}

    ${featureTags}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.HtmlToApkApp"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout"
            android:exported="true"
            ${orientationAttr}>
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`;
  }
}

