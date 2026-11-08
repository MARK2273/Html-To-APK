import React from 'react';
import { ProjectPermissions } from '../../types';
import {
  Globe,
  Camera,
  Mic,
  MapPin,
  FolderOpen,
  Bell,
  Vibrate,
  ShieldCheck
} from 'lucide-react';

interface Step3PermissionsProps {
  permissions: ProjectPermissions;
  onChange: (updated: ProjectPermissions) => void;
}

export const Step3Permissions: React.FC<Step3PermissionsProps> = ({
  permissions,
  onChange
}) => {
  const toggle = (key: keyof ProjectPermissions) => {
    onChange({
      ...permissions,
      [key]: !permissions[key]
    });
  };

  const permissionItems: Array<{
    key: keyof ProjectPermissions;
    title: string;
    description: string;
    icon: any;
    recommended?: boolean;
    runtimePrompt?: boolean;
  }> = [
    {
      key: 'internet',
      title: 'Internet & Network Access',
      description: 'Allows your application to communicate with external APIs, CDN fonts, and remote endpoints.',
      icon: Globe,
      recommended: true
    },
    {
      key: 'camera',
      title: 'Camera Access',
      description: 'Permits the app to capture photos or live video streams via HTML5 getUserMedia or file capture.',
      icon: Camera,
      runtimePrompt: true
    },
    {
      key: 'microphone',
      title: 'Microphone & Audio Recording',
      description: 'Permits recording audio and speech-to-text in WebRTC applications.',
      icon: Mic,
      runtimePrompt: true
    },
    {
      key: 'location',
      title: 'General Geolocation',
      description: 'Access user geographical coordinates for maps and location-aware services.',
      icon: MapPin,
      runtimePrompt: true
    },
    {
      key: 'fineLocation',
      title: 'Precise GPS Location (Fine)',
      description: 'High-accuracy GPS positioning for navigation or precise geolocation.',
      icon: MapPin,
      runtimePrompt: true
    },
    {
      key: 'fileAccess',
      title: 'File & Media Storage Access',
      description: 'Read and write local storage for file downloads, photos, and cached media.',
      icon: FolderOpen,
      runtimePrompt: true
    },
    {
      key: 'notifications',
      title: 'Push Notifications (POST_NOTIFICATIONS)',
      description: 'Permit web notifications on Android 13+ devices.',
      icon: Bell,
      runtimePrompt: true
    },
    {
      key: 'vibration',
      title: 'Haptic Feedback / Vibration',
      description: 'Allows using navigator.vibrate() for haptic touch feedback in games and buttons.',
      icon: Vibrate
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Application Permissions</h3>
          <p className="text-xs text-slate-400 mt-1">
            Only requested permissions will be declared in the <code>AndroidManifest.xml</code>. Sensitive permissions require runtime user approval on device.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Least-Privilege Security</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {permissionItems.map((item) => {
          const Icon = item.icon;
          const isEnabled = permissions[item.key];

          return (
            <div
              key={item.key}
              onClick={() => toggle(item.key)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                isEnabled
                  ? 'bg-blue-600/10 border-blue-500/50 text-slate-100 ring-1 ring-blue-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isEnabled ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${isEnabled ? 'text-blue-200' : 'text-slate-300'}`}>
                    {item.title}
                  </span>
                  {item.recommended && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                      Standard
                    </span>
                  )}
                  {item.runtimePrompt && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-semibold">
                      Runtime
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-1">
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isEnabled
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-700 bg-slate-800'
                  }`}
                >
                  {isEnabled && <span className="text-xs font-bold">✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

