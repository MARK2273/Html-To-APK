import {
  Project,
  BuildRecord,
  EnvironmentStatus,
  DashboardStats,
  ExtractedWebsiteInfo,
  BuildType
} from '../types';

export const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api'
  : '/api';

export const api = {
  // System & Environment
  async getEnvironmentStatus(refresh = false): Promise<EnvironmentStatus> {
    const res = await fetch(`${API_BASE}/system/status${refresh ? '?refresh=true' : ''}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.status;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/system/dashboard`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.stats;
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.projects;
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.project;
  },

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.project;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.project;
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
  },

  async uploadFiles(projectId: string, formData: FormData): Promise<ExtractedWebsiteInfo> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.info;
  },

  async uploadIcon(projectId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('icon', file);
    const res = await fetch(`${API_BASE}/projects/${projectId}/icon`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.iconPath;
  },

  async getProjectFiles(projectId: string): Promise<ExtractedWebsiteInfo> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/files`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.info;
  },

  // Builds
  async startBuild(options: {
    projectId: string;
    buildType?: BuildType;
    generateAab?: boolean;
    signingConfig?: any;
  }): Promise<BuildRecord> {
    const res = await fetch(`${API_BASE}/builds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.build;
  },

  async getBuilds(projectId?: string): Promise<BuildRecord[]> {
    const url = projectId ? `${API_BASE}/builds?projectId=${projectId}` : `${API_BASE}/builds`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.builds;
  },

  async getBuild(id: string): Promise<BuildRecord> {
    const res = await fetch(`${API_BASE}/builds/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.build;
  },

  async getBuildLogs(id: string): Promise<string> {
    const res = await fetch(`${API_BASE}/builds/${id}/logs`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.logs;
  },

  getDownloadUrl(buildId: string): string {
    return `${API_BASE}/builds/${buildId}/download`;
  },

  getIconUrl(projectId: string): string {
    return `${API_BASE}/projects/${projectId}/icon?t=${Date.now()}`;
  },

  getPreviewUrl(projectId: string, entryPoint: string = 'index.html'): string {
    return `${API_BASE}/projects/${projectId}/preview/${entryPoint}`;
  }
};

