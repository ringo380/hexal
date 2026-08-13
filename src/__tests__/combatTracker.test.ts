import { describe, it, expect } from 'vitest';
import {
  combatReducer,
  expandEncounterCreatures,
  filterCombatForPlayer
} from '../services/combatTracker';
import { createCombatant, createCombatState } from '../types/Combat';
import type { CombatState } from '../types/Combat';
import type { CreatureEntry } from '../types/Campaign';

function activeState(names: string[], overrides: Partial<CombatState> = {}): CombatState {
  return {
    isActive: true,
    combatants: names.map(name => createCombatant({ name })),
    turnIndex: 0,
    round: 1,
    ...overrides
  };
}

describe('combatReducer', () => {
  it('starts combat with provided combatants at round 1, turn 0', () => {
    const combatants = [createCombatant({ name: 'A' }), createCombatant({ name: 'B' })];
    const state = combatReducer(createCombatState(), { type: 'START_COMBAT', combatants });
    expect(state.isActive).toBe(true);
    expect(state.combatants).toHaveLength(2);
    expect(state.round).toBe(1);
    expect(state.turnIndex).toBe(0);
  });

  it('END_COMBAT resets to inactive empty state', () => {
    const state = combatReducer(activeState(['A', 'B'], { round: 3, turnIndex: 1 }), { type: 'END_COMBAT' });
    expect(state.isActive).toBe(false);
    expect(state.combatants).toHaveLength(0);
    expect(state.round).toBe(1);
  });

  it('NEXT_TURN advances within the round', () => {
    const state = combatReducer(activeState(['A', 'B', 'C']), { type: 'NEXT_TURN' });
    expect(state.turnIndex).toBe(1);
    expect(state.round).toBe(1);
  });

  it('NEXT_TURN past the last combatant wraps to 0 and increments round', () => {
    const state = combatReducer(activeState(['A', 'B'], { turnIndex: 1 }), { type: 'NEXT_TURN' });
    expect(state.turnIndex).toBe(0);
    expect(state.round).toBe(2);
  });

  it('PREV_TURN steps back within the round', () => {
    const state = combatReducer(activeState(['A', 'B'], { turnIndex: 1 }), { type: 'PREV_TURN' });
    expect(state.turnIndex).toBe(0);
    expect(state.round).toBe(1);
  });

  it('PREV_TURN at turn 0 of round > 1 wraps to the last combatant of the previous round', () => {
    const state = combatReducer(activeState(['A', 'B', 'C'], { round: 2 }), { type: 'PREV_TURN' });
    expect(state.turnIndex).toBe(2);
    expect(state.round).toBe(1);
  });

  it('PREV_TURN at turn 0 of round 1 is a no-op', () => {
    const initial = activeState(['A', 'B']);
    const state = combatReducer(initial, { type: 'PREV_TURN' });
    expect(state.turnIndex).toBe(0);
    expect(state.round).toBe(1);
  });

  it('NEXT_TURN with no combatants is a no-op', () => {
    const initial = activeState([]);
    const state = combatReducer(initial, { type: 'NEXT_TURN' });
    expect(state.turnIndex).toBe(0);
    expect(state.round).toBe(1);
  });

  it('APPLY_HP_DELTA clamps damage at 0 and healing at maxHp', () => {
    const c = createCombatant({ name: 'Goblin', maxHp: 7, currentHp: 7 });
    let state: CombatState = { isActive: true, combatants: [c], turnIndex: 0, round: 1 };
    state = combatReducer(state, { type: 'APPLY_HP_DELTA', id: c.id, delta: -10 });
    expect(state.combatants[0].currentHp).toBe(0);
    state = combatReducer(state, { type: 'APPLY_HP_DELTA', id: c.id, delta: 3 });
    expect(state.combatants[0].currentHp).toBe(3);
    state = combatReducer(state, { type: 'APPLY_HP_DELTA', id: c.id, delta: 99 });
    expect(state.combatants[0].currentHp).toBe(7);
  });

  it('APPLY_HP_DELTA on a null-HP combatant leaves HP null', () => {
    const c = createCombatant({ name: 'PC' });
    const state = combatReducer(
      { isActive: true, combatants: [c], turnIndex: 0, round: 1 },
      { type: 'APPLY_HP_DELTA', id: c.id, delta: -5 }
    );
    expect(state.combatants[0].currentHp).toBeNull();
  });

  it('TOGGLE_CONDITION adds then removes a condition', () => {
    const c = createCombatant({ name: 'Goblin' });
    let state: CombatState = { isActive: true, combatants: [c], turnIndex: 0, round: 1 };
    state = combatReducer(state, { type: 'TOGGLE_CONDITION', id: c.id, condition: 'Poisoned' });
    expect(state.combatants[0].conditions).toEqual(['Poisoned']);
    state = combatReducer(state, { type: 'TOGGLE_CONDITION', id: c.id, condition: 'Poisoned' });
    expect(state.combatants[0].conditions).toEqual([]);
  });

  it('REORDER moves a combatant and keeps the current-turn combatant current', () => {
    const initial = activeState(['A', 'B', 'C'], { turnIndex: 1 }); // B's turn
    const currentId = initial.combatants[1].id;
    // Move A (index 0) to the end
    const state = combatReducer(initial, { type: 'REORDER', fromIndex: 0, toIndex: 2 });
    expect(state.combatants.map(c => c.name)).toEqual(['B', 'C', 'A']);
    expect(state.combatants[state.turnIndex].id).toBe(currentId);
  });

  it('SORT_BY_INITIATIVE orders descending and keeps the current combatant current', () => {
    const a = createCombatant({ name: 'A', initiative: 5 });
    const b = createCombatant({ name: 'B', initiative: 20 });
    const c = createCombatant({ name: 'C', initiative: 12 });
    const initial: CombatState = { isActive: true, combatants: [a, b, c], turnIndex: 2, round: 1 };
    const state = combatReducer(initial, { type: 'SORT_BY_INITIATIVE' });
    expect(state.combatants.map(x => x.name)).toEqual(['B', 'C', 'A']);
    expect(state.combatants[state.turnIndex].id).toBe(c.id);
  });

  it('REMOVE_COMBATANT before the current turn shifts turnIndex back', () => {
    const initial = activeState(['A', 'B', 'C'], { turnIndex: 2 });
    const state = combatReducer(initial, { type: 'REMOVE_COMBATANT', id: initial.combatants[0].id });
    expect(state.combatants.map(c => c.name)).toEqual(['B', 'C']);
    expect(state.turnIndex).toBe(1);
    expect(state.combatants[state.turnIndex].name).toBe('C');
  });

  it('REMOVE_COMBATANT of the last combatant while it is current wraps turnIndex to 0', () => {
    const initial = activeState(['A', 'B'], { turnIndex: 1 });
    const state = combatReducer(initial, { type: 'REMOVE_COMBATANT', id: initial.combatants[1].id });
    expect(state.turnIndex).toBe(0);
  });

  it('UPDATE_COMBATANT setting maxHp on a null-HP combatant initializes currentHp', () => {
    const c = createCombatant({ name: 'PC' });
    const state = combatReducer(
      { isActive: true, combatants: [c], turnIndex: 0, round: 1 },
      { type: 'UPDATE_COMBATANT', id: c.id, changes: { maxHp: 30 } }
    );
    expect(state.combatants[0].maxHp).toBe(30);
    expect(state.combatants[0].currentHp).toBe(30);
  });
});

