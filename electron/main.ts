import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { startServer, stopServer, getStatus as getWebServerStatus, broadcastState, broadcastCampaignClosed } from './webServer';

// Set app name for macOS menu bar (must be before app.whenReady)
if (process.platform === 'darwin') {
  app.setName('Hexal');
}

// Multi-window support
const windows: Set<BrowserWindow> = new Set();
const playerViewWindows: Set<BrowserWindow> = new Set();
let activeWindow: BrowserWindow | null = null;

// Get the Hexal folder in user's documents
function getHexalFolder(): string {
  const documentsPath = app.getPath('documents');
  const hexalFolder = path.join(documentsPath, 'Hexal');
  if (!fs.existsSync(hexalFolder)) {
    fs.mkdirSync(hexalFolder, { recursive: true });
  }
  return hexalFolder;
}

// Get the templates subfolder
function getTemplatesFolder(): string {
  const folder = path.join(getHexalFolder(), 'templates');
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  return folder;
}

// Create the application menu
function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: 'Hexal',
      submenu: [
        { role: 'about' as const, label: 'About Hexal' },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const, label: 'Hide Hexal' },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const, label: 'Quit Hexal' }
      ]
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Campaign',
          accelerator: 'CmdOrCtrl+N',
          click: () => activeWindow?.webContents.send('menu-command', 'new-campaign')
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => activeWindow?.webContents.send('menu-command', 'open')
        },
        {
          label: 'Open in New Window...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => activeWindow?.webContents.send('menu-command', 'open-new-window')
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => activeWindow?.webContents.send('menu-command', 'save')
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => activeWindow?.webContents.send('menu-command', 'save-as')
        },
        { type: 'separator' },
        {
          label: 'Export Map...',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => activeWindow?.webContents.send('menu-command', 'export-map')
        },
        {
          label: 'Export Data...',
          accelerator: 'CmdOrCtrl+E',
          click: () => activeWindow?.webContents.send('menu-command', 'export')
        },
        {
          label: 'Save as Template...',
          click: () => activeWindow?.webContents.send('menu-command', 'export-template')
        },
        { type: 'separator' },
        isMac
          ? { role: 'close' as const, label: 'Close Window' }
          : { role: 'quit' as const }
      ]
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => activeWindow?.webContents.send('menu-command', 'undo')
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => activeWindow?.webContents.send('menu-command', 'redo')
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const }
        ] : [
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const }
        ])
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Open Player View',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => activeWindow?.webContents.send('menu-command', 'open-player-view')
        },
        {
          label: 'Fog of War Settings...',
          click: () => activeWindow?.webContents.send('menu-command', 'fog-of-war-settings')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const }
        ] : [
          { role: 'close' as const }
        ])
      ]
    },

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Hexal Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/ringo380/hexal');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(filePath?: string): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'Hexal',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  windows.add(win);

  // Track active window
  win.on('focus', () => {
    activeWindow = win;
  });

  win.on('closed', () => {
    windows.delete(win);
    if (activeWindow === win) {
      activeWindow = null;
    }
  });

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // If a file path was provided, tell the window to load it after ready
  if (filePath) {
    win.webContents.once('did-finish-load', () => {
      win.webContents.send('load-campaign-file', filePath);
    });
  }

  return win;
}

function createPlayerViewWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: 'Hexal — Player View',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  playerViewWindows.add(win);

  win.on('closed', () => {
    playerViewWindows.delete(win);
  });

  // Load with #player-view hash
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL}#player-view`);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'player-view' });
  }

  return win;
}

