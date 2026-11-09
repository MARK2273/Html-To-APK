import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { CreateAppPage } from './pages/CreateAppPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { BuildHistoryPage } from './pages/BuildHistoryPage';
import { EnvironmentPage } from './pages/EnvironmentPage';
import { SettingsPage } from './pages/SettingsPage';
import { BuildProgressModal } from './components/build/BuildProgressModal';
import { EnvironmentStatus } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [activeBuildModalId, setActiveBuildModalId] = useState<string | null>(null);
  const [envStatus, setEnvStatus] = useState<EnvironmentStatus | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Initial environment check
    api.getEnvironmentStatus()
      .then(setEnvStatus)
      .catch(console.error);
  }, []);

  const handleNavigate = (page: string, projectId?: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-stone-950 text-stone-100' : 'bg-[#FAF9F5] text-stone-800'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Navbar */}
      <Navbar
        envStatus={envStatus}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onNavigate={handleNavigate}
      />

      {/* Main Body */}
      <div className="flex flex-1">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenBuild={(id) => setActiveBuildModalId(id)}
            />
          )}

          {currentPage === 'create' && (
            <CreateAppPage
              initialProjectId={selectedProjectId}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'projects' && (
            <ProjectsPage
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'builds' && (
            <BuildHistoryPage />
          )}

          {currentPage === 'environment' && (
            <EnvironmentPage />
          )}

          {currentPage === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Global Build Modal if requested from Dashboard/History */}
      {activeBuildModalId && (
        <BuildProgressModal
          buildId={activeBuildModalId}
          onClose={() => setActiveBuildModalId(null)}
        />
      )}
    </div>
  );
};

export default App;

