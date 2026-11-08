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
  Lock
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
      title: 'DOM Storage (sessionStorage & localStorage)',
      description: 'Allows client-side key-value persistence across sessions.',
      icon: Database,
      recommended: true
    },
    {
      key: 'enableLocalStorage',
      title: 'IndexedDB & SQLite Database Storage',
      description: 'Enables high-capacity structured offline data storage in the browser.',
      icon: Database,
      recommended: true
    },
    {
      key: 'enableFileUpload',
      title: 'HTML File Upload (<input type="file">)',
      description: 'Wires native Android document and image picker to web file input elements.',
      icon: Upload,
      recommended: true
    },
    {
      key: 'enableCameraAccess',
      title: 'WebRTC Camera Stream',
      description: 'Allows navigator.mediaDevices.getUserMedia video capture.',
      icon: Camera
    },
    {
      key: 'enableMicrophoneAccess',
      title: 'WebRTC Microphone Stream',
      description: 'Allows voice recordings and WebRTC audio input in WebView.',
      icon: Mic
    },
    {
      key: 'enableGeolocation',
      title: 'HTML5 Geolocation Integration',
      description: 'Hooks navigator.geolocation.getCurrentPosition to Android GPS provider.',
      icon: MapPin
    },
    {
      key: 'enableZoom',
      title: 'Pinch-to-Zoom Controls',
      description: 'Allows users to zoom in/out with multi-touch gestures (leave off for native app feel).',
      icon: ZoomIn
    },
    {
      key: 'enableFullscreen',
      title: 'HTML5 Fullscreen Video Support',
      description: 'Permits <video> elements to expand to full device screen in landscape.',
      icon: Maximize,
      recommended: true
    },
    {
      key: 'enableDownloadSupport',
      title: 'Android DownloadManager Integration',
      description: 'Intercepts web file downloads and manages them via the Android notification shade.',
      icon: Download,
      recommended: true
    },
    {
      key: 'enableExternalLinks',
      title: 'External Link Routing',
      description: 'Opens out-of-domain HTTP/HTTPS links in Chrome / device browser to protect local origin.',
      icon: ExternalLink,
      recommended: true
    },
    {
      key: 'enableOfflineMode',
      title: 'Aggressive Offline Caching',
      description: 'Serves all local assets via WebViewAssetLoader without requiring internet access.',
      icon: WifiOff,
      recommended: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Android WebView Engine Configuration</h3>
          <p className="text-xs text-slate-400 mt-1">
            Fine-tune the Android WebView browser environment, storage policies, and hardware bridging.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
          <Lock className="w-4 h-4" />
          <span>WebViewAssetLoader HTTPS Origin</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((item) => {
          const Icon = item.icon;
          const isEnabled = config[item.key];

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
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-1">
                {/* Switch style toggle */}
                <div
                  className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                    isEnabled ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
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

