// CampaignContext - Main state management for campaign data
// Direct port from Swift CampaignStore using React Context + useReducer

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { Campaign, Hex, HexCoordinate } from '../types';
import { createCampaign, createHex, coordinateKey } from '../types';

// Save status enum
export type SaveStatus = 'saved' | 'saving' | 'unsaved';

// History limit to prevent memory bloat
const MAX_HISTORY_SIZE = 50;

// Campaign store state
interface CampaignState {
  campaign: Campaign | null;
  currentFilePath: string | null;
  saveStatus: SaveStatus;
  hasUnsavedChanges: boolean;
  past: Campaign[];    // Previous states for undo
  future: Campaign[];  // States for redo
}

// Actions
type CampaignAction =
  | { type: 'SET_CAMPAIGN'; campaign: Campaign | null; filePath?: string }
  | { type: 'UPDATE_HEX'; hex: Hex }
  | { type: 'UPDATE_CAMPAIGN'; updates: Partial<Campaign> }
  | { type: 'MARK_SAVED'; filePath?: string }
  | { type: 'MARK_SAVING' }
  | { type: 'MARK_CHANGED' }
  | { type: 'CLOSE_CAMPAIGN' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// Initial state
const initialState: CampaignState = {
  campaign: null,
  currentFilePath: null,
  saveStatus: 'saved',
  hasUnsavedChanges: false,
  past: [],
  future: []
};

// Reducer
function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case 'SET_CAMPAIGN':
      return {
        ...state,
        campaign: action.campaign,
        currentFilePath: action.filePath ?? null,
        saveStatus: 'saved',
        hasUnsavedChanges: false,
        past: [],    // Clear history on new/load campaign
        future: []
      };

    case 'UPDATE_HEX': {
      if (!state.campaign) return state;
      const key = coordinateKey(action.hex.coordinate);
      // Save current state to history before mutation
      const newPast = [...state.past, state.campaign].slice(-MAX_HISTORY_SIZE);
      return {
        ...state,
        campaign: {
          ...state.campaign,
          hexes: {
            ...state.campaign.hexes,
            [key]: action.hex
          },
          modifiedAt: new Date().toISOString()
        },
        saveStatus: 'unsaved',
        hasUnsavedChanges: true,
        past: newPast,
        future: []  // Clear redo stack on new action
      };
    }

    case 'UPDATE_CAMPAIGN': {
      if (!state.campaign) return state;
      // Save current state to history before mutation
      const newPast = [...state.past, state.campaign].slice(-MAX_HISTORY_SIZE);
      return {
        ...state,
        campaign: {
          ...state.campaign,
          ...action.updates,
          modifiedAt: new Date().toISOString()
        },
        saveStatus: 'unsaved',
        hasUnsavedChanges: true,
        past: newPast,
        future: []  // Clear redo stack on new action
      };
    }

    case 'MARK_SAVED':
      return {
        ...state,
        currentFilePath: action.filePath ?? state.currentFilePath,
        saveStatus: 'saved',
        hasUnsavedChanges: false
      };

    case 'MARK_SAVING':
      return {
        ...state,
        saveStatus: 'saving'
      };

    case 'MARK_CHANGED':
      return {
        ...state,
        saveStatus: 'unsaved',
        hasUnsavedChanges: true
      };

    case 'CLOSE_CAMPAIGN':
      return initialState;

    case 'UNDO': {
      if (state.past.length === 0 || !state.campaign) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        ...state,
        campaign: previous,
        past: newPast,
        future: [state.campaign, ...state.future],
        saveStatus: 'unsaved',
        hasUnsavedChanges: true
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        ...state,
        campaign: next,
        past: [...state.past, state.campaign!],
        future: newFuture,
        saveStatus: 'unsaved',
        hasUnsavedChanges: true
      };
    }

    default:
      return state;
  }
}

