import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElectronDiceTransport } from './diceTransport';
import type { DiceRoll } from '../types';

const sampleRoll: DiceRoll = {
  id: 'r1',
  notation: '1d20',
  rolls: [{ sides: 20, value: 15 }],
  modifier: 0,
  total: 15,
  advantage: 'none',
  roller: { kind: 'dm', name: 'DM' },
  isHidden: false,
  timestamp: 1,
};

describe('createElectronDiceTransport', () => {
  afterEach(() => {
    // @ts-expect-error - test cleanup of a global set up per-test
    delete window.electronAPI;
  });

  it('returns undefined when window.electronAPI.sendDiceRoll is absent', () => {
    // @ts-expect-error - simulating the web bundle / test environment
    window.electronAPI = {};
    expect(createElectronDiceTransport()).toBeUndefined();
  });

  it('returns undefined when window.electronAPI itself is absent', () => {
    expect(createElectronDiceTransport()).toBeUndefined();
  });

  it('wires send() to window.electronAPI.sendDiceRoll', () => {
    const sendDiceRoll = vi.fn();
    // @ts-expect-error - partial mock, only fields exercised by the transport
    window.electronAPI = {
      sendDiceRoll,
      onDiceRoll: vi.fn(() => () => {}),
      onDiceHistory: vi.fn(() => () => {}),
    };

    const transport = createElectronDiceTransport();
    expect(transport).toBeDefined();
    transport?.send(sampleRoll);
    expect(sendDiceRoll).toHaveBeenCalledWith(sampleRoll);
  });

  it('wires subscribe() to onDiceRoll and onDiceHistory, and combines unsubscribe', () => {
    const unsubRoll = vi.fn();
    const unsubHistory = vi.fn();
    const onDiceRoll = vi.fn(() => unsubRoll);
    const onDiceHistory = vi.fn(() => unsubHistory);
    // @ts-expect-error - partial mock, only fields exercised by the transport
    window.electronAPI = {
      sendDiceRoll: vi.fn(),
      onDiceRoll,
      onDiceHistory,
    };

    const transport = createElectronDiceTransport();
    const onRoll = vi.fn();
    const onHistory = vi.fn();
    const unsubscribe = transport!.subscribe({ onRoll, onHistory });

    expect(onDiceRoll).toHaveBeenCalledWith(onRoll);
    expect(onDiceHistory).toHaveBeenCalledWith(onHistory);

    unsubscribe();
    expect(unsubRoll).toHaveBeenCalledTimes(1);
    expect(unsubHistory).toHaveBeenCalledTimes(1);
  });
});
