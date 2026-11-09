import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import { api } from '../services/api';
import {
  FolderKanban,
  Search,
  Plus,
  Trash2,
  RotateCw,
  Smartphone
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight">My Applications</h2>
          <p className="text-xs text-stone-500 mt-1">
            Manage your saved web applications and build Android APK packages anytime.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by app name or package ID..."
          className="w-full bg-white border border-stone-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-300 shadow-sm transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-400 gap-2">
          <RotateCw className="w-5 h-5 animate-spin text-stone-600" />
          <span className="text-xs">Loading applications...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200/70 rounded-3xl p-8 space-y-3 shadow-sm">
          <FolderKanban className="w-10 h-10 mx-auto text-stone-300" />
          <p className="text-sm font-medium text-stone-800">No applications found</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchTerm ? 'No projects match your search query.' : 'Create your first web app project to get started.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => onNavigate('create')}
              className="mt-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium shadow-sm transition-all"
            >
              Create Application
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-stone-200/70 rounded-3xl p-5 hover:border-stone-300 transition-all shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 shadow-inner">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-stone-900 truncate max-w-[160px]">
                        {p.name}
                      </h4>
                      <span className="text-[10px] font-mono text-stone-400">
                        v{p.versionName} ({p.versionCode})
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="font-mono text-xs text-stone-600 truncate bg-stone-50 p-2 rounded-xl border border-stone-100">
                  {p.packageName}
                </p>

                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                  <span>Entry: <strong className="text-stone-700 font-medium">{p.entryPoint}</strong></span>
                  <span className="capitalize">{p.orientation}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => onNavigate('create', p.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200/70 text-stone-800 text-xs font-medium transition-colors"
                >
                  Edit Settings
                </button>
                <button
                  onClick={() => handleQuickBuild(p.id)}
                  className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium shadow-sm transition-all"
                >
                  Build APK
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeBuildId && (
        <BuildProgressModal
          buildId={activeBuildId}
          onClose={() => setActiveBuildId(null)}
          onCompleted={() => onNavigate('builds')}
        />
      )}
    </div>
  );
};
