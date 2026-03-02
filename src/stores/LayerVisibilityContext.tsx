// LayerVisibilityContext - Map layer toggles and weather audio settings

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { LayerVisibility } from '../types';
import { DEFAULT_LAYER_VISIBILITY } from '../types';

interface LayerVisibilityContextValue {
  layerVisibility: LayerVisibility;
  toggleLayer: (key: keyof LayerVisibility) => void;
  setLayerVisibility: (vis: LayerVisibility) => void;
  weatherAudioEnabled: boolean;
  weatherAudioVolume: number;
  setWeatherAudioEnabled: (enabled: boolean) => void;
  setWeatherAudioVolume: (volume: number) => void;
}

const LayerVisibilityContext = createContext<LayerVisibilityContextValue | null>(null);

export function LayerVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [layerVisibility, setLayerVisibilityState] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY);
  const [weatherAudioEnabled, setWeatherAudioEnabled] = useState(false);
  const [weatherAudioVolume, setWeatherAudioVolume] = useState(0.5);

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayerVisibilityState(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setLayerVisibility = useCallback((vis: LayerVisibility) => {
    setLayerVisibilityState(vis);
  }, []);

  const value: LayerVisibilityContextValue = {
    layerVisibility,
    toggleLayer,
    setLayerVisibility,
    weatherAudioEnabled,
    weatherAudioVolume,
    setWeatherAudioEnabled,
    setWeatherAudioVolume,
  };

  return (
    <LayerVisibilityContext.Provider value={value}>
      {children}
    </LayerVisibilityContext.Provider>
  );
}

export function useLayerVisibility(): LayerVisibilityContextValue {
  const context = useContext(LayerVisibilityContext);
  if (!context) {
    throw new Error('useLayerVisibility must be used within a LayerVisibilityProvider');
  }
  return context;
}
