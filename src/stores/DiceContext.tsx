// DiceContext — session-only dice roll history (never persisted, no undo).
// Local rolls are executed here and (when visible) handed to an optional
// transport for relay to other windows/clients. Remote rolls and late-join
// history replay arrive back through the same transport's subscribe().

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { parseNotation, executeRoll } from '../services/diceService';
import type { DiceRoll, DiceAdvantage, DiceTransport, ParsedDice } from '../types';

export const DICE_HISTORY_LIMIT = 50;

interface DiceState {
  history: DiceRoll[];
}

type DiceAction =
  | { type: 'ADD_LOCAL'; roll: DiceRoll }
  | { type: 'ADD_REMOTE'; roll: DiceRoll }
  | { type: 'SET_HISTORY'; rolls: DiceRoll[] }
  | { type: 'CLEAR' };

function appendCapped(history: DiceRoll[], roll: DiceRoll): DiceRoll[] {
  const next = [...history, roll];
  if (next.length > DICE_HISTORY_LIMIT) {
    next.splice(0, next.length - DICE_HISTORY_LIMIT);
  }
  return next;
}

export function diceReducer(state: DiceState, action: DiceAction): DiceState {
  switch (action.type) {
    case 'ADD_LOCAL':
      return { history: appendCapped(state.history, action.roll) };
    case 'ADD_REMOTE': {
      if (state.history.some((r) => r.id === action.roll.id)) {
        return state;
      }
      return { history: appendCapped(state.history, action.roll) };
    }
    case 'SET_HISTORY': {
      const rolls = action.rolls;
      const capped =
        rolls.length > DICE_HISTORY_LIMIT
          ? rolls.slice(rolls.length - DICE_HISTORY_LIMIT)
          : rolls;
      return { history: capped };
    }
    case 'CLEAR':
      return { history: [] };
    default:
      return state;
  }
}

interface RollOpts {
  advantage?: DiceAdvantage;
  isHidden?: boolean;
  modifier?: number;
}

interface DiceContextValue {
  history: DiceRoll[];
  roll: (input: string | { sides: number; count: number }, opts?: RollOpts) => DiceRoll;
  addRemoteRoll: (roll: DiceRoll) => void;
  clearHistory: () => void;
}

const DiceContext = createContext<DiceContextValue | null>(null);

export function useDice(): DiceContextValue {
  const ctx = useContext(DiceContext);
  if (!ctx) {
    throw new Error('useDice must be used within a DiceProvider');
  }
  return ctx;
}

interface DiceProviderProps {
  campaignId: string | null;
  roller: DiceRoll['roller'];
  transport?: DiceTransport;
  children: ReactNode;
}

export function DiceProvider({ campaignId, roller, transport, children }: DiceProviderProps) {
  const [state, dispatch] = useReducer(diceReducer, { history: [] });

  const roll = useCallback(
    (input: string | { sides: number; count: number }, opts: RollOpts = {}): DiceRoll => {
      const parsed: ParsedDice =
        typeof input === 'string'
          ? parseNotation(input)
          : { terms: [{ count: input.count, sides: input.sides }], modifier: opts.modifier ?? 0 };

      const result = executeRoll(parsed, {
        advantage: opts.advantage,
        roller,
        isHidden: opts.isHidden,
      });

      dispatch({ type: 'ADD_LOCAL', roll: result });

      if (!result.isHidden) {
        transport?.send(result);
      }

      return result;
    },
    [roller, transport]
  );

  const addRemoteRoll = useCallback((roll: DiceRoll) => {
    dispatch({ type: 'ADD_REMOTE', roll });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  // Subscribe to the transport for remote rolls and late-join history replay.
  useEffect(() => {
    if (!transport) return;
    const unsubscribe = transport.subscribe({
      onRoll: (r) => dispatch({ type: 'ADD_REMOTE', roll: r }),
      onHistory: (rolls) => dispatch({ type: 'SET_HISTORY', rolls }),
    });
    return unsubscribe;
  }, [transport]);

  // Session-only history must not leak across campaigns.
  const campaignIdRef = useRef(campaignId);
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      campaignIdRef.current = campaignId;
      return;
    }
    if (campaignIdRef.current !== campaignId) {
      campaignIdRef.current = campaignId;
      dispatch({ type: 'CLEAR' });
    }
  }, [campaignId]);

  const value = useMemo<DiceContextValue>(
    () => ({
      history: state.history,
      roll,
      addRemoteRoll,
      clearHistory,
    }),
    [state.history, roll, addRemoteRoll, clearHistory]
  );

  return <DiceContext.Provider value={value}>{children}</DiceContext.Provider>;
}
