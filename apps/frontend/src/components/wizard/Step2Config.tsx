import React, { useState } from 'react';
import { Project } from '../../types';
import { Image, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

interface Step2ConfigProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

const PACKAGE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

export const Step2Config: React.FC<Step2ConfigProps> = ({ project, onUpdate }) => {
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  const isPackageValid = PACKAGE_NAME_REGEX.test(project.packageName);

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setIconPreview(objectUrl);
    setIsUploadingIcon(true);

    try {
      const iconPath = await api.uploadIcon(project.id, file);
      onUpdate({ iconPath });
    } catch (err) {
      console.error('Failed to upload icon', err);
    } finally {
      setIsUploadingIcon(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Application Configuration</h3>
        <p className="text-xs text-slate-400 mt-1">
          Define how your application identifies itself on Android devices and the Google Play Store.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Application Name *</label>
          <input
            type="text"
            value={project.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="My Web Application"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-400">The title displayed under the app icon on Android.</p>
        </div>

        {/* Package Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Package Name (Application ID) *</label>
            <span className={`text-[11px] flex items-center gap-1 ${isPackageValid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isPackageValid ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {isPackageValid ? 'Valid' : 'Must be format: com.example.app'}
            </span>
          </div>
          <input
            type="text"
            value={project.packageName}
            onChange={(e) => onUpdate({ packageName: e.target.value })}
            placeholder="com.company.myapp"
            className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none ${
              isPackageValid ? 'border-slate-700 focus:border-blue-500' : 'border-amber-500/80'
            }`}
          />
          <p className="text-[11px] text-slate-400">Unique reverse-DNS identifier (e.g. com.mybrand.calculator).</p>
        </div>

        {/* Version Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Version Name</label>
          <input
            type="text"
            value={project.versionName}
            onChange={(e) => onUpdate({ versionName: e.target.value })}
            placeholder="1.0.0"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[11px] text-slate-400">User-facing semantic version string (e.g. 1.0.0).</p>
        </div>

        {/* Version Code */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Version Code</label>
          <input
            type="number"
            min="1"
            value={project.versionCode}
            onChange={(e) => onUpdate({ versionCode: parseInt(e.target.value, 10) || 1 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[11px] text-slate-400">Positive integer incremented with each release.</p>
        </div>

        {/* Orientation */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Screen Orientation</label>
          <select
            value={project.orientation}
            onChange={(e) => onUpdate({ orientation: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="unspecified">Auto / Sensor (Default)</option>
            <option value="portrait">Portrait Only</option>
            <option value="landscape">Landscape Only</option>
          </select>
          <p className="text-[11px] text-slate-400">Lock device screen orientation or allow auto-rotate.</p>
        </div>

        {/* App Icon Upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Application Icon (PNG/JPEG)</label>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              {iconPreview ? (
                <img src={iconPreview} alt="App Icon" className="w-full h-full object-cover" />
              ) : (
                <Smartphone className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div>
              <input
                type="file"
                id="icon-upload"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleIconChange}
              />
              <label
                htmlFor="icon-upload"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Image className="w-3.5 h-3.5" />
                <span>{isUploadingIcon ? 'Uploading...' : 'Choose 512x512 Icon'}</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-1">Square image 512×512 PNG recommended.</p>
            </div>
          </div>
        </div>

        {/* SDK Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Minimum Android SDK</label>
          <select
            value={project.minSdk}
            onChange={(e) => onUpdate({ minSdk: parseInt(e.target.value, 10) })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value={24}>Android 7.0 (API 24) - Recommended (~98% devices)</option>
            <option value={26}>Android 8.0 (API 26)</option>
            <option value={28}>Android 9.0 (API 28)</option>
            <option value={30}>Android 11 (API 30)</option>
            <option value={33}>Android 13 (API 33)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Target Android SDK</label>
          <select
            value={project.targetSdk}
            onChange={(e) => onUpdate({ targetSdk: parseInt(e.target.value, 10) })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value={34}>Android 14 (API 34) - Latest Stable</option>
            <option value={33}>Android 13 (API 33)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

