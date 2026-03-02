// WebServerStatus — Toolbar indicator for the web player server.
// Stopped: icon button to start. Running: green dot + client count, click shows popover.

import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../icons/Icon';

// Alias the global WebServerStatus interface (declared in global.d.ts)
// to avoid name collision with this component function.
interface ServerStatusInfo {
  running: boolean;
  port: number;
  pin: string;
  url: string;
  clientCount: number;
}

function WebServerStatus() {
  const [status, setStatus] = useState<ServerStatusInfo | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(async () => {
    if (!window.electronAPI?.getWebServerStatus) return;
    try {
      const s = await window.electronAPI.getWebServerStatus();
      setStatus(s);
    } catch { /* ignore */ }
  }, []);

  // Poll status every 3s
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Outside-click dismissal for popover
  useEffect(() => {
    if (!showPopover) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPopover]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.startWebServer();
      if (result.success && result.status) {
        setStatus(result.status);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await window.electronAPI.stopWebServer();
      await refresh();
      setShowPopover(false);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  if (!status || !status.running) {
    return (
      <button
        className="btn btn-icon"
        onClick={handleStart}
        disabled={loading}
        title="Start web player server"
        aria-label="Start web player server"
      >
        <Icon name="link" size={16} />
      </button>
    );
  }

  return (
    <div className="web-server-status">
      <button
        ref={buttonRef}
        className="web-server-status-btn"
        onClick={() => setShowPopover(!showPopover)}
        title="Web player server running"
        aria-label={`Web player server: ${status.clientCount} connected`}
        aria-expanded={showPopover}
      >
        <span className="web-server-dot" />
        <span>{status.clientCount} connected</span>
      </button>

      {showPopover && (
        <div className="web-server-popover" ref={popoverRef}>
          <div className="web-server-popover-row">
            <span className="web-server-popover-label">URL</span>
            <code>{status.url}</code>
            <button className="btn btn-small btn-secondary" onClick={() => copyToClipboard(status.url)}>Copy</button>
          </div>
          <div className="web-server-popover-row">
            <span className="web-server-popover-label">PIN</span>
            <code className="web-server-pin">{status.pin}</code>
            <button className="btn btn-small btn-secondary" onClick={() => copyToClipboard(status.pin)}>Copy</button>
          </div>
          <button
            className="btn btn-small btn-danger web-server-stop-btn"
            onClick={handleStop}
            disabled={loading}
          >
            Stop Server
          </button>
        </div>
      )}
    </div>
  );
}

export default WebServerStatus;
