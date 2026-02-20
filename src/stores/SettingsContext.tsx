// SettingsContext — React context wrapping electron-store IPC for app settings

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Settings shape
export interface AISettings {
  openaiKey: string;
  anthropicKey: string;
  preferredProvider: 'openai' | 'anthropic';
}

export interface CloudSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  syncEnabled: boolean;
}

export interface GeneralSettings {
  userName: string;
  autoSaveInterval: number;
}

export interface AppSettings {
  ai: AISettings;
  cloud: CloudSettings;
  general: GeneralSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
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
};

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  updateSettings: (section: keyof AppSettings, values: Partial<AISettings | CloudSettings | GeneralSettings>) => Promise<void>;
  setSetting: (key: string, value: unknown) => Promise<void>;
  getSetting: (key: string) => unknown;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    window.electronAPI.getSettings().then((stored) => {
      setSettings({ ...DEFAULT_SETTINGS, ...stored } as AppSettings);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  // Update an entire settings section
  const updateSettings = useCallback(async (
    section: keyof AppSettings,
    values: Partial<AISettings | CloudSettings | GeneralSettings>
  ) => {
    const updated = { ...settings[section], ...values };
    await window.electronAPI.setSetting(section, updated);
    setSettings(prev => ({ ...prev, [section]: updated }));
  }, [settings]);

  // Set a single setting by dot path (e.g., "ai.openaiKey")
  const setSettingFn = useCallback(async (key: string, value: unknown) => {
    await window.electronAPI.setSetting(key, value);
    // Update local state
    const parts = key.split('.');
    if (parts.length === 2) {
      const [section, field] = parts as [keyof AppSettings, string];
      setSettings(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    }
  }, []);

  // Get a nested setting value by dot path
  const getSettingFn = useCallback((key: string): unknown => {
    const parts = key.split('.');
    let current: unknown = settings;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }, [settings]);

  const value: SettingsContextValue = {
    settings,
    loading,
    updateSettings,
    setSetting: setSettingFn,
    getSetting: getSettingFn,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
