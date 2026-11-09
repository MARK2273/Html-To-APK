import React, { useRef, useEffect, useState } from 'react';
import {
  CheckCircle2,
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
  'Validating web files',
  'Preparing base template',
  'Injecting assets',
  'Writing configurations',
  'Aligning package',
  'Signing APK',
  'Verifying binary',
  'Ready to install'
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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200/80 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-stone-900">Android Build Engine</h2>
              {status === 'running' && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                  Packaging
                </span>
              )}
              {status === 'success' && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Ready
                </span>
              )}
              {status === 'failed' && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/60">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Failed
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-1 font-mono">Build ID: {buildId}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Progress Bar & Current Stage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-800 flex items-center gap-2">
                {status === 'running' && <RotateCw className="w-3.5 h-3.5 text-stone-600 animate-spin" />}
                {stage}
              </span>
              <span className="font-mono text-xs font-semibold text-stone-600">
                {progressPercent}%
              </span>
            </div>

            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  status === 'failed'
                    ? 'bg-rose-500'
                    : status === 'success'
                    ? 'bg-emerald-600'
                    : 'bg-stone-900'
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
                  className={`p-3 rounded-2xl border text-xs transition-all ${
                    isPast
                      ? 'bg-emerald-50/70 border-emerald-200/60 text-emerald-900'
                      : isCurrent
                      ? 'bg-stone-900 border-stone-900 text-stone-50 shadow-sm'
                      : 'bg-stone-50/60 border-stone-200/60 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-medium">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <RotateCw className="w-3.5 h-3.5 text-stone-300 animate-spin" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
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
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-2 text-rose-700">
                <XCircle className="w-4 h-4" />
                <span>Build Error</span>
              </div>
              <p className="font-mono whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {/* Real-Time Build Logs Terminal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium flex items-center gap-1.5 text-stone-700">
                <Terminal className="w-4 h-4 text-stone-500" />
                Build Logs ({logs.length} lines)
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-0"
                  />
                  <span>Auto-scroll</span>
                </label>
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1 hover:text-stone-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div
              ref={logContainerRef}
              className="bg-stone-900 border border-stone-800 rounded-2xl p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed text-stone-300 space-y-1 select-text shadow-inner"
            >
              {logs.length === 0 ? (
                <div className="text-stone-500 italic">Connecting to build logs stream...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-stone-600 select-none w-8 text-right shrink-0">
                      {index + 1}
                    </span>
                    <span
                      className={`break-all ${
                        log.includes('[ERROR]') || log.includes('FAILED')
                          ? 'text-rose-400 font-medium'
                          : log.includes('[STEP') || log.includes('SUCCESSFUL') || log.includes('[FAST PACK]')
                          ? 'text-emerald-400 font-medium'
                          : 'text-stone-300'
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
        <div className="p-5 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            {status === 'running' && 'Fast packaging pipeline in progress...'}
            {status === 'success' && 'Your installable APK has been assembled and signed!'}
            {status === 'failed' && 'Packaging failed. Inspect details above.'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-medium transition-colors bg-white shadow-sm"
            >
              Close
            </button>

            {status === 'success' && (
              <a
                href={api.getDownloadUrl(buildId)}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download APK</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
