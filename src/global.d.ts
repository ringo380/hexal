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
  | 'undo'
  | 'redo';

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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
