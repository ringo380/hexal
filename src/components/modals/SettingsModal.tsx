// SettingsModal — Tabbed settings UI (General, AI, Cloud)

import { useState } from 'react';
import { useSettings } from '../../stores/SettingsContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { AISettings, CloudSettings, GeneralSettings } from '../../stores/SettingsContext';

interface SettingsModalProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'ai' | 'cloud';

function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Local state for editing (commit on blur/save)
  const [general, setGeneral] = useState<GeneralSettings>({ ...settings.general });
  const [ai, setAI] = useState<AISettings>({ ...settings.ai });
  const [cloud, setCloud] = useState<CloudSettings>({ ...settings.cloud });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings('general', general);
      await updateSettings('ai', ai);
      await updateSettings('cloud', cloud);
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'ai', label: 'AI' },
    { id: 'cloud', label: 'Cloud' },
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
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
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
                Cloud sync requires a Supabase project. These fields are optional — the app works fully offline without them.
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
