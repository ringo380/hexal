// CombatContext - session-only combat tracker state (never persisted).
// Pushes a filtered view to player windows/web clients whenever state
// changes, and ends combat on campaign switch or close.

import { createContext, useContext, useReducer, useMemo, useEffect, useRef } from 'react';
import type { ReactNode, Dispatch } from 'react';
import { combatReducer, filterCombatForPlayer } from '../services/combatTracker';
import type { CombatAction } from '../services/combatTracker';
import { createCombatState } from '../types/Combat';
import type { CombatState } from '../types/Combat';
import { useCampaign } from './CampaignContext';

interface CombatContextValue {
  combat: CombatState;
  dispatch: Dispatch<CombatAction>;
}

const CombatContext = createContext<CombatContextValue | null>(null);

export function CombatProvider({ children }: { children: ReactNode }) {
  const { campaign } = useCampaign();
  const [combat, dispatch] = useReducer(combatReducer, undefined, createCombatState);

  // End combat when the campaign changes (session-only state must not leak
  // across campaigns)
  const campaignIdRef = useRef(campaign?.id);
  useEffect(() => {
    if (campaignIdRef.current !== campaign?.id) {
      campaignIdRef.current = campaign?.id;
      dispatch({ type: 'END_COMBAT' });
    }
  }, [campaign?.id]);

  // Sync filtered combat state to player views on change; send the end
  // signal when combat transitions active -> inactive. DM-only edits (HP,
  // initiative values) produce byte-identical filtered payloads, so dedupe
  // on the serialized form to avoid flooding IPC and web clients.
  const wasActiveRef = useRef(false);
  const lastSentRef = useRef<string | null>(null);
  useEffect(() => {
    if (combat.isActive) {
      const filtered = filterCombatForPlayer(combat);
      if (filtered) {
        const serialized = JSON.stringify(filtered);
        if (serialized !== lastSentRef.current) {
          lastSentRef.current = serialized;
          window.electronAPI?.combatUpdate(filtered);
        }
      }
    } else if (wasActiveRef.current) {
      lastSentRef.current = null;
      window.electronAPI?.combatEnd();
    }
    wasActiveRef.current = combat.isActive;
  }, [combat]);

  // Clear player displays if the provider unmounts mid-combat (campaign close)
  useEffect(() => {
    return () => {
      if (wasActiveRef.current) window.electronAPI?.combatEnd();
    };
  }, []);

  const value = useMemo(() => ({ combat, dispatch }), [combat]);
  return <CombatContext.Provider value={value}>{children}</CombatContext.Provider>;
}

export function useCombat(): CombatContextValue {
  const ctx = useContext(CombatContext);
  if (!ctx) throw new Error('useCombat must be used within CombatProvider');
  return ctx;
}
