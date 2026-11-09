import React from 'react';
import { Settings, Shield, HardDrive } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-stone-700" />
          <span>Platform Settings</span>
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Review local storage locations, keystore configurations, and studio parameters.
        </p>
      </div>

      <div className="space-y-4">
        {/* Storage Paths */}
        <div className="bg-white border border-stone-200/70 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <HardDrive className="w-4 h-4 text-stone-600" />
            <h3 className="font-semibold text-sm text-stone-900">Storage Volumes</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
              <div>
                <span className="font-medium text-stone-900 block">Projects & Source Web Files</span>
                <span className="text-[11px] font-mono text-stone-500">storage/projects/:projectId/source</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-stone-200/70 text-stone-700 font-medium">
                Writable
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
              <div>
                <span className="font-medium text-stone-900 block">Compiled APK Output Storage</span>
                <span className="text-[11px] font-mono text-stone-500">storage/builds/:buildId/output/</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
                Permanent
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
              <div>
                <span className="font-medium text-stone-900 block">Isolated Fast Assembly Workspaces</span>
                <span className="text-[11px] font-mono text-stone-500">storage/temp/fastpack-:buildId/</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-stone-200/70 text-stone-700 font-medium">
                Auto-Purged
              </span>
            </div>
          </div>
        </div>

        {/* Keystore & Release Signing */}
        <div className="bg-white border border-stone-200/70 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Shield className="w-4 h-4 text-stone-600" />
            <h3 className="font-semibold text-sm text-stone-900">Release Signing Credentials</h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            By default, debug builds are signed automatically using standard Android debug keys. For Google Play release packages, you can provide an Android .keystore or .jks file with alias credentials.
          </p>
          <div className="p-4 rounded-2xl bg-stone-900 text-stone-300 text-xs font-mono shadow-inner overflow-x-auto">
            keytool -genkey -v -keystore release.keystore -alias appkey -keyalg RSA -keysize 2048 -validity 10000
          </div>
        </div>
      </div>
    </div>
  );
};
