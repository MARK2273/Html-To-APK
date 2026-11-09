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
  ShieldCheck,
  Check
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
      description: 'Allows your app to communicate with external APIs, fonts, and remote endpoints.',
      icon: Globe,
      recommended: true
    },
    {
      key: 'camera',
      title: 'Camera Access',
      description: 'Permits capturing photos or live video streams via HTML5 getUserMedia or file capture.',
      icon: Camera,
      runtimePrompt: true
    },
    {
      key: 'microphone',
      title: 'Microphone & Audio',
      description: 'Permits recording audio and speech-to-text in WebRTC web applications.',
      icon: Mic,
      runtimePrompt: true
    },
    {
      key: 'location',
      title: 'Geolocation',
      description: 'Access user geographical coordinates for maps and location-aware services.',
      icon: MapPin,
      runtimePrompt: true
    },
    {
      key: 'fineLocation',
      title: 'Precise GPS Location',
      description: 'High-accuracy GPS positioning for navigation or precise maps.',
      icon: MapPin,
      runtimePrompt: true
    },
    {
      key: 'fileAccess',
      title: 'Storage & Downloads',
      description: 'Read and write local storage for file downloads, photos, and cached media.',
      icon: FolderOpen,
      runtimePrompt: true
    },
    {
      key: 'notifications',
      title: 'Push Notifications',
      description: 'Permit web notifications on Android 13+ devices.',
      icon: Bell,
      runtimePrompt: true
    },
    {
      key: 'vibration',
      title: 'Haptic Feedback',
      description: 'Allows using navigator.vibrate() for haptic touch feedback in games and buttons.',
      icon: Vibrate
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 tracking-tight">Android Permissions</h3>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Only requested capabilities are declared in your app manifest to keep permissions lean and secure.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-medium self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Least-Privilege Security</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {permissionItems.map((item) => {
          const Icon = item.icon;
          const isEnabled = permissions[item.key];

          return (
            <div
              key={item.key}
              onClick={() => toggle(item.key)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 select-none shadow-sm ${
                isEnabled
                  ? 'bg-stone-50/90 border-stone-800 ring-1 ring-stone-900/10'
                  : 'bg-white border-stone-200/70 hover:border-stone-300 hover:bg-stone-50/40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isEnabled ? 'bg-stone-900 text-stone-50' : 'bg-stone-100 text-stone-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${isEnabled ? 'text-stone-900' : 'text-stone-700'}`}>
                    {item.title}
                  </span>
                  {item.recommended && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 font-medium">
                      Standard
                    </span>
                  )}
                  {item.runtimePrompt && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 font-medium">
                      Runtime
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-0.5">
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    isEnabled
                      ? 'bg-stone-900 border-stone-900 text-stone-50'
                      : 'border-stone-300 bg-white'
                  }`}
                >
                  {isEnabled && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
