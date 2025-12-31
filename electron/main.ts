import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Set app name for macOS menu bar (must be before app.whenReady)
if (process.platform === 'darwin') {
  app.setName('Hexal');
}

// Multi-window support
const windows: Set<BrowserWindow> = new Set();
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

app.whenReady().then(() => {
  createApplicationMenu();
  createWindow();
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
