import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  History,
  Cpu,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create App', icon: PlusCircle },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'builds', label: 'Build History', icon: History },
    { id: 'environment', label: 'Environment', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-60 border-r border-stone-200/70 bg-[#F6F5F0]/60 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1.5">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-stone-400">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200/80'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-stone-900' : 'text-stone-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Engine Status Card */}
      <div className="p-3.5 rounded-2xl bg-white/70 border border-stone-200/70 text-xs text-stone-600 space-y-2 shadow-sm">
        <div className="font-medium text-stone-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Fast Packaging Engine</span>
        </div>
        <p className="text-[11px] leading-relaxed text-stone-500">
          Native WebView with asset acceleration. Fast builds in ~2 seconds.
        </p>
      </div>
    </aside>
  );
};
