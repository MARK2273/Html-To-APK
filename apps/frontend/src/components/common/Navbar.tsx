import React from 'react';
import { Smartphone, CheckCircle, AlertTriangle, Moon, Sun, PlusCircle } from 'lucide-react';
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
    <header className="h-16 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
            HTML <span className="text-blue-400 font-extrabold">➔</span> APK
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">v1.0</span>
          </span>
          <p className="text-[11px] text-slate-400">Android Build Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Environment Readiness Pill */}
        <div
          onClick={() => onNavigate('environment')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-colors ${
            envStatus?.isReady
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
          title={envStatus?.isReady ? 'Android SDK & Java Ready' : 'Environment configuration required'}
        >
          {envStatus?.isReady ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Android SDK Ready</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Setup Required</span>
            </>
          )}
        </div>

        {/* Quick Create App Button */}
        <button
          onClick={() => onNavigate('create')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Application</span>
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Light Theme' : 'Dark Theme'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

