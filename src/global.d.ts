// Global type declarations for Electron preload API

interface CampaignInfo {
  name: string;
  path: string;
  modifiedAt: string;
}

interface SaveResult {
  success: boolean;
  path?: string;
  error?: string;
}

interface LoadResult {
  success: boolean;
  campaign?: unknown;
  path?: string;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

interface SaveFileResult {
  success: boolean;
  error?: string;
}

type MenuCommand =
  | 'new-campaign'
  | 'open'
  | 'open-new-window'
  | 'save'
  | 'save-as'
  | 'export'
  | 'export-map'
  | 'export-template'
  | 'undo'
  | 'redo'
  | 'open-player-view'
  | 'fog-of-war-settings';

type ExportFormat = 'png' | 'jpeg' | 'pdf';

interface ElectronAPI {
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
  // Templates
  listUserTemplates: () => Promise<{ fileName: string; filePath: string; modifiedAt: string; content: string | null }[]>;
  saveUserTemplate: (envelope: string, fileName: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  deleteUserTemplate: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  importTemplateDialog: () => Promise<string | null>;
  exportTemplateDialog: (defaultName: string) => Promise<string | null>;
  // Settings
  getSettings: () => Promise<Record<string, unknown>>;
  setSettings: (settings: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  getSetting: (key: string) => Promise<unknown>;
  setSetting: (key: string, value: unknown) => Promise<{ success: boolean; error?: string }>;
  // Web server
  startWebServer: (options?: { port?: number }) => Promise<{ success: boolean; status?: WebServerStatus; error?: string }>;
  stopWebServer: () => Promise<{ success: boolean; error?: string }>;
  getWebServerStatus: () => Promise<WebServerStatus>;
}

declare global {
  interface WebServerStatus {
    running: boolean;
    port: number;
    pin: string;
    url: string;
    clientCount: number;
  }

  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
