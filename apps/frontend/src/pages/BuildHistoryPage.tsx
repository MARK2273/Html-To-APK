import React, { useEffect, useState } from 'react';
import { BuildRecord } from '../types';
import { api } from '../services/api';
import {
  History,
  CheckCircle,
  XCircle,
  RotateCw,
  Download,
  Terminal
} from 'lucide-react';
import { BuildProgressModal } from '../components/build/BuildProgressModal';

export const BuildHistoryPage: React.FC = () => {
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  const fetchBuilds = async () => {
    try {
      const list = await api.getBuilds();
      setBuilds(list);
    } catch (err) {
      console.error('Failed to load build history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilds();
  }, []);

  const filtered = builds.filter(b => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Build History</h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit generated APK artifacts, duration metrics, and compiler logs.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Builds
          </button>
          <button
            onClick={() => setStatusFilter('success')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'success' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'failed' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <RotateCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-xs">Loading build history...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No build records found</p>
          <p className="text-xs text-slate-400">Launch a build from any project to see history here.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Build Details</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Artifact Size</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          b.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : b.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {b.status === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
                        {b.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                        {b.status === 'running' && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                        <span className="capitalize">{b.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{b.projectName || 'Web Application'}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">{b.id}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="uppercase font-mono font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-800 text-[10px]">
                        {b.buildType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-400">
                      {b.durationMs ? `${(b.durationMs / 1000).toFixed(1)}s` : '—'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                      {b.apkSize ? `${(b.apkSize / (1024 * 1024)).toFixed(2)} MB` : '—'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      {new Date(b.startTime).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedBuildId(b.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Logs</span>
                        </button>

                        {b.status === 'success' && (
                          <a
                            href={api.getDownloadUrl(b.id)}
                            download
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download APK</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedBuildId && (
        <BuildProgressModal
          buildId={selectedBuildId}
          onClose={() => setSelectedBuildId(null)}
          onCompleted={fetchBuilds}
        />
      )}
    </div>
  );
};
