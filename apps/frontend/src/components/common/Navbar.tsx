import React from 'react';
import { Smartphone, CheckCircle2, AlertCircle, Moon, Sun, Plus } from 'lucide-react';
import { EnvironmentStatus } from '../../types';

interface NavbarProps {
  envStatus: EnvironmentStatus | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  envStatus,
  darkMode,
  onToggleDarkMode,
  onNavigate
}) => {
  return (
    <header className="h-16 border-b border-stone-200/80 bg-[#FAF9F5]/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between transition-colors">
      {/* Brand logo & title */}
      <div 
        className="flex items-center gap-3 cursor-pointer group" 
        onClick={() => onNavigate('dashboard')}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-800 to-stone-700 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
          <Smartphone className="w-5 h-5 text-stone-100" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-stone-900 tracking-tight flex items-center gap-1.5">
              HTML <span className="text-stone-400 font-normal">→</span> APK
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-600 font-medium">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-stone-500 tracking-normal">Android Package Studio</p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Environment Readiness Pill */}
        <button
          onClick={() => onNavigate('environment')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
            envStatus?.isReady
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
              : 'bg-amber-50/80 border-amber-200 text-amber-800 hover:bg-amber-100/70'
          }`}
          title={envStatus?.isReady ? 'Build Engine & SDK ready' : 'Environment setup required'}
        >
          {envStatus?.isReady ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>SDK Ready</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Setup Required</span>
            </>
          )}
        </button>

        {/* Quick Create App Button */}
        <button
          onClick={() => onNavigate('create')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium shadow-sm transition-all hover:shadow active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New App</span>
        </button>

        {/* Subtle Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
          title={darkMode ? 'Switch to Light' : 'Switch to Dark'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
