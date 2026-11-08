import React, { useState } from 'react';
import { Project, ExtractedWebsiteInfo, BuildType } from '../../types';
import { DeviceFrame } from '../preview/DeviceFrame';
import { api } from '../../services/api';
import { Hammer, Sparkles, PackageCheck, AlertCircle } from 'lucide-react';

interface Step5PreviewProps {
  project: Project;
  filesInfo: ExtractedWebsiteInfo | null;
  onStartBuild: (buildType: BuildType, generateAab: boolean) => void;
  isBuilding: boolean;
}

export const Step5Preview: React.FC<Step5PreviewProps> = ({
  project,
  filesInfo,
  onStartBuild,
  isBuilding
}) => {
  const [buildType, setBuildType] = useState<BuildType>('debug');
  const [generateAab, setGenerateAab] = useState<boolean>(false);

  const previewUrl = api.getPreviewUrl(project.id, project.entryPoint);
  const activePermissions = Object.entries(project.permissions).filter(([, v]) => v).map(([k]) => k);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Live Preview & Build Configuration</h3>
        <p className="text-xs text-slate-400 mt-1">
          Interact with your uploaded website in the simulated Android WebView before compiling the APK.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Device Preview (Left 7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <DeviceFrame previewUrl={previewUrl} projectName={project.name} />
        </div>

        {/* Build Options & Action (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <PackageCheck className="w-5 h-5 text-blue-400" />
            <h4 className="font-bold text-sm text-slate-100">Package Summary</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Application Name:</span>
              <span className="font-semibold text-slate-200">{project.name}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Package Identifier:</span>
              <span className="font-mono text-blue-400">{project.packageName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Version:</span>
              <span className="text-slate-200 font-mono">v{project.versionName} ({project.versionCode})</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Entry HTML:</span>
              <span className="font-mono text-slate-300">{project.entryPoint}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Orientation:</span>
              <span className="capitalize text-slate-300">{project.orientation}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Total Web Files:</span>
              <span className="text-slate-200">{filesInfo?.totalFiles || 0} files</span>
            </div>

            <div className="py-1">
              <span className="text-slate-400 block mb-1">Declared Permissions ({activePermissions.length}):</span>
              <div className="flex flex-wrap gap-1.5">
                {activePermissions.map(p => (
                  <span key={p} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Build Type Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">Output Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBuildType('debug')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  buildType === 'debug'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Debug APK (Testing)
              </button>
              <button
                type="button"
                onClick={() => setBuildType('release')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  buildType === 'release'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Release APK
              </button>
            </div>
          </div>

          {buildType === 'release' && (
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={generateAab}
                onChange={(e) => setGenerateAab(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
              />
              <span>Generate Android App Bundle (.aab) for Google Play</span>
            </label>
          )}

          {(!filesInfo || filesInfo.totalFiles === 0) && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Please upload your website files before initiating build.</span>
            </div>
          )}

          {/* BUILD APK BUTTON */}
          <button
            type="button"
            disabled={isBuilding || !filesInfo || filesInfo.totalFiles === 0}
            onClick={() => onStartBuild(buildType, generateAab)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Hammer className="w-4 h-4" />
            <span>Build Android APK</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
