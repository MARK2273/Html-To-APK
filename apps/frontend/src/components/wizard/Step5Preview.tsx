import React, { useState } from 'react';
import { Project, ExtractedWebsiteInfo, BuildType } from '../../types';
import { DeviceFrame } from '../preview/DeviceFrame';
import { api } from '../../services/api';
import { PackageCheck, AlertCircle, Smartphone } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-stone-900 tracking-tight">Preview & Build</h3>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
          Test your application in the simulated Android WebView, review package settings, and compile the final APK.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Device Preview (Left 7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <DeviceFrame previewUrl={previewUrl} projectName={project.name} />
        </div>

        {/* Build Options & Action (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-stone-50/70 border border-stone-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-stone-200/70 pb-3">
            <PackageCheck className="w-4 h-4 text-stone-700" />
            <h4 className="font-semibold text-sm text-stone-900">Package Summary</h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">App Name:</span>
              <span className="font-medium text-stone-900">{project.name}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">Package ID:</span>
              <span className="font-mono text-stone-700">{project.packageName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">Version:</span>
              <span className="text-stone-800 font-mono">v{project.versionName} ({project.versionCode})</span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">Entry HTML:</span>
              <span className="font-mono text-stone-800">{project.entryPoint}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">Orientation:</span>
              <span className="capitalize text-stone-800">{project.orientation}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">Total Files:</span>
              <span className="text-stone-900 font-medium">{filesInfo?.totalFiles || 0} files</span>
            </div>

            <div className="py-1">
              <span className="text-stone-500 block mb-1">Declared Permissions ({activePermissions.length}):</span>
              <div className="flex flex-wrap gap-1">
                {activePermissions.map(p => (
                  <span key={p} className="px-2 py-0.5 rounded-full bg-stone-200/70 text-[10px] text-stone-700 font-mono">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Build Type Selector */}
          <div className="space-y-2 pt-2 border-t border-stone-200/70">
            <label className="text-xs font-medium text-stone-700 block">Package Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBuildType('debug')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  buildType === 'debug'
                    ? 'bg-stone-900 border-stone-900 text-stone-50 shadow-sm'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                Debug APK
              </button>
              <button
                type="button"
                onClick={() => setBuildType('release')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  buildType === 'release'
                    ? 'bg-stone-900 border-stone-900 text-stone-50 shadow-sm'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                Release APK
              </button>
            </div>
          </div>

          {buildType === 'release' && (
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={generateAab}
                onChange={(e) => setGenerateAab(e.target.checked)}
                className="rounded border-stone-300 text-stone-900 focus:ring-0"
              />
              <span>Generate Android App Bundle (.aab)</span>
            </label>
          )}

          {(!filesInfo || filesInfo.totalFiles === 0) && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Please upload your website files before building.</span>
            </div>
          )}

          {/* BUILD APK BUTTON */}
          <button
            type="button"
            disabled={isBuilding || !filesInfo || filesInfo.totalFiles === 0}
            onClick={() => onStartBuild(buildType, generateAab)}
            className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none text-stone-50 text-sm font-medium shadow-sm transition-all hover:shadow active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4 text-stone-300" />
            <span>{isBuilding ? 'Building Package...' : 'Build Android APK'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