// Context type
interface CampaignContextValue {
  state: CampaignState;
  // Campaign operations
  newCampaign: (name: string, width: number, height: number) => void;
  loadCampaign: (filePath: string) => Promise<void>;
  saveCampaign: () => Promise<void>;
  saveAs: () => Promise<void>;
  closeCampaign: () => void;
  // Hex operations
  getHex: (coord: HexCoordinate) => Hex | undefined;
  getOrCreateHex: (coord: HexCoordinate) => Hex;
  updateHex: (hex: Hex) => void;
  // Undo/Redo operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Campaign data
  campaign: Campaign | null;
  saveStatus: SaveStatus;
  hasUnsavedChanges: boolean;
  currentFilePath: string | null;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

// Provider component
export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(campaignReducer, initialState);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Autosave effect (2 second debounce)
  useEffect(() => {
    if (state.hasUnsavedChanges && state.campaign) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for autosave
      saveTimeoutRef.current = setTimeout(async () => {
        if (state.campaign) {
          dispatch({ type: 'MARK_SAVING' });
          try {
            const result = await window.electronAPI.saveCampaign(
              state.campaign,
              state.currentFilePath ?? undefined
            );
            if (result.success) {
              dispatch({ type: 'MARK_SAVED', filePath: result.path });
            }
          } catch (error) {
            console.error('Autosave failed:', error);
            dispatch({ type: 'MARK_CHANGED' });
          }
        }
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.hasUnsavedChanges, state.campaign, state.currentFilePath]);

  // Create new campaign
  const newCampaign = useCallback((name: string, width: number, height: number) => {
    const campaign = createCampaign(name, width, height);
    dispatch({ type: 'SET_CAMPAIGN', campaign });
  }, []);

  // Load campaign from file
  const loadCampaign = useCallback(async (filePath: string) => {
    try {
      const result = await window.electronAPI.loadCampaign(filePath);
      if (result.success && result.campaign) {
        dispatch({
          type: 'SET_CAMPAIGN',
          campaign: result.campaign as Campaign,
          filePath: result.path
        });
      } else {
        throw new Error(result.error || 'Failed to load campaign');
      }
    } catch (error) {
      console.error('Load failed:', error);
      throw error;
    }
  }, []);

  // Save campaign
  const saveCampaign = useCallback(async () => {
    if (!state.campaign) return;

    dispatch({ type: 'MARK_SAVING' });
    try {
      const result = await window.electronAPI.saveCampaign(
        state.campaign,
        state.currentFilePath ?? undefined
      );
      if (result.success) {
        dispatch({ type: 'MARK_SAVED', filePath: result.path });
      } else {
        throw new Error(result.error || 'Failed to save campaign');
      }
    } catch (error) {
      console.error('Save failed:', error);
      dispatch({ type: 'MARK_CHANGED' });
      throw error;
    }
  }, [state.campaign, state.currentFilePath]);

  // Save As - prompt for new location
  const saveAs = useCallback(async () => {
    if (!state.campaign) return;

    const filePath = await window.electronAPI.saveAsDialog(state.campaign.name);
    if (!filePath) return; // User cancelled

    dispatch({ type: 'MARK_SAVING' });
    try {
      const result = await window.electronAPI.saveCampaign(state.campaign, filePath);
      if (result.success) {
        dispatch({ type: 'MARK_SAVED', filePath: result.path });
      } else {
        throw new Error(result.error || 'Failed to save campaign');
      }
    } catch (error) {
      console.error('Save As failed:', error);
      dispatch({ type: 'MARK_CHANGED' });
      throw error;
    }
  }, [state.campaign]);

  // Close campaign
  const closeCampaign = useCallback(() => {
    dispatch({ type: 'CLOSE_CAMPAIGN' });
  }, []);

  // Get hex at coordinate
  const getHex = useCallback((coord: HexCoordinate): Hex | undefined => {
    if (!state.campaign) return undefined;
    return state.campaign.hexes[coordinateKey(coord)];
  }, [state.campaign]);

  // Get or create hex at coordinate
  const getOrCreateHex = useCallback((coord: HexCoordinate): Hex => {
    if (!state.campaign) {
      return createHex(coord);
    }
    const existing = state.campaign.hexes[coordinateKey(coord)];
    if (existing) return existing;

    const newHex = createHex(coord);
    dispatch({ type: 'UPDATE_HEX', hex: newHex });
    return newHex;
  }, [state.campaign]);

  // Update hex
  const updateHex = useCallback((hex: Hex) => {
    dispatch({ type: 'UPDATE_HEX', hex });
  }, []);

  // Undo
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  // Redo
  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  // Computed values for undo/redo availability
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const value: CampaignContextValue = {
    state,
    newCampaign,
    loadCampaign,
    saveCampaign,
    saveAs,
    closeCampaign,
    getHex,
    getOrCreateHex,
    updateHex,
    undo,
    redo,
    canUndo,
    canRedo,
    campaign: state.campaign,
    saveStatus: state.saveStatus,
    hasUnsavedChanges: state.hasUnsavedChanges,
    currentFilePath: state.currentFilePath
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

// Hook to use campaign context
export function useCampaign(): CampaignContextValue {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}
