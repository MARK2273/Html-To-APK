import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import { api } from '../services/api';
import {
  FolderKanban,
  Search,
  PlusCircle,
  Hammer,
  Trash2,
  RotateCw
} from 'lucide-react';
import { BuildProgressModal } from '../components/build/BuildProgressModal';

interface ProjectsPageProps {
  onNavigate: (page: string, projectId?: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleQuickBuild = async (projectId: string) => {
    try {
      const build = await api.startBuild({ projectId, buildType: 'debug' });
      setActiveBuildId(build.id);
    } catch (err: any) {
      alert(`Failed to launch build: ${err.message}`);
    }
  };

  const filtered = projects.filter(
    p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.packageName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">My Applications</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your HTML web projects and rebuild Android APK packages anytime.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by application name or package ID..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <RotateCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-xs">Loading projects...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-3">
          <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No applications found</p>
          <p className="text-xs text-slate-400">Create a new app by uploading an HTML project or website ZIP.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-100 truncate">{p.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    v{p.versionName}
                  </span>
                </div>
                <p className="text-xs font-mono text-blue-400 truncate">{p.packageName}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {p.description || 'No description provided.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Entry: {p.entryPoint}</span>
                  <span>SDK: API {p.minSdk} - {p.targetSdk}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onNavigate('create', p.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleQuickBuild(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>Build APK</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Build Progress Modal */}
      {activeBuildId && (
        <BuildProgressModal
          buildId={activeBuildId}
          onClose={() => setActiveBuildId(null)}
          onCompleted={fetchProjects}
        />
      )}
    </div>
  );
};
