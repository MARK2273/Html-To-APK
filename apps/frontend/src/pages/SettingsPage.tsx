import React from 'react';
import { Settings, Shield, HardDrive } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <span>Platform Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure local storage paths, release signing credentials, and default compiler parameters.
        </p>
      </div>

      <div className="space-y-4">
        {/* Storage Paths */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-slate-100">Local Storage Volumes</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Projects & Source Web Files</span>
                <span className="text-[11px] font-mono text-slate-400">storage/projects/:projectId/source</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                Writable
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Compiled APK Output Storage</span>
                <span className="text-[11px] font-mono text-slate-400">storage/builds/:buildId/output/</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                Permanent
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Isolated Build Scratchpads</span>
                <span className="text-[11px] font-mono text-slate-400">storage/temp/build-:buildId/</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                Auto-Cleaned
              </span>
            </div>
          </div>
        </div>

        {/* Keystore & Release Signing */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">Release Signing Credentials</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            By default, debug builds are signed automatically using standard Android debug keys. For Google Play release builds, you can provide an Android .keystore or .jks file with alias credentials. Passwords are never logged or exposed.
          </p>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs font-mono text-slate-300">
            keytool -genkey -v -keystore release.keystore -alias appkey -keyalg RSA -keysize 2048 -validity 10000
          </div>
        </div>
      </div>
    </div>
  );
};
