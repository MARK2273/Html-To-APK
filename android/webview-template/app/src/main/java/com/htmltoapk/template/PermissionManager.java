package com.htmltoapk.template;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class PermissionManager {
    public interface PermissionCallback {
        void onResult(boolean allGranted);
    }

    private final AppCompatActivity activity;
    private PermissionCallback callback;
    private final ActivityResultLauncher<String[]> permissionLauncher;

    public PermissionManager(AppCompatActivity activity) {
        this.activity = activity;
        this.permissionLauncher = activity.registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(),
            (Map<String, Boolean> result) -> {
                boolean allGranted = true;
                for (Boolean granted : result.values()) {
                    if (granted == null || !granted) {
                        allGranted = false;
                        break;
                    }
                }
                if (callback != null) {
                    callback.onResult(allGranted);
                    callback = null;
                }
            }
        );
    }

    public boolean hasCameraPermission() {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    public boolean hasRecordAudioPermission() {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    public boolean hasLocationPermission() {
        boolean fine = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarse = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        return fine || coarse;
    }

    public void requestPermissions(String[] permissions, PermissionCallback callback) {
        List<String> ungranted = new ArrayList<>();
        for (String perm : permissions) {
            if (ContextCompat.checkSelfPermission(activity, perm) != PackageManager.PERMISSION_GRANTED) {
                ungranted.add(perm);
            }
        }
        if (ungranted.isEmpty()) {
            callback.onResult(true);
        } else {
            this.callback = callback;
            this.permissionLauncher.launch(ungranted.toArray(new String[0]));
        }
    }
}
