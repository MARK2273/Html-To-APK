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
    pixel: isLandscape ? { width: '700px', height: '360px' } : { width: '360px', height: '700px' },
    tablet: isLandscape ? { width: '840px', height: '520px' } : { width: '520px', height: '840px' },
    desktop: { width: '100%', height: '560px' }
  }[device];

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      {/* Device Toolbar */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-3xl px-3.5 py-2 bg-stone-50/80 rounded-2xl border border-stone-200/70 text-xs shadow-sm">
        <div className="flex items-center gap-1">
          <span className="text-stone-400 font-medium mr-1.5">View:</span>
          <button
            onClick={() => setDevice('pixel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              device === 'pixel' ? 'bg-stone-900 text-stone-50 shadow-sm' : 'text-stone-600 hover:bg-stone-200/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              device === 'tablet' ? 'bg-stone-900 text-stone-50 shadow-sm' : 'text-stone-600 hover:bg-stone-200/60'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              device === 'desktop' ? 'bg-stone-900 text-stone-50 shadow-sm' : 'text-stone-600 hover:bg-stone-200/60'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Responsive</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {device !== 'desktop' && (
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 transition-colors shadow-sm"
              title="Rotate Device"
            >
              <RotateCw className="w-3.5 h-3.5 text-stone-500" />
              <span>{isLandscape ? 'Landscape' : 'Portrait'}</span>
            </button>
          )}

          <button
            onClick={handleReload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 transition-colors shadow-sm"
            title="Reload Preview"
          >
            <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reload</span>
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 transition-colors shadow-sm"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center items-center w-full py-2">
        {device === 'desktop' ? (
          <div className="w-full bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-md">
            <div className="h-9 bg-stone-100/80 border-b border-stone-200 flex items-center px-4 gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
              <span className="text-[11px] text-stone-500 font-mono ml-2 truncate">
                https://appassets.androidplatform.net/assets/www/index.html
              </span>
            </div>
            <iframe
              key={reloadKey}
              src={previewUrl}
              title="Desktop Live Preview"
              className="w-full h-[560px] bg-white border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : (
          <div
            style={dimensions}
            className="relative bg-stone-900 rounded-[44px] p-3 shadow-2xl border-4 border-stone-800 transition-all duration-300 flex flex-col shrink-0"
          >
            {/* Top Speaker / Camera Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-stone-800 rounded-full flex items-center justify-center gap-2 z-20">
              <span className="w-2 h-2 rounded-full bg-stone-900"></span>
              <span className="w-8 h-1 rounded-full bg-stone-700"></span>
            </div>

            {/* Screen Inner */}
            <div className="w-full h-full rounded-[34px] overflow-hidden bg-white flex flex-col relative z-10">
              {/* Android Status Bar */}
              <div className="h-7 bg-stone-100/90 text-stone-600 flex items-center justify-between px-6 text-[10px] font-mono shrink-0 select-none border-b border-stone-100">
                <span>10:00</span>
                <span className="truncate max-w-[150px] font-sans font-medium text-stone-700">{projectName}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                  <span>100%</span>
                </div>
              </div>

              {/* WebView Iframe */}
              <iframe
                key={reloadKey}
                src={previewUrl}
                title="Android Device Live Preview"
                className="w-full flex-1 bg-white border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />

              {/* Android Navigation Bar */}
              <div className="h-5 bg-stone-100/90 flex items-center justify-center shrink-0 border-t border-stone-100">
                <div className="w-24 h-1 rounded-full bg-stone-400"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
