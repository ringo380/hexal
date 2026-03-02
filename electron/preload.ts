// Electron preload script - exposes IPC to renderer process
import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for the exposed API
export interface CampaignInfo {
  name: string;
  path: string;
  modifiedAt: string;
}

export interface SaveResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface LoadResult {
  success: boolean;
  campaign?: unknown;
  path?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface SaveFileResult {
  success: boolean;
  error?: string;
}

export type MenuCommand =
  | 'new-campaign'
  | 'open'
  | 'open-new-window'
  | 'save'
  | 'save-as'
  | 'export'
  | 'export-map'
  | 'undo'
  | 'redo'
  | 'open-player-view';

export type ExportFormat = 'png' | 'jpeg' | 'pdf';

export interface WebServerStatusInfo {
  running: boolean;
  port: number;
  pin: string;
  url: string;
  clientCount: number;
}

// Expose protected methods to renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Campaign file operations
  listCampaigns: (): Promise<CampaignInfo[]> =>
    ipcRenderer.invoke('list-campaigns'),

  saveCampaign: (campaign: unknown, filePath?: string): Promise<SaveResult> =>
    ipcRenderer.invoke('save-campaign', { campaign, filePath }),

  loadCampaign: (filePath: string): Promise<LoadResult> =>
    ipcRenderer.invoke('load-campaign', filePath),

  deleteCampaign: (filePath: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('delete-campaign', filePath),

  // Dialog operations
  openFileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke('open-file-dialog'),

  saveFileDialog: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('save-file-dialog', defaultName),

  saveAsDialog: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('save-as-dialog', defaultName),

  // Export file operations
  saveFile: (filePath: string, content: string): Promise<SaveFileResult> =>
    ipcRenderer.invoke('save-file', { filePath, content }),

  // Multi-window operations
  openInNewWindow: (filePath?: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('open-in-new-window', filePath),

  // Binary file operations for image/PDF export
  saveBinaryFile: (filePath: string, data: string): Promise<SaveFileResult> =>
    ipcRenderer.invoke('save-binary-file', { filePath, data }),

  exportFileDialog: (defaultName: string, format: ExportFormat): Promise<string | null> =>
    ipcRenderer.invoke('export-file-dialog', { defaultName, format }),

  // Menu command listener
  onMenuCommand: (callback: (command: MenuCommand) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, command: MenuCommand) => callback(command);
    ipcRenderer.on('menu-command', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('menu-command', handler);
  },

  // Campaign file load listener (for opening in new window)
  onLoadCampaignFile: (callback: (filePath: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath);
    ipcRenderer.on('load-campaign-file', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('load-campaign-file', handler);
  },

  // Player view operations
  openPlayerView: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('open-player-view'),

  syncPlayerView: (data: unknown): void => {
    ipcRenderer.send('sync-player-view', data);
  },

  notifyPlayerViewCampaignClosed: (): void => {
    ipcRenderer.send('player-view-campaign-closed');
  },

  onPlayerViewUpdate: (callback: (data: unknown) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on('player-view-update', handler);
    return () => ipcRenderer.removeListener('player-view-update', handler);
  },

  onPlayerViewCampaignClosed: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('player-view-campaign-closed', handler);
    return () => ipcRenderer.removeListener('player-view-campaign-closed', handler);
  },

  // Settings operations
  getSettings: (): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('get-settings'),

  setSettings: (settings: Record<string, unknown>): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('set-settings', settings),

  getSetting: (key: string): Promise<unknown> =>
    ipcRenderer.invoke('get-setting', key),

  setSetting: (key: string, value: unknown): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('set-setting', { key, value }),

  // Web server operations
  startWebServer: (options?: { port?: number }): Promise<{ success: boolean; status?: WebServerStatusInfo; error?: string }> =>
    ipcRenderer.invoke('start-web-server', options),

  stopWebServer: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('stop-web-server'),

  getWebServerStatus: (): Promise<WebServerStatusInfo> =>
    ipcRenderer.invoke('get-web-server-status')
});

// Type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      listCampaigns: () => Promise<CampaignInfo[]>;
      saveCampaign: (campaign: unknown, filePath?: string) => Promise<SaveResult>;
      loadCampaign: (filePath: string) => Promise<LoadResult>;
      deleteCampaign: (filePath: string) => Promise<DeleteResult>;
      openFileDialog: () => Promise<string | null>;
      saveFileDialog: (defaultName: string) => Promise<string | null>;
      saveAsDialog: (defaultName: string) => Promise<string | null>;
      saveFile: (filePath: string, content: string) => Promise<SaveFileResult>;
      openInNewWindow: (filePath?: string) => Promise<{ success: boolean }>;
      saveBinaryFile: (filePath: string, data: string) => Promise<SaveFileResult>;
      exportFileDialog: (defaultName: string, format: ExportFormat) => Promise<string | null>;
      onMenuCommand: (callback: (command: MenuCommand) => void) => () => void;
      onLoadCampaignFile: (callback: (filePath: string) => void) => () => void;
      openPlayerView: () => Promise<{ success: boolean }>;
      syncPlayerView: (data: unknown) => void;
      notifyPlayerViewCampaignClosed: () => void;
      onPlayerViewUpdate: (callback: (data: unknown) => void) => () => void;
      onPlayerViewCampaignClosed: (callback: () => void) => () => void;
      // Settings
      getSettings: () => Promise<Record<string, unknown>>;
      setSettings: (settings: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
      getSetting: (key: string) => Promise<unknown>;
      setSetting: (key: string, value: unknown) => Promise<{ success: boolean; error?: string }>;
      // Web server
      startWebServer: (options?: { port?: number }) => Promise<{ success: boolean; status?: WebServerStatusInfo; error?: string }>;
      stopWebServer: () => Promise<{ success: boolean; error?: string }>;
      getWebServerStatus: () => Promise<WebServerStatusInfo>;
    };
  }
}
