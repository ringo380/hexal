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
  | 'redo';

export type ExportFormat = 'png' | 'jpeg' | 'pdf';

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
  }
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
    };
  }
}
