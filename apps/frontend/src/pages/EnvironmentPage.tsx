import React, { useEffect, useState } from 'react';
import { EnvironmentStatus } from '../types';
import { api } from '../services/api';
import {
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Cpu,
  Terminal,
  Copy,
  Check
} from 'lucide-react';

export const EnvironmentPage: React.FC = () => {
  const [status, setStatus] = useState<EnvironmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchStatus = async (force = false) => {
    setLoading(true);
    try {
      const data = await api.getEnvironmentStatus(force);
      setStatus(data);
    } catch (err) {
      console.error('Failed to check environment', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const ubuntuInstallCommand = `# 1. Install OpenJDK 17 & prerequisites
sudo apt update && sudo apt install -y openjdk-17-jdk unzip curl git

# 2. Download Android Command Line Tools
mkdir -p ~/Android/Sdk/cmdline-tools
cd /tmp
curl -L -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q cmdline-tools.zip -d ~/Android/Sdk/cmdline-tools
mv ~/Android/Sdk/cmdline-tools/cmdline-tools ~/Android/Sdk/cmdline-tools/latest

# 3. Export Android environment variables in ~/.bashrc
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export ANDROID_SDK_ROOT=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc

# 4. Accept licenses and install platform 34 and build-tools 34.0.0
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-stone-700" />
            <span>Environment & Toolchain</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Status of Java JDK, Android SDK command-line tools, build-tools, and platform API packages.
          </p>
        </div>

        <button
          onClick={() => fetchStatus(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium transition-all shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-check Toolchain</span>
        </button>
      </div>

      {/* Overall Readiness Banner */}
      {status && (
        <div
          className={`p-5 rounded-3xl border flex items-start gap-4 shadow-sm ${
            status.isReady
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          {status.isReady ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">
              {status.isReady
                ? 'Environment is Fully Ready for Android Builds'
                : 'Toolchain Configuration Required'}
            </h3>
            <p className="text-xs opacity-90 leading-relaxed">
              {status.isReady
                ? 'Android SDK platform tools, build tools, and OpenJDK runtime are installed and verified.'
                : 'Some prerequisites are missing or need configuration before builds can execute.'}
            </p>
          </div>
        </div>
      )}

      {/* System Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Java Card */}
        <div className="bg-white border border-stone-200/70 rounded-3xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-stone-900">Java JDK</h4>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 ${
                status?.java.installed
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/60'
              }`}
            >
              {status?.java.installed ? 'Installed' : 'Missing'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Version:</span>
              <span className="font-mono text-stone-800">{status?.java.version || 'Not Detected'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">JAVA_HOME:</span>
              <span className="font-mono text-stone-800 truncate max-w-xs">{status?.java.javaHome || 'Default PATH'}</span>
            </div>
          </div>
        </div>

        {/* Android SDK Card */}
        <div className="bg-white border border-stone-200/70 rounded-3xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-stone-900">Android SDK</h4>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 ${
                status?.androidSdk.installed
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/60'
              }`}
            >
              {status?.androidSdk.installed ? 'Installed' : 'Missing'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Location:</span>
              <span className="font-mono text-stone-800 truncate max-w-xs">{status?.androidSdk.sdkPath || 'Not Set'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Platforms:</span>
              <span className="font-mono text-stone-800">{status?.androidSdk.platforms.join(', ') || 'None'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Build Tools:</span>
              <span className="font-mono text-stone-800">{status?.androidSdk.buildTools.join(', ') || 'None'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linux Setup Instructions */}
      <div className="bg-white border border-stone-200/70 rounded-3xl p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-stone-600" />
            <h4 className="font-semibold text-sm text-stone-900">Automated Installation Script (Linux / Ubuntu / Docker)</h4>
          </div>

          <button
            onClick={() => copyText(ubuntuInstallCommand, 'ubuntu')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
          >
            {copiedKey === 'ubuntu' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'ubuntu' ? 'Copied' : 'Copy Script'}</span>
          </button>
        </div>

        <pre className="bg-stone-900 text-stone-300 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed shadow-inner">
          {ubuntuInstallCommand}
        </pre>
      </div>
    </div>
  );
};
