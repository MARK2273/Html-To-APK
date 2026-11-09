import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  XCircle,
  Cpu,
  Plus,
  Download,
  Clock,
  ArrowRight,
  Sparkles,
  Smartphone
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/40 border border-stone-200/80 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200/60 text-amber-900 text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Fast Zero-Memory Android Packaging</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
              Turn Your Web Apps into Native Android APKs
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Transform standard HTML, CSS, JavaScript, and canvas games into installable Android binaries in seconds with zero Gradle memory overhead.
            </p>
          </div>

          <button
            onClick={() => onNavigate('create')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-semibold shadow-sm transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New App</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-white border border-stone-200/70 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Total Projects</span>
            <div className="w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-stone-900">
            {loading ? '...' : stats?.totalProjects || 0}
          </div>
          <p className="text-[11px] text-stone-400">Stored in local workspace</p>
        </div>

        {/* Successful Builds */}
        <div className="bg-white border border-stone-200/70 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Successful Builds</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-emerald-700">
            {loading ? '...' : stats?.successfulBuilds || 0}
          </div>
          <p className="text-[11px] text-stone-400">Verified & signed APK packages</p>
        </div>

        {/* Failed Builds */}
        <div className="bg-white border border-stone-200/70 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Failed Builds</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-stone-700">
            {loading ? '...' : stats?.failedBuilds || 0}
          </div>
          <p className="text-[11px] text-stone-400">Full diagnostic logs preserved</p>
        </div>

        {/* Build Engine State */}
        <div
          onClick={() => onNavigate('environment')}
          className="bg-white border border-stone-200/70 rounded-2xl p-5 space-y-2 cursor-pointer hover:border-stone-300 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Build Toolchain</span>
            <div className="w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-stone-200/60 transition-colors">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>SDK 34 & OpenJDK 17</span>
          </div>
          <p className="text-[11px] text-stone-500 flex items-center gap-1 font-medium group-hover:text-stone-800 transition-colors">
            <span>Check Environment</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </div>

      {/* Main Sections: Recent Builds & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent APK Builds (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-stone-200/70 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-stone-800">
              <Clock className="w-4 h-4 text-stone-500" />
              <h3 className="font-semibold text-sm">Recent APK Builds</h3>
            </div>
            <button
              onClick={() => onNavigate('builds')}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors"
            >
              View All History
            </button>
          </div>

          {!stats || stats.recentBuilds.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-3">
              <Smartphone className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-xs">No APK builds generated yet.</p>
              <button
                onClick={() => onNavigate('create')}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium"
              >
                Create Your First App
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {stats.recentBuilds.map((b) => (
                <div
                  key={b.id}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900 text-sm">{b.projectName}</span>
                      <span className="font-mono text-[11px] text-stone-400">{b.packageName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 uppercase font-semibold text-stone-600">
                        {b.buildType}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Started: {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Duration: {((b.durationMs || 0) / 1000).toFixed(1)}s
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 ${
                        b.status === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                          : b.status === 'failed'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
                          : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                      }`}
                    >
                      {b.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {b.status === 'failed' && <XCircle className="w-3 h-3 text-rose-600" />}
                      <span className="capitalize">{b.status}</span>
                    </span>

                    <button
                      onClick={() => onOpenBuild(b.id)}
                      className="px-3 py-1 rounded-xl bg-stone-100 hover:bg-stone-200/70 text-stone-700 font-medium transition-colors"
                    >
                      Logs
                    </button>

                    {b.status === 'success' && (
                      <a
                        href={api.getDownloadUrl(b.id)}
                        download
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium transition-colors shadow-sm"
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
        <div className="lg:col-span-4 bg-white border border-stone-200/70 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h3 className="font-semibold text-sm text-stone-800">My Projects</h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors"
            >
              View All
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">
              No saved projects yet.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/60 hover:border-stone-300 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-stone-900 truncate">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200/60 text-stone-600 font-mono">v{p.versionName}</span>
                  </div>
                  <p className="font-mono text-[11px] text-stone-500 truncate">{p.packageName}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-stone-400">Entry: {p.entryPoint}</span>
                    <button
                      onClick={() => onNavigate('create', p.id)}
                      className="text-stone-800 hover:text-stone-950 font-semibold"
                    >
                      Open →
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
