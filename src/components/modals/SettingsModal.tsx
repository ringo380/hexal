// SettingsModal — Tabbed settings UI (General, AI, Cloud)

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../../stores/SettingsContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useToast } from '../../stores/ToastContext';
import type { AISettings, CloudSettings, GeneralSettings, ServerSettings } from '../../stores/SettingsContext';

interface SettingsModalProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'ai' | 'cloud' | 'server';

function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Local state for editing (commit on blur/save)
  const [general, setGeneral] = useState<GeneralSettings>({ ...settings.general });
  const [ai, setAI] = useState<AISettings>({ ...settings.ai });
  const [cloud, setCloud] = useState<CloudSettings>({ ...settings.cloud });
  const [serverSettings, setServerSettings] = useState<ServerSettings>({ ...settings.server });
  const [saving, setSaving] = useState(false);

  // Web server state (not part of save flow — immediate IPC)
  const [serverStatus, setServerStatus] = useState<WebServerStatus | null>(null);
  const [serverLoading, setServerLoading] = useState(false);

  // Poll server status when server tab is active
  const refreshServerStatus = useCallback(async () => {
    if (!window.electronAPI?.getWebServerStatus) return;
    try {
      const status = await window.electronAPI.getWebServerStatus();
      setServerStatus(status);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (activeTab !== 'server') return;
    refreshServerStatus();
    const interval = setInterval(refreshServerStatus, 2000);
    return () => clearInterval(interval);
  }, [activeTab, refreshServerStatus]);

  const handleStartServer = async () => {
    setServerLoading(true);
    try {
      const result = await window.electronAPI.startWebServer({ port: serverSettings.port });
      if (result.success && result.status) {
        setServerStatus(result.status);
      } else {
        toast(result.error || 'Failed to start server', { variant: 'error' });
      }
    } catch (err) {
      toast('Failed to start server', { variant: 'error' });
    } finally {
      setServerLoading(false);
    }
  };

  const handleStopServer = async () => {
    setServerLoading(true);
    try {
      await window.electronAPI.stopWebServer();
      setServerStatus(null);
      await refreshServerStatus();
    } catch {
      toast('Failed to stop server', { variant: 'error' });
    } finally {
      setServerLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast(`${label} copied to clipboard`);
    }).catch(() => {
      toast('Failed to copy', { variant: 'error' });
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings('general', general);
      await updateSettings('ai', ai);
      await updateSettings('cloud', cloud);
      await updateSettings('server', serverSettings);
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast('Failed to save settings', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'ai', label: 'AI' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'server', label: 'Player Server' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div
        className="modal settings-modal"
        ref={focusTrapRef}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 520, maxHeight: '80vh' }}
      >
        <div className="modal-header">
          <h3 id="settings-modal-title">Settings</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ minHeight: 260 }}>
          {activeTab === 'general' && (
            <div className="settings-section">
              <label className="settings-label">
                Display Name
                <input
                  type="text"
                  className="settings-input"
                  value={general.userName}
                  onChange={(e) => setGeneral({ ...general, userName: e.target.value })}
                  placeholder="Your name (for collaboration)"
                />
              </label>
              <label className="settings-label">
                Auto-save Interval (ms)
                <input
                  type="number"
                  className="settings-input"
                  value={general.autoSaveInterval}
                  onChange={(e) => setGeneral({ ...general, autoSaveInterval: Math.max(500, parseInt(e.target.value) || 2000) })}
                  min={500}
                  step={500}
                />
              </label>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="settings-section">
              <p className="settings-hint">
                API keys are stored locally and never sent to Hexal servers. They are used only for direct API calls to your chosen provider.
              </p>
              <label className="settings-label">
                Preferred Provider
                <select
                  className="settings-input"
                  value={ai.preferredProvider}
                  onChange={(e) => setAI({ ...ai, preferredProvider: e.target.value as 'openai' | 'anthropic' })}
                >
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI (GPT)</option>
                </select>
              </label>
              <label className="settings-label">
                Anthropic API Key
                <input
                  type="password"
                  className="settings-input"
                  value={ai.anthropicKey}
                  onChange={(e) => setAI({ ...ai, anthropicKey: e.target.value })}
                  placeholder="sk-ant-..."
                />
              </label>
              <label className="settings-label">
                OpenAI API Key
                <input
                  type="password"
                  className="settings-input"
                  value={ai.openaiKey}
                  onChange={(e) => setAI({ ...ai, openaiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </label>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="settings-section">
              <p className="settings-hint">
                Cloud sync stores campaign data in Supabase. These fields are optional — the app works fully offline without them. Sign in via the account menu to enable cloud features.
              </p>
              <label className="settings-label settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={cloud.syncEnabled}
                  onChange={(e) => setCloud({ ...cloud, syncEnabled: e.target.checked })}
                />
                Enable Cloud Sync
              </label>
              <label className="settings-label">
                Supabase URL
                <input
                  type="text"
                  className="settings-input"
                  value={cloud.supabaseUrl}
                  onChange={(e) => setCloud({ ...cloud, supabaseUrl: e.target.value })}
                  placeholder="https://your-project.supabase.co"
                  disabled={!cloud.syncEnabled}
                />
              </label>
              <label className="settings-label">
                Supabase Anon Key
                <input
                  type="password"
                  className="settings-input"
                  value={cloud.supabaseAnonKey}
                  onChange={(e) => setCloud({ ...cloud, supabaseAnonKey: e.target.value })}
                  placeholder="eyJ..."
                  disabled={!cloud.syncEnabled}
                />
              </label>
            </div>
          )}

          {activeTab === 'server' && (
            <div className="settings-section">
              <p className="settings-hint">
                Start an HTTP server so remote players can view the campaign map in their browser.
              </p>
              <label className="settings-label">
                Port
                <input
                  type="number"
                  className="settings-input"
                  value={serverSettings.port}
                  onChange={(e) => setServerSettings({ ...serverSettings, port: Math.max(1024, parseInt(e.target.value) || 7680) })}
                  min={1024}
                  max={65535}
                  disabled={serverStatus?.running}
                />
              </label>
              <label className="settings-label settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={serverSettings.autoStart}
                  onChange={(e) => setServerSettings({ ...serverSettings, autoStart: e.target.checked })}
                />
                Auto-start when app opens
              </label>

              <div className="settings-server-controls">
                {serverStatus?.running ? (
                  <>
                    <button
                      className="btn btn-danger"
                      onClick={handleStopServer}
                      disabled={serverLoading}
                    >
                      {serverLoading ? 'Stopping...' : 'Stop Server'}
                    </button>
                    <div className="settings-server-info">
                      <div className="settings-server-row">
                        <span className="settings-server-label">URL</span>
                        <code className="settings-server-value">{serverStatus.url}</code>
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => copyToClipboard(serverStatus.url, 'URL')}
                        >
                          Copy
                        </button>
                      </div>
                      <div className="settings-server-row">
                        <span className="settings-server-label">PIN</span>
                        <code className="settings-server-value settings-server-pin">{serverStatus.pin}</code>
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => copyToClipboard(serverStatus.pin, 'PIN')}
                        >
                          Copy
                        </button>
                      </div>
                      <div className="settings-server-row">
                        <span className="settings-server-label">Connected</span>
                        <span className="settings-server-value">{serverStatus.clientCount} player{serverStatus.clientCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleStartServer}
                    disabled={serverLoading}
                  >
                    {serverLoading ? 'Starting...' : 'Start Server'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
