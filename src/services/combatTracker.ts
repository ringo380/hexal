// Combat tracker logic: pure reducer over session-only CombatState, plus
// helpers for quick-adding encounter creatures and filtering state for
// player views. Never touches the campaign file or undo history.

import type { Combatant, CombatState, PlayerCombatState } from '../types/Combat';
import { createCombatant, createCombatState } from '../types/Combat';
import type { CreatureEntry } from '../types/Campaign';

export type CombatAction =
  | { type: 'START_COMBAT'; combatants: Combatant[] }
  | { type: 'END_COMBAT' }
  | { type: 'ADD_COMBATANTS'; combatants: Combatant[] }
  | { type: 'REMOVE_COMBATANT'; id: string }
  | { type: 'UPDATE_COMBATANT'; id: string; changes: Partial<Omit<Combatant, 'id'>> }
  | { type: 'APPLY_HP_DELTA'; id: string; delta: number }
  | { type: 'TOGGLE_CONDITION'; id: string; condition: string }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'SORT_BY_INITIATIVE' }
  | { type: 'NEXT_TURN' }
  | { type: 'PREV_TURN' };

function clampHp(hp: number, maxHp: number | null): number {
  const upper = maxHp ?? Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.min(hp, upper));
}

// Recompute turnIndex so the same combatant stays current after a reorder
function retargetTurn(combatants: Combatant[], currentId: string | undefined): number {
  if (!currentId) return 0;
  const idx = combatants.findIndex(c => c.id === currentId);
  return idx >= 0 ? idx : 0;
}

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  switch (action.type) {
    case 'START_COMBAT':
      return { isActive: true, combatants: action.combatants, turnIndex: 0, round: 1 };

    case 'END_COMBAT':
      return createCombatState();

    case 'ADD_COMBATANTS':
      return { ...state, combatants: [...state.combatants, ...action.combatants] };

    case 'REMOVE_COMBATANT': {
      const removeIdx = state.combatants.findIndex(c => c.id === action.id);
      if (removeIdx < 0) return state;
      const combatants = state.combatants.filter(c => c.id !== action.id);
      let turnIndex = state.turnIndex;
      if (removeIdx < turnIndex) turnIndex--;
      if (turnIndex >= combatants.length) turnIndex = 0;
      return { ...state, combatants, turnIndex };
    }

    case 'UPDATE_COMBATANT':
      return {
        ...state,
        combatants: state.combatants.map(c => {
          if (c.id !== action.id) return c;
          const next = { ...c, ...action.changes };
          // Setting maxHp on a previously untracked combatant starts it at full;
          // an existing currentHp is re-clamped to the new max
          if (action.changes.maxHp !== undefined && next.maxHp !== null) {
            next.currentHp = next.currentHp === null ? next.maxHp : clampHp(next.currentHp, next.maxHp);
          }
          return next;
        })
      };

    case 'APPLY_HP_DELTA':
      return {
        ...state,
        combatants: state.combatants.map(c =>
          c.id === action.id && c.currentHp !== null
            ? { ...c, currentHp: clampHp(c.currentHp + action.delta, c.maxHp) }
            : c
        )
      };

    case 'TOGGLE_CONDITION':
      return {
        ...state,
        combatants: state.combatants.map(c =>
          c.id === action.id
            ? {
                ...c,
                conditions: c.conditions.includes(action.condition)
                  ? c.conditions.filter(x => x !== action.condition)
                  : [...c.conditions, action.condition]
              }
            : c
        )
      };

    case 'REORDER': {
      const { fromIndex, toIndex } = action;
      if (
        fromIndex === toIndex ||
        fromIndex < 0 || fromIndex >= state.combatants.length ||
        toIndex < 0 || toIndex >= state.combatants.length
      ) {
        return state;
      }
      const currentId = state.combatants[state.turnIndex]?.id;
      const combatants = [...state.combatants];
      const [moved] = combatants.splice(fromIndex, 1);
      combatants.splice(toIndex, 0, moved);
      return { ...state, combatants, turnIndex: retargetTurn(combatants, currentId) };
    }

    case 'SORT_BY_INITIATIVE': {
      const currentId = state.combatants[state.turnIndex]?.id;
      const combatants = [...state.combatants].sort((a, b) => b.initiative - a.initiative);
      return { ...state, combatants, turnIndex: retargetTurn(combatants, currentId) };
    }

    case 'NEXT_TURN': {
      if (state.combatants.length === 0) return state;
      const next = state.turnIndex + 1;
      if (next >= state.combatants.length) {
        return { ...state, turnIndex: 0, round: state.round + 1 };
      }
      return { ...state, turnIndex: next };
    }

    case 'PREV_TURN': {
      if (state.combatants.length === 0) return state;
      if (state.turnIndex > 0) {
        return { ...state, turnIndex: state.turnIndex - 1 };
      }
      if (state.round > 1) {
        return { ...state, turnIndex: state.combatants.length - 1, round: state.round - 1 };
      }
      return state;
    }

    default:
      return state;
  }
}

// Expand an encounter's creature entries into individual combatants:
// count > 1 produces numbered names ("Goblin 1", "Goblin 2", ...)
export function expandEncounterCreatures(creatures: CreatureEntry[], encounterId: string): Combatant[] {
  const combatants: Combatant[] = [];
  for (const entry of creatures) {
    const count = Math.max(1, entry.count);
    for (let i = 0; i < count; i++) {
      const maxHp = entry.maxHp ?? null;
      combatants.push(
        createCombatant({
          name: count > 1 ? `${entry.name} ${i + 1}` : entry.name,
          kind: 'creature',
          maxHp,
          currentHp: maxHp,
          sourceId: encounterId
        })
      );
    }
  }
  return combatants;
}

// Strip DM-only data before sending to player views: hidden combatants are
// removed entirely and HP never leaves the DM side. The current turn is
// flagged by id (not index) so hidden combatants can't shift the highlight.
export function filterCombatForPlayer(state: CombatState): PlayerCombatState | null {
  if (!state.isActive) return null;
  const currentId = state.combatants[state.turnIndex]?.id;
  return {
    round: state.round,
    combatants: state.combatants
      .filter(c => c.isVisibleToPlayers)
      .map(c => ({
        id: c.id,
        name: c.name,
        kind: c.kind,
        conditions: c.conditions,
        isCurrentTurn: c.id === currentId
      }))
  };
}
