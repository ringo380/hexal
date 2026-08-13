import { describe, it, expect } from 'vitest';
import { diceReducer, DICE_HISTORY_LIMIT, type DiceState } from './DiceContext';
import type { DiceRoll } from '../types';

function makeRoll(overrides: Partial<DiceRoll> = {}): DiceRoll {
  return {
    id: overrides.id ?? `roll-${Math.random().toString(36).slice(2)}`,
    notation: '1d20',
    rolls: [{ sides: 20, value: 10 }],
    modifier: 0,
    total: 10,
    advantage: 'none',
    roller: { kind: 'dm', name: 'DM' },
    isHidden: false,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('diceReducer', () => {
  it('ADD_LOCAL appends a roll to history', () => {
    const state = { history: [] as DiceRoll[], lastRemoteRoll: null };
    const roll = makeRoll();
    const next = diceReducer(state, { type: 'ADD_LOCAL', roll });
    expect(next.history).toEqual([roll]);
  });

  it('ADD_LOCAL never sets lastRemoteRoll', () => {
    const state = { history: [] as DiceRoll[], lastRemoteRoll: null };
    const roll = makeRoll();
    const next = diceReducer(state, { type: 'ADD_LOCAL', roll });
    expect(next.lastRemoteRoll).toBeNull();
  });

  it('ADD_REMOTE appends a roll to history', () => {
    const state = { history: [] as DiceRoll[], lastRemoteRoll: null };
    const roll = makeRoll();
    const next = diceReducer(state, { type: 'ADD_REMOTE', roll });
    expect(next.history).toEqual([roll]);
  });

  it('ADD_REMOTE sets lastRemoteRoll to the appended roll', () => {
    const state = { history: [] as DiceRoll[], lastRemoteRoll: null };
    const roll = makeRoll();
    const next = diceReducer(state, { type: 'ADD_REMOTE', roll });
    expect(next.lastRemoteRoll).toEqual(roll);
  });

  it('caps history at DICE_HISTORY_LIMIT, dropping the oldest', () => {
    let state: DiceState = { history: [], lastRemoteRoll: null };
    const rolls = Array.from({ length: DICE_HISTORY_LIMIT + 5 }, (_, i) =>
      makeRoll({ id: `roll-${i}` })
    );
    for (const roll of rolls) {
      state = diceReducer(state, { type: 'ADD_LOCAL', roll });
    }
    expect(state.history).toHaveLength(DICE_HISTORY_LIMIT);
    // Oldest 5 dropped, newest retained in order
    expect(state.history[0].id).toBe('roll-5');
    expect(state.history[state.history.length - 1].id).toBe(
      `roll-${DICE_HISTORY_LIMIT + 4}`
    );
  });

  it('ADD_REMOTE with a duplicate id is a no-op (relay echo safety)', () => {
    const roll = makeRoll({ id: 'dup-1' });
    const state = { history: [roll], lastRemoteRoll: null };
    const next = diceReducer(state, { type: 'ADD_REMOTE', roll: { ...roll } });
    expect(next.history).toHaveLength(1);
    expect(next).toBe(state); // no-op returns same reference
  });

  it('duplicate ADD_REMOTE leaves lastRemoteRoll untouched', () => {
    const roll = makeRoll({ id: 'dup-2' });
    const previousRemote = makeRoll({ id: 'earlier-remote' });
    const state = { history: [roll], lastRemoteRoll: previousRemote };
    const next = diceReducer(state, { type: 'ADD_REMOTE', roll: { ...roll } });
    expect(next.lastRemoteRoll).toBe(previousRemote);
  });

  it('ADD_REMOTE with an id duplicating an existing ADD_LOCAL entry is a no-op', () => {
    let state = { history: [] as DiceRoll[], lastRemoteRoll: null as DiceRoll | null };
    const localRoll = makeRoll({ id: 'shared-id' });
    state = diceReducer(state, { type: 'ADD_LOCAL', roll: localRoll });

    const echoedRoll = makeRoll({ id: 'shared-id', total: 999 });
    const next = diceReducer(state, { type: 'ADD_REMOTE', roll: echoedRoll });

    expect(next.history).toHaveLength(1);
    expect(next.history[0]).toEqual(localRoll);
    expect(next.lastRemoteRoll).toBeNull();
  });

  it('SET_HISTORY replaces history wholesale', () => {
    const state = { history: [makeRoll({ id: 'old' })], lastRemoteRoll: null };
    const rolls = [makeRoll({ id: 'a' }), makeRoll({ id: 'b' })];
    const next = diceReducer(state, { type: 'SET_HISTORY', rolls });
    expect(next.history).toEqual(rolls);
  });

  it('SET_HISTORY leaves lastRemoteRoll untouched', () => {
    const previousRemote = makeRoll({ id: 'earlier-remote' });
    const state = { history: [makeRoll({ id: 'old' })], lastRemoteRoll: previousRemote };
    const rolls = [makeRoll({ id: 'a' })];
    const next = diceReducer(state, { type: 'SET_HISTORY', rolls });
    expect(next.lastRemoteRoll).toBe(previousRemote);
  });

  it('SET_HISTORY caps at DICE_HISTORY_LIMIT', () => {
    const state = { history: [] as DiceRoll[], lastRemoteRoll: null };
    const rolls = Array.from({ length: DICE_HISTORY_LIMIT + 10 }, (_, i) =>
      makeRoll({ id: `roll-${i}` })
    );
    const next = diceReducer(state, { type: 'SET_HISTORY', rolls });
    expect(next.history).toHaveLength(DICE_HISTORY_LIMIT);
  });

  it('CLEAR empties history', () => {
    const state = { history: [makeRoll(), makeRoll()], lastRemoteRoll: null };
    const next = diceReducer(state, { type: 'CLEAR' });
    expect(next.history).toEqual([]);
  });

  it('CLEAR resets lastRemoteRoll to null', () => {
    const state = { history: [makeRoll()], lastRemoteRoll: makeRoll({ id: 'remote' }) };
    const next = diceReducer(state, { type: 'CLEAR' });
    expect(next.lastRemoteRoll).toBeNull();
  });
});
