import React, { useEffect, useState } from 'react';
import { BuildRecord } from '../types';
import { api } from '../services/api';
import {
  History,
  CheckCircle2,
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Build History</h2>
          <p className="text-xs text-stone-500 mt-1">
            Review compiled APK packages, build durations, and packaging logs.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs border border-stone-200/60 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            All Builds
          </button>
          <button
            onClick={() => setStatusFilter('success')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'success' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === 'failed' ? 'bg-white text-rose-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-400 gap-2">
          <RotateCw className="w-5 h-5 animate-spin text-stone-600" />
          <span className="text-xs">Loading build history...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200/70 rounded-3xl p-8 space-y-3 shadow-sm">
          <History className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-medium text-stone-800">No build records found</p>
          <p className="text-xs text-stone-500">Launch a build from any application to see history here.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200/70 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200/70 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-4">Application Details</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          b.status === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : b.status === 'failed'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                        }`}
                      >
                        {b.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {b.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {b.status === 'running' && <RotateCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                        <span className="capitalize">{b.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-stone-900">{b.projectName || 'Web Application'}</div>
                      <div className="font-mono text-[10px] text-stone-400 truncate max-w-xs">{b.id}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="uppercase font-mono font-medium text-stone-600 px-2 py-0.5 rounded-full bg-stone-100 text-[10px]">
                        {b.buildType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-stone-500">
                      {b.durationMs ? `${(b.durationMs / 1000).toFixed(1)}s` : '—'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-stone-700">
                      {b.apkSize ? `${(b.apkSize / (1024 * 1024)).toFixed(2)} MB` : '—'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-500">
                      {new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedBuildId(b.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/70 text-stone-700 text-xs font-medium transition-colors"
                        >
                          <Terminal className="w-3.5 h-3.5 text-stone-500" />
                          <span>Logs</span>
                        </button>

                        {b.status === 'success' && (
                          <a
                            href={api.getDownloadUrl(b.id)}
                            download
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium shadow-sm transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
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
