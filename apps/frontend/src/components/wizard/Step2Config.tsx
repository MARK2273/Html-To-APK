import React, { useState } from 'react';
import { Project } from '../../types';
import { Image, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface Step2ConfigProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

const PACKAGE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

export const Step2Config: React.FC<Step2ConfigProps> = ({ project, onUpdate }) => {
  const [iconPreview, setIconPreview] = useState<string | null>(() => {
    return project.iconPath ? api.getIconUrl(project.id) : null;
  });
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  React.useEffect(() => {
    if (project.iconPath && !iconPreview) {
      setIconPreview(api.getIconUrl(project.id));
    }
  }, [project.iconPath, project.id]);

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
        <h3 className="text-lg font-semibold text-stone-900 tracking-tight">Application Details</h3>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
          Configure how your application identifies itself on Android devices and app launchers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-700">Application Name *</label>
          <input
            type="text"
            value={project.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="My Web App"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-300 transition-all shadow-sm"
          />
          <p className="text-[11px] text-stone-400">The title displayed under the launcher icon on Android.</p>
        </div>

        {/* Package Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-700">Package Name (Application ID) *</label>
            <span className={`text-[11px] flex items-center gap-1 font-medium ${isPackageValid ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isPackageValid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
              {isPackageValid ? 'Valid' : 'e.g. com.example.app'}
            </span>
          </div>
          <input
            type="text"
            value={project.packageName}
            onChange={(e) => onUpdate({ packageName: e.target.value })}
            placeholder="com.company.myapp"
            className={`w-full bg-stone-50 border rounded-xl px-3.5 py-2.5 text-sm text-stone-900 font-mono placeholder-stone-400 focus:bg-white focus:outline-none transition-all shadow-sm ${
              isPackageValid ? 'border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300' : 'border-amber-300'
            }`}
          />
          <p className="text-[11px] text-stone-400">Unique reverse-DNS identifier (e.g. com.mybrand.app).</p>
        </div>

        {/* Version Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-700">Version Name</label>
          <input
            type="text"
            value={project.versionName}
            onChange={(e) => onUpdate({ versionName: e.target.value })}
            placeholder="1.0.0"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-300 transition-all shadow-sm"
          />
          <p className="text-[11px] text-stone-400">User-facing semantic version string (e.g. 1.0.0).</p>
        </div>

        {/* Version Code */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-700">Version Code</label>
          <input
            type="number"
            min="1"
            value={project.versionCode}
            onChange={(e) => onUpdate({ versionCode: parseInt(e.target.value, 10) || 1 })}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-300 transition-all shadow-sm"
          />
          <p className="text-[11px] text-stone-400">Positive integer incremented with each update.</p>
        </div>

        {/* Orientation */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-700">Screen Orientation</label>
          <select
            value={project.orientation}
            onChange={(e) => onUpdate({ orientation: e.target.value as any })}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-300 transition-all shadow-sm"
          >
            <option value="unspecified">Auto / Sensor (Default)</option>
            <option value="portrait">Portrait Only</option>
            <option value="landscape">Landscape Only</option>
          </select>
          <p className="text-[11px] text-stone-400">Lock device screen orientation or allow auto-rotate.</p>
        </div>

        {/* App Icon Upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-700">Application Icon</label>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {iconPreview ? (
                <img src={iconPreview} alt="App Icon" className="w-full h-full object-cover" />
              ) : (
                <Smartphone className="w-5 h-5 text-stone-400" />
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-all shadow-sm"
              >
                <Image className="w-3.5 h-3.5 text-stone-500" />
                <span>{isUploadingIcon ? 'Uploading...' : 'Choose Icon'}</span>
              </label>
              <p className="text-[11px] text-stone-400 mt-1">Square image (512×512 PNG recommended).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