describe('expandEncounterCreatures', () => {
  const creatures: CreatureEntry[] = [
    { id: 'c1', name: 'Goblin', count: 3, cr: '1/4', maxHp: 7 },
    { id: 'c2', name: 'Bugbear', count: 1, cr: '1' }
  ];

  it('expands by count with numbered names and prefilled HP', () => {
    const combatants = expandEncounterCreatures(creatures, 'enc-1');
    expect(combatants.map(c => c.name)).toEqual(['Goblin 1', 'Goblin 2', 'Goblin 3', 'Bugbear']);
    expect(combatants[0].maxHp).toBe(7);
    expect(combatants[0].currentHp).toBe(7);
    expect(combatants[3].maxHp).toBeNull();
    expect(combatants.every(c => c.kind === 'creature')).toBe(true);
    expect(combatants.every(c => c.sourceId === 'enc-1')).toBe(true);
  });

  it('treats a non-positive count as 1', () => {
    const combatants = expandEncounterCreatures([{ id: 'x', name: 'Wolf', count: 0 }], 'enc-2');
    expect(combatants.map(c => c.name)).toEqual(['Wolf']);
  });
});

describe('filterCombatForPlayer', () => {
  it('returns null when combat is inactive', () => {
    expect(filterCombatForPlayer(createCombatState())).toBeNull();
  });

  it('strips HP and hidden combatants, and flags the current turn by id', () => {
    const visible1 = createCombatant({ name: 'Fighter', kind: 'pc', maxHp: 30, currentHp: 12 });
    const hidden = createCombatant({ name: 'Assassin', isVisibleToPlayers: false });
    const visible2 = createCombatant({ name: 'Goblin', maxHp: 7, currentHp: 7 });
    const state: CombatState = {
      isActive: true,
      combatants: [visible1, hidden, visible2],
      turnIndex: 2, // Goblin's turn
      round: 4
    };
    const filtered = filterCombatForPlayer(state);
    expect(filtered).not.toBeNull();
    expect(filtered!.round).toBe(4);
    expect(filtered!.combatants.map(c => c.name)).toEqual(['Fighter', 'Goblin']);
    expect(filtered!.combatants.find(c => c.name === 'Goblin')!.isCurrentTurn).toBe(true);
    expect(filtered!.combatants.find(c => c.name === 'Fighter')!.isCurrentTurn).toBe(false);
    const asRecords = filtered!.combatants as unknown as Record<string, unknown>[];
    for (const c of asRecords) {
      expect(c).not.toHaveProperty('currentHp');
      expect(c).not.toHaveProperty('maxHp');
      expect(c).not.toHaveProperty('sourceId');
    }
  });

  it('marks no combatant current when the current turn belongs to a hidden combatant', () => {
    const hidden = createCombatant({ name: 'Lurker', isVisibleToPlayers: false });
    const visible = createCombatant({ name: 'Cleric', kind: 'pc' });
    const state: CombatState = { isActive: true, combatants: [hidden, visible], turnIndex: 0, round: 1 };
    const filtered = filterCombatForPlayer(state);
    expect(filtered!.combatants.every(c => !c.isCurrentTurn)).toBe(true);
  });
});
