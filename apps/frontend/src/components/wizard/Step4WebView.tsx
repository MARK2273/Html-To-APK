import React from 'react';
import { WebViewConfig } from '../../types';
import {
  Code,
  Database,
  Upload,
  Camera,
  Mic,
  MapPin,
  ZoomIn,
  Maximize,
  Download,
  ExternalLink,
  WifiOff,
  Shield
} from 'lucide-react';

interface Step4WebViewProps {
  config: WebViewConfig;
  onChange: (updated: WebViewConfig) => void;
}

export const Step4WebView: React.FC<Step4WebViewProps> = ({ config, onChange }) => {
  const toggle = (key: keyof WebViewConfig) => {
    onChange({
      ...config,
      [key]: !config[key]
    });
  };

  const options: Array<{
    key: keyof WebViewConfig;
    title: string;
    description: string;
    icon: any;
    recommended?: boolean;
    caution?: boolean;
  }> = [
    {
      key: 'enableJavaScript',
      title: 'JavaScript Execution',
      description: 'Required for modern dynamic web apps, React, Vue, frameworks, and interactivity.',
      icon: Code,
      recommended: true
    },
    {
      key: 'enableDomStorage',
      title: 'DOM Storage (localStorage & sessionStorage)',
      description: 'Allows client-side key-value persistence across app sessions.',
      icon: Database,
      recommended: true
    },
    {
      key: 'enableLocalStorage',
      title: 'IndexedDB & Offline Database Storage',
      description: 'Enables high-capacity structured offline data storage in the WebView.',
      icon: Database,
      recommended: true
    },
    {
      key: 'enableFileUpload',
      title: 'File Upload Support (<input type="file">)',
      description: 'Connects the native Android document and image picker to web inputs.',
      icon: Upload,
      recommended: true
    },
    {
      key: 'enableCameraAccess',
      title: 'WebRTC Camera Stream',
      description: 'Allows navigator.mediaDevices.getUserMedia live video capture.',
      icon: Camera
    },
    {
      key: 'enableMicrophoneAccess',
      title: 'WebRTC Microphone Stream',
      description: 'Allows voice recordings and WebRTC audio input in the WebView.',
      icon: Mic
    },
    {
      key: 'enableGeolocation',
      title: 'HTML5 Geolocation Bridge',
      description: 'Hooks navigator.geolocation.getCurrentPosition to Android GPS.',
      icon: MapPin
    },
    {
      key: 'enableZoom',
      title: 'Pinch-to-Zoom Gestures',
      description: 'Allows zooming in/out (keep disabled for a native application feel).',
      icon: ZoomIn
    },
    {
      key: 'enableFullscreen',
      title: 'HTML5 Fullscreen Video',
      description: 'Permits <video> elements to expand to full device screen in landscape.',
      icon: Maximize,
      recommended: true
    },
    {
      key: 'enableDownloadSupport',
      title: 'Android DownloadManager',
      description: 'Intercepts web file downloads and displays progress in Android notifications.',
      icon: Download,
      recommended: true
    },
    {
      key: 'enableExternalLinks',
      title: 'External Link Routing',
      description: 'Opens out-of-domain HTTP/HTTPS links in Chrome or default browser.',
      icon: ExternalLink,
      recommended: true
    },
    {
      key: 'enableOfflineMode',
      title: 'Fast Offline Caching',
      description: 'Serves all local assets via WebViewAssetLoader without requiring internet.',
      icon: WifiOff,
      recommended: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-900 tracking-tight">WebView Environment</h3>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Configure the embedded browser settings, local storage policies, and device integrations.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/80 text-stone-700 text-xs font-medium self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5 text-stone-600" />
          <span>WebViewAssetLoader HTTPS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {options.map((item) => {
          const Icon = item.icon;
          const isEnabled = config[item.key];

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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200/60 text-stone-700 font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-1">
                {/* Smooth switch */}
                <div
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    isEnabled ? 'bg-stone-900' : 'bg-stone-200'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                      isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
