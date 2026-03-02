// Web Player Server — HTTP + WebSocket server for remote player views
// Runs in the Electron main process. Serves the web player build and broadcasts
// campaign state to authenticated WebSocket clients.

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { WebSocketServer, WebSocket } from 'ws';

// ---------- Types ----------

export interface WebServerStatus {
  running: boolean;
  port: number;
  pin: string;
  url: string;
  clientCount: number;
}

interface AuthenticatedClient {
  ws: WebSocket;
  authenticated: boolean;
  authTimeout: ReturnType<typeof setTimeout> | null;
}

// ---------- State ----------

let httpServer: http.Server | null = null;
let wss: WebSocketServer | null = null;
let currentPin = '';
let currentPort = 0;
let clients: AuthenticatedClient[] = [];
let latestState: string | null = null; // JSON-stringified PlayerCampaign
let pingIntervalHandle: ReturnType<typeof setInterval> | null = null;

// ---------- Helpers ----------

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function getLanUrl(port: number): string {
  const interfaces = os.networkInterfaces();
  const keys = Object.keys(interfaces);
  for (let i = 0; i < keys.length; i++) {
    const addrs = interfaces[keys[i]];
    if (!addrs) continue;
    for (let j = 0; j < addrs.length; j++) {
      const addr = addrs[j];
      if (addr.family === 'IPv4' && !addr.internal) {
        return `http://${addr.address}:${port}`;
      }
    }
  }
  return `http://localhost:${port}`;
}

function getStaticDir(): string {
  // In dev, Vite builds to dist-web-player/
  const devDir = path.join(process.cwd(), 'dist-web-player');
  if (fs.existsSync(devDir)) {
    return devDir;
  }
  // In production, bundled into app resources
  if (process.resourcesPath) {
    const prodDir = path.join(process.resourcesPath, 'web-player');
    if (fs.existsSync(prodDir)) {
      return prodDir;
    }
  }
  return devDir; // fallback
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendJson(ws: WebSocket, data: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function removeClient(client: AuthenticatedClient): void {
  if (client.authTimeout) {
    clearTimeout(client.authTimeout);
    client.authTimeout = null;
  }
  clients = clients.filter(c => c !== client);
}

// ---------- Public API ----------

export function startServer(options: { port: number; pin?: string }): WebServerStatus {
  if (httpServer) {
    stopServer();
  }

  currentPort = options.port;
  currentPin = options.pin || generatePin();
  clients = [];
  latestState = null;

  const staticDir = getStaticDir();

  // HTTP server: serves static files from the web player build
  httpServer = http.createServer((req, res) => {
    let urlPath = req.url || '/';

    // Strip query string
    const qIdx = urlPath.indexOf('?');
    if (qIdx !== -1) urlPath = urlPath.substring(0, qIdx);

    // Default to index.html
    if (urlPath === '/') urlPath = '/index.html';

    // Decode URI components
    urlPath = decodeURIComponent(urlPath);

    // Also serve audio files from public/audio/ in dev
    if (urlPath.startsWith('/audio/')) {
      const audioBase = path.join(process.cwd(), 'public') + path.sep;
      const audioPath = path.join(process.cwd(), 'public', urlPath);
      // Security: prevent path traversal outside public/
      if (audioPath.startsWith(audioBase) && fs.existsSync(audioPath)) {
        const ext = path.extname(audioPath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(audioPath).pipe(res);
        return;
      }
    }

    const filePath = path.join(staticDir, urlPath);

    // Security: prevent path traversal (trailing sep prevents sibling dir name bypass)
    if (!filePath.startsWith(staticDir + path.sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath)) {
      // SPA fallback: serve index.html for unknown paths
      const indexPath = path.join(staticDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  // WebSocket server: handles auth and state broadcast
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    const client: AuthenticatedClient = {
      ws,
      authenticated: false,
      authTimeout: null,
    };
    clients.push(client);

    // Require auth within 5 seconds
    client.authTimeout = setTimeout(() => {
      if (!client.authenticated) {
        sendJson(ws, { type: 'auth-fail', reason: 'Authentication timeout' });
        ws.close();
        removeClient(client);
      }
    }, 5000);

    ws.on('message', (raw: Buffer | string) => {
      let msg: { type: string; pin?: string };
      try {
        msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'auth' && !client.authenticated) {
        if (msg.pin === currentPin) {
          client.authenticated = true;
          if (client.authTimeout) {
            clearTimeout(client.authTimeout);
            client.authTimeout = null;
          }
          sendJson(ws, { type: 'auth-ok' });
          // Send current state if available
          if (latestState) {
            ws.send(latestState); // Already JSON-stringified with { type: 'state', data: ... }
          }
        } else {
          sendJson(ws, { type: 'auth-fail', reason: 'Invalid PIN' });
          ws.close();
          removeClient(client);
        }
        return;
      }

      if (msg.type === 'pong') {
        // Keepalive response — no action needed, ws library handles pong at protocol level
        return;
      }
    });

    ws.on('close', () => {
      removeClient(client);
    });

    ws.on('error', () => {
      removeClient(client);
    });
  });

  // Keepalive: ping every 30s
  pingIntervalHandle = setInterval(() => {
    Array.from(clients).forEach(client => {
      if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
        sendJson(client.ws, { type: 'ping' });
      }
    });
  }, 30000);

  httpServer.listen(currentPort);

  return getStatus();
}

export function stopServer(): void {
  if (pingIntervalHandle) {
    clearInterval(pingIntervalHandle);
    pingIntervalHandle = null;
  }
  if (wss) {
    Array.from(clients).forEach(client => {
      if (client.authTimeout) clearTimeout(client.authTimeout);
      client.ws.close();
    });
    clients = [];
    wss.close();
    wss = null;
  }
  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }
  currentPin = '';
  currentPort = 0;
  latestState = null;
}

export function getStatus(): WebServerStatus {
  const authenticatedCount = clients.filter(c => c.authenticated).length;
  return {
    running: httpServer !== null && httpServer.listening,
    port: currentPort,
    pin: currentPin,
    url: currentPort ? getLanUrl(currentPort) : '',
    clientCount: authenticatedCount,
  };
}

export function broadcastState(playerCampaign: unknown): void {
  const message = JSON.stringify({ type: 'state', data: playerCampaign });
  latestState = message;
  Array.from(clients).forEach(client => {
    if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

export function broadcastCampaignClosed(): void {
  const message = JSON.stringify({ type: 'campaign-closed' });
  latestState = null;
  Array.from(clients).forEach(client => {
    if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}
