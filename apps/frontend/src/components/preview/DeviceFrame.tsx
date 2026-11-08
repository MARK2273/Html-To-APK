import React, { useState } from 'react';
import { RotateCw, Smartphone, Tablet, Monitor, RefreshCw, ExternalLink } from 'lucide-react';

interface DeviceFrameProps {
  previewUrl: string;
  projectName: string;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ previewUrl, projectName }) => {
  const [device, setDevice] = useState<'pixel' | 'tablet' | 'desktop'>('pixel');
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const handleReload = () => {
    setReloadKey(k => k + 1);
  };

  const dimensions = {
    pixel: isLandscape ? { width: '740px', height: '380px' } : { width: '380px', height: '740px' },
    tablet: isLandscape ? { width: '880px', height: '560px' } : { width: '560px', height: '880px' },
    desktop: { width: '100%', height: '600px' }
  }[device];

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      {/* Device Toolbar */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-3xl px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1">Device:</span>
          <button
            onClick={() => setDevice('pixel')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              device === 'pixel' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              device === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              device === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Responsive</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {device !== 'desktop' && (
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Rotate Device"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isLandscape ? 'Landscape' : 'Portrait'}</span>
            </button>
          )}

          <button
            onClick={handleReload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Reload Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Open In New Window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center items-center w-full py-4">
        {device === 'desktop' ? (
          <div className="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
            <div className="h-8 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              <span className="text-[11px] text-slate-400 font-mono ml-2 truncate">
                https://appassets.androidplatform.net/{projectName}
              </span>
            </div>
            <iframe
              key={reloadKey}
              src={previewUrl}
              title="Desktop Preview"
              className="w-full h-[600px] border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : (
          <div
            className="relative bg-slate-950 border-[10px] border-slate-800 rounded-[44px] shadow-2xl p-1 transition-all duration-300 ring-1 ring-slate-700/50"
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            {/* Top speaker & notch */}
            {!isLandscape && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full flex items-center justify-center z-20">
                <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-slate-900 rounded-full ml-3 border border-slate-700"></div>
              </div>
            )}

            {/* Screen Content */}
            <div className="w-full h-full rounded-[34px] overflow-hidden bg-white relative">
              <iframe
                key={reloadKey}
                src={previewUrl}
                title="Mobile WebView Preview"
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>

            {/* Bottom Home Indicator */}
            {!isLandscape && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700 rounded-full pointer-events-none"></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

