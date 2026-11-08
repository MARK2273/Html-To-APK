import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckCircle,
  XCircle,
  Cpu,
  PlusCircle,
  Download,
  Clock,
  ArrowRight,
  Hammer
} from 'lucide-react';
import { DashboardStats, Project } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  onNavigate: (page: string, projectId?: string) => void;
  onOpenBuild: (buildId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenBuild }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardStats, projectsList] = await Promise.all([
          api.getDashboardStats(),
          api.getProjects()
        ]);
        setStats(dashboardStats);
        setProjects(projectsList.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Welcome & Quick CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            HTML/CSS/JS to Android APK Converter
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Convert standard web applications and static sites into high-performance, native-accelerated Android APK packages using Android WebView and Gradle.
          </p>
        </div>
        <button
          onClick={() => onNavigate('create')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Application</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Projects</span>
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">
            {loading ? '...' : stats?.totalProjects || 0}
          </div>
          <p className="text-[11px] text-slate-400">Stored in local SQLite database</p>
        </div>

        {/* Successful Builds */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Successful Builds</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {loading ? '...' : stats?.successfulBuilds || 0}
          </div>
          <p className="text-[11px] text-slate-400">Verified compiled APK binaries</p>
        </div>

        {/* Failed Builds */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Failed Builds</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {loading ? '...' : stats?.failedBuilds || 0}
          </div>
          <p className="text-[11px] text-slate-400">Inspectable diagnostic logs</p>
        </div>

        {/* Build Engine State */}
        <div
          onClick={() => onNavigate('environment')}
          className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Android Toolchain</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>SDK 34 & Java 21</span>
          </div>
          <p className="text-[11px] text-blue-400 flex items-center gap-1 font-semibold">
            <span>Check Environment</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* Main Sections: Recent Builds & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent APK Builds (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-slate-100">Recent APK Builds</h3>
            </div>
            <button
              onClick={() => onNavigate('builds')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View All History
            </button>
          </div>

          {!stats || stats.recentBuilds.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Hammer className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No APK builds generated yet.</p>
              <button
                onClick={() => onNavigate('create')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Create Your First App
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {stats.recentBuilds.map((b) => (
                <div
                  key={b.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">{b.projectName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{b.packageName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 uppercase font-semibold text-slate-400">
                        {b.buildType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Started: {new Date(b.startTime).toLocaleString()} • Duration: {((b.durationMs || 0) / 1000).toFixed(1)}s
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                        b.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : b.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {b.status === 'success' && <CheckCircle className="w-3 h-3" />}
                      {b.status === 'failed' && <XCircle className="w-3 h-3" />}
                      <span className="capitalize">{b.status}</span>
                    </span>

                    <button
                      onClick={() => onOpenBuild(b.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                    >
                      Logs
                    </button>

                    {b.status === 'success' && (
                      <a
                        href={api.getDownloadUrl(b.id)}
                        download
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>APK</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100">My Projects</h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View All
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No saved projects found.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200 truncate">{p.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">v{p.versionName}</span>
                  </div>
                  <p className="font-mono text-[11px] text-blue-400 truncate">{p.packageName}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">Entry: {p.entryPoint}</span>
                    <button
                      onClick={() => onNavigate('create', p.id)}
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      Reopen ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

