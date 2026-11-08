import React, { useRef, useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Download,
  Copy,
  Check,
  RotateCw,
  X
} from 'lucide-react';
import { useBuildProgress } from '../../hooks/useBuildProgress';
import { api } from '../../services/api';

interface BuildProgressModalProps {
  buildId: string;
  onClose: () => void;
  onCompleted?: () => void;
}

const BUILD_STEPS = [
  'Validating website files',
  'Preparing Android project',
  'Copying website assets',
  'Configuring Android manifest',
  'Applying application configuration',
  'Running Gradle',
  'Signing APK',
  'Finalizing build'
];

export const BuildProgressModal: React.FC<BuildProgressModalProps> = ({
  buildId,
  onClose,
  onCompleted
}) => {
  const { status, stage, stepIndex, progressPercent, logs, error, isDone } = useBuildProgress(buildId);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    if (isDone && status === 'success') {
      onCompleted?.();
    }
  }, [isDone, status, onCompleted]);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100">Android APK Build Engine</h2>
              {status === 'running' && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                  Building
                </span>
              )}
              {status === 'success' && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Success
                </span>
              )}
              {status === 'failed' && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" /> Failed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">Build ID: {buildId}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Progress Bar & Current Stage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                {status === 'running' && <RotateCw className="w-4 h-4 text-blue-400 animate-spin" />}
                {stage}
              </span>
              <span className="font-mono text-xs font-bold text-blue-400">
                {progressPercent}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  status === 'failed'
                    ? 'bg-rose-500'
                    : status === 'success'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BUILD_STEPS.map((step, idx) => {
              const currentIdx = stepIndex || 0;
              const isPast = currentIdx > idx + 1 || (status === 'success');
              const isCurrent = currentIdx === idx + 1 && status === 'running';

              return (
                <div
                  key={step}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isPast
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                      : isCurrent
                      ? 'bg-blue-600/10 border-blue-500/50 text-blue-300 ring-1 ring-blue-500/30'
                      : 'bg-slate-800/30 border-slate-700/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-semibold">
                    {isPast ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Step {idx + 1}</span>
                  </div>
                  <div className="truncate font-medium">{step}</div>
                </div>
              );
            })}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-2 text-rose-400">
                <XCircle className="w-4 h-4" />
                <span>Build Operation Encountered An Error</span>
              </div>
              <p className="font-mono whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {/* Real-Time Build Logs Terminal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                <Terminal className="w-4 h-4 text-slate-400" />
                Live Build Logs ({logs.length} lines)
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Auto-scroll</span>
                </label>
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div
              ref={logContainerRef}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 space-y-1 select-text"
            >
              {logs.length === 0 ? (
                <div className="text-slate-400 italic">Connecting to build logs stream...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-slate-400 select-none w-8 text-right shrink-0">
                      {index + 1}
                    </span>
                    <span
                      className={`break-all ${
                        log.includes('[ERROR]') || log.includes('FAILED')
                          ? 'text-rose-400 font-semibold'
                          : log.includes('[STEP') || log.includes('SUCCESSFUL')
                          ? 'text-emerald-400 font-semibold'
                          : log.includes('> Task :')
                          ? 'text-blue-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {status === 'running' && 'Build is actively executing via Gradle compiler.'}
            {status === 'success' && 'Your installable Android APK is ready!'}
            {status === 'failed' && 'Build failed. Check the error and terminal output above.'}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Close
            </button>

            {status === 'success' && (
              <a
                href={api.getDownloadUrl(buildId)}
                download
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>Download APK</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

