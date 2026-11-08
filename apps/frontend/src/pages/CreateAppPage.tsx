import React, { useState, useEffect } from 'react';
import { Project, ExtractedWebsiteInfo, BuildType } from '../types';
import { Step1Upload } from '../components/wizard/Step1Upload';
import { Step2Config } from '../components/wizard/Step2Config';
import { Step3Permissions } from '../components/wizard/Step3Permissions';
import { Step4WebView } from '../components/wizard/Step4WebView';
import { Step5Preview } from '../components/wizard/Step5Preview';
import { BuildProgressModal } from '../components/build/BuildProgressModal';
import { api } from '../services/api';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCw } from 'lucide-react';

interface CreateAppPageProps {
  initialProjectId?: string;
  onNavigate: (page: string) => void;
}

const STEPS = [
  { id: 1, label: 'Upload Website' },
  { id: 2, label: 'Configuration' },
  { id: 3, label: 'Permissions' },
  { id: 4, label: 'WebView Settings' },
  { id: 5, label: 'Preview & Build' }
];

export const CreateAppPage: React.FC<CreateAppPageProps> = ({
  initialProjectId,
  onNavigate
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [project, setProject] = useState<Project | null>(null);
  const [filesInfo, setFilesInfo] = useState<ExtractedWebsiteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        if (initialProjectId) {
          const loaded = await api.getProject(initialProjectId);
          setProject(loaded);
          const files = await api.getProjectFiles(initialProjectId);
          setFilesInfo(files);
        } else {
          // Initialize fresh draft project
          const created = await api.createProject({
            name: 'My Web Application',
            packageName: 'com.example.htmlapp',
            versionName: '1.0.0',
            versionCode: 1,
            orientation: 'unspecified'
          });
          setProject(created);
        }
      } catch (err) {
        console.error('Failed to initialize project', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [initialProjectId]);

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!project) return;
    setProject({ ...project, ...updates });
    try {
      await api.updateProject(project.id, updates);
    } catch (err) {
      console.error('Failed to update project draft', err);
    }
  };

  const handleStartBuild = async (buildType: BuildType, generateAab: boolean) => {
    if (!project) return;
    setIsBuilding(true);
    try {
      const build = await api.startBuild({
        projectId: project.id,
        buildType,
        generateAab
      });
      setActiveBuildId(build.id);
    } catch (err: any) {
      alert(`Build launch error: ${err.message}`);
    } finally {
      setIsBuilding(false);
    }
  };

  if (isLoading || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <RotateCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Initializing Application Workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="grid grid-cols-5 gap-2">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600/15 border border-blue-500/40 text-blue-400'
                    : isCompleted
                    ? 'text-emerald-400 hover:bg-slate-800/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <span className="truncate hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        {currentStep === 1 && (
          <Step1Upload
            projectId={project.id}
            filesInfo={filesInfo}
            onFilesUpdated={setFilesInfo}
            selectedEntryPoint={project.entryPoint}
            onEntryPointChanged={(ep) => handleUpdateProject({ entryPoint: ep })}
          />
        )}

        {currentStep === 2 && (
          <Step2Config
            project={project}
            onUpdate={handleUpdateProject}
          />
        )}

        {currentStep === 3 && (
          <Step3Permissions
            permissions={project.permissions}
            onChange={(permissions) => handleUpdateProject({ permissions })}
          />
        )}

        {currentStep === 4 && (
          <Step4WebView
            config={project.webviewConfig}
            onChange={(webviewConfig) => handleUpdateProject({ webviewConfig })}
          />
        )}

        {currentStep === 5 && (
          <Step5Preview
            project={project}
            filesInfo={filesInfo}
            onStartBuild={handleStartBuild}
            isBuilding={isBuilding}
          />
        )}
      </div>

      {/* Navigation Footer Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-xs text-slate-400 font-medium">
          Step {currentStep} of {STEPS.length}
        </div>

        {currentStep < 5 ? (
          <button
            onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Build Progress Modal */}
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
