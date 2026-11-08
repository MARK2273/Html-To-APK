import React, { useEffect, useState } from 'react';
import { EnvironmentStatus } from '../types';
import { api } from '../services/api';
import {
  CheckCircle,
  AlertTriangle,
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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span>Environment & Toolchain Setup</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit Java JDK, Android SDK command-line tools, platforms, and build system dependencies.
          </p>
        </div>

        <button
          onClick={() => fetchStatus(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-check Environment</span>
        </button>
      </div>

      {/* Overall Readiness Banner */}
      {status && (
        <div
          className={`p-5 rounded-2xl border flex items-start gap-4 ${
            status.isReady
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {status.isReady ? (
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-100">
              {status.isReady
                ? 'Environment is Fully Configured and Ready to Build APKs'
                : 'Action Required: Missing Android Build Dependencies'}
            </h3>
            <p className="text-xs leading-relaxed opacity-90">
              {status.isReady
                ? 'Java OpenJDK and Android SDK are active. You can upload any web project and generate installable APKs.'
                : 'Follow the setup guide below to install required toolchains on your Linux/Windows development machine.'}
            </p>
          </div>
        </div>
      )}

      {/* Status Checklist Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Java Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200">Java JDK</span>
              {status.java.valid ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> Missing
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-mono text-slate-200">{status.java.version || 'Not Detected'}</span>
              </div>
              <div className="flex justify-between">
                <span>JAVA_HOME:</span>
                <span className="font-mono text-slate-300 truncate max-w-[200px]" title={status.java.javaHome}>
                  {status.java.javaHome || 'Default System'}
                </span>
              </div>
            </div>
          </div>

          {/* Android SDK Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200">Android SDK</span>
              {status.androidSdk.valid ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> Missing
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-mono text-slate-300 truncate max-w-[200px]" title={status.androidSdk.sdkPath}>
                  {status.androidSdk.sdkPath || 'Not Found'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platforms:</span>
                <span className="font-mono text-slate-200">
                  {status.androidSdk.platforms.join(', ') || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Build Tools:</span>
                <span className="font-mono text-slate-200">
                  {status.androidSdk.buildTools.join(', ') || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Gradle Wrapper Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200">Gradle Build System</span>
              {status.gradle.wrapperAvailable ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4" /> Wrapper Ready (8.7)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> Missing
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Bundled Android Gradle wrapper isolated in template workspace. Runs without host gradle installation.
            </p>
          </div>

          {/* Host OS Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200">Host Operating System</span>
              <span className="text-xs font-mono text-blue-400 capitalize">{status.os.platform}</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Kernel / Type:</span>
                <span className="font-mono text-slate-200">{status.os.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Release:</span>
                <span className="font-mono text-slate-200">{status.os.release}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linux / Ubuntu Installation Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-slate-100">Ubuntu / Linux Installation Script</h3>
          </div>
          <button
            onClick={() => copyText(ubuntuInstallCommand, 'ubuntu')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            {copiedKey === 'ubuntu' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'ubuntu' ? 'Copied Script' : 'Copy Commands'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Run the following shell commands in your Ubuntu terminal to install OpenJDK 17, download Android command-line tools, and export <code>ANDROID_HOME</code>:
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed select-text">
          <pre>{ubuntuInstallCommand}</pre>
        </div>
      </div>
    </div>
  );
};