app.whenReady().then(() => {
  createApplicationMenu();
  createWindow();

  // Auto-start web player server if configured
  const autoStart = settingsStore.get('server.autoStart') as boolean;
  if (autoStart) {
    const port = (settingsStore.get('server.port') as number) || 7680;
    startServer({ port });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (windows.size === 0) {
    createWindow();
  }
});

// IPC Handlers for file operations

// List saved campaigns
ipcMain.handle('list-campaigns', async () => {
  const hexalFolder = getHexalFolder();
  try {
    const files = fs.readdirSync(hexalFolder);
    const campaigns = files
      .filter(f => f.endsWith('.hexal'))
      .map(f => {
        const filePath = path.join(hexalFolder, f);
        const stats = fs.statSync(filePath);
        return {
          name: f.replace('.hexal', ''),
          path: filePath,
          modifiedAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
    return campaigns;
  } catch {
    return [];
  }
});

// Save campaign
ipcMain.handle('save-campaign', async (_event, { campaign, filePath }) => {
  try {
    let savePath = filePath;
    if (!savePath) {
      const hexalFolder = getHexalFolder();
      const safeName = campaign.name.replace(/\//g, '-');
      savePath = path.join(hexalFolder, `${safeName}.hexal`);
    }
    fs.writeFileSync(savePath, JSON.stringify(campaign, null, 2), 'utf-8');
    return { success: true, path: savePath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Load campaign
ipcMain.handle('load-campaign', async (_event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const campaign = JSON.parse(data);
    return { success: true, campaign, path: filePath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Delete campaign
ipcMain.handle('delete-campaign', async (_event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Open file dialog - now supports .json as well
ipcMain.handle('open-file-dialog', async () => {
  const win = activeWindow ?? BrowserWindow.getFocusedWindow();
  if (!win) return null;

  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Hexal Campaigns', extensions: ['hexal', 'json'] }]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Save file dialog
ipcMain.handle('save-file-dialog', async (_event, defaultName: string) => {
  const win = activeWindow ?? BrowserWindow.getFocusedWindow();
  if (!win) return null;

  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [
      { name: 'Hexal Campaign', extensions: ['hexal'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Markdown', extensions: ['md'] }
    ]
  });
  if (result.canceled || !result.filePath) {
    return null;
  }
  return result.filePath;
});

// Save As dialog (for campaign)
ipcMain.handle('save-as-dialog', async (_event, defaultName: string) => {
  const win = activeWindow ?? BrowserWindow.getFocusedWindow();
  if (!win) return null;

  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [{ name: 'Hexal Campaign', extensions: ['hexal'] }]
  });
  if (result.canceled || !result.filePath) {
    return null;
  }
  return result.filePath;
});

// Save file (for export)
ipcMain.handle('save-file', async (_event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Open a new window (optionally with a file to load)
ipcMain.handle('open-in-new-window', async (_event, filePath?: string) => {
  createWindow(filePath);
  return { success: true };
});

// Save binary file (for images/PDFs)
ipcMain.handle('save-binary-file', async (_event, { filePath, data }: { filePath: string; data: string }) => {
  try {
    // data is a base64 string from Blob
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Export file dialog with format-specific filters
ipcMain.handle('export-file-dialog', async (_event, { defaultName, format }: { defaultName: string; format: 'png' | 'jpeg' | 'pdf' }) => {
  const win = activeWindow ?? BrowserWindow.getFocusedWindow();
  if (!win) return null;

  const filters: Record<string, Electron.FileFilter[]> = {
    png: [{ name: 'PNG Image', extensions: ['png'] }],
    jpeg: [{ name: 'JPEG Image', extensions: ['jpg', 'jpeg'] }],
    pdf: [{ name: 'PDF Document', extensions: ['pdf'] }]
  };

  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: filters[format] || [{ name: 'All Files', extensions: ['*'] }]
  });

  if (result.canceled || !result.filePath) {
    return null;
  }
  return result.filePath;
});

// ============ Template IPC handlers ============

// List user templates from ~/Documents/Hexal/templates/
ipcMain.handle('list-user-templates', async () => {
  try {
    const folder = getTemplatesFolder();
    const files = fs.readdirSync(folder).filter(f => f.endsWith('.hexal-template'));
    return files.map(f => {
      const filePath = path.join(folder, f);
      let content: string | null = null;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        // Skip unreadable files
      }
      return {
        fileName: f,
        filePath,
        modifiedAt: fs.statSync(filePath).mtime.toISOString(),
        content,
      };
    });
  } catch (err: any) {
    return [];
  }
});

// Save a template envelope to the templates folder
ipcMain.handle('save-user-template', async (_event, { envelope, fileName }: { envelope: string; fileName: string }) => {
  try {
    const folder = getTemplatesFolder();
    const safeName = fileName.endsWith('.hexal-template') ? fileName : `${fileName}.hexal-template`;
    const filePath = path.resolve(folder, safeName);
    if (!filePath.startsWith(folder + path.sep)) {
      return { success: false, error: 'Invalid file name' };
    }
    fs.writeFileSync(filePath, envelope, 'utf-8');
    return { success: true, filePath };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Delete a user template file
ipcMain.handle('delete-user-template', async (_event, filePath: string) => {
  try {
    // Safety: only delete files inside the templates folder
    const folder = getTemplatesFolder();
    if (!filePath.startsWith(folder + path.sep)) {
      return { success: false, error: 'File is not in the templates folder' };
    }
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Open file dialog to import a .hexal-template
ipcMain.handle('import-template-dialog', async () => {
  const win = activeWindow ?? BrowserWindow.getFocusedWindow();
  if (!win) return null;

  const result = await dialog.showOpenDialog(win, {
    title: 'Import Template',
    filters: [{ name: 'Hexal Template', extensions: ['hexal-template'] }],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return content;
  } catch (err: any) {
    return null;
  }
});

// Save dialog for exporting a .hexal-template
ipcMain.handle('export-template-dialog', async (_event, defaultName: string) => {
  const win = activeWindow ?? BrowserWindow.getFocusedWindow();
  if (!win) return null;

  const safeName = defaultName.endsWith('.hexal-template') ? defaultName : `${defaultName}.hexal-template`;
  const result = await dialog.showSaveDialog(win, {
    defaultPath: safeName,
    filters: [{ name: 'Hexal Template', extensions: ['hexal-template'] }]
  });

  if (result.canceled || !result.filePath) {
    return null;
  }
  return result.filePath;
});

// Player View IPC handlers

// Open a new player view window
ipcMain.handle('open-player-view', async () => {
  createPlayerViewWindow();
  return { success: true };
});

// Relay campaign state from DM to all player view windows + web clients
ipcMain.on('sync-player-view', (_event, data) => {
  Array.from(playerViewWindows).forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('player-view-update', data);
    }
  });
  // Also broadcast to web player clients
  broadcastState(data);
});

// Relay campaign-closed event from DM to all player view windows + web clients
ipcMain.on('player-view-campaign-closed', () => {
  Array.from(playerViewWindows).forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('player-view-campaign-closed');
    }
  });
  broadcastCampaignClosed();
});

// ============ SETTINGS IPC HANDLERS ============

const settingsStore = new Store({
  name: 'settings',
  defaults: {
    ai: {
      openaiKey: '',
      anthropicKey: '',
      preferredProvider: 'anthropic',
    },
    cloud: {
      supabaseUrl: '',
      supabaseAnonKey: '',
      syncEnabled: false,
    },
    general: {
      userName: '',
      autoSaveInterval: 2000,
    },
    server: {
      port: 7680,
      autoStart: false,
    },
  },
});

// Get all settings
ipcMain.handle('get-settings', async () => {
  return settingsStore.store;
});

// Set all settings (merge)
ipcMain.handle('set-settings', async (_event, settings) => {
  try {
    // Merge at top-level keys to avoid wiping sections
    for (const [key, value] of Object.entries(settings)) {
      settingsStore.set(key, value);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Get a single setting by dot-notation path
ipcMain.handle('get-setting', async (_event, key: string) => {
  return settingsStore.get(key);
});

// Set a single setting by dot-notation path
ipcMain.handle('set-setting', async (_event, { key, value }: { key: string; value: unknown }) => {
  try {
    settingsStore.set(key, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// ============ WEB SERVER IPC HANDLERS ============

ipcMain.handle('start-web-server', async (_event, options?: { port?: number }) => {
  try {
    const port = options?.port ?? (settingsStore.get('server.port') as number) ?? 7680;
    const status = startServer({ port });
    return { success: true, status };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('stop-web-server', async () => {
  try {
    stopServer();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('get-web-server-status', async () => {
  return getWebServerStatus();
});