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
      getDiceHistory: vi.fn(() => Promise.resolve([])),
    };

    const transport = createElectronDiceTransport();
    expect(transport).toBeDefined();
    transport?.send(sampleRoll);
    expect(sendDiceRoll).toHaveBeenCalledWith(sampleRoll);
  });

  it('wires subscribe() to onDiceRoll and pulls history via getDiceHistory', async () => {
    const unsubRoll = vi.fn();
    const onDiceRoll = vi.fn(() => unsubRoll);
    const getDiceHistory = vi.fn(() => Promise.resolve([sampleRoll]));
    // @ts-expect-error - partial mock, only fields exercised by the transport
    window.electronAPI = {
      sendDiceRoll: vi.fn(),
      onDiceRoll,
      getDiceHistory,
    };

    const transport = createElectronDiceTransport();
    const onRoll = vi.fn();
    const onHistory = vi.fn();
    const unsubscribe = transport!.subscribe({ onRoll, onHistory });

    expect(onDiceRoll).toHaveBeenCalledWith(onRoll);
    expect(getDiceHistory).toHaveBeenCalledTimes(1);

    // getDiceHistory resolves asynchronously
    await Promise.resolve();
    await Promise.resolve();
    expect(onHistory).toHaveBeenCalledWith([sampleRoll]);

    unsubscribe();
    expect(unsubRoll).toHaveBeenCalledTimes(1);
  });

  it('does not call onHistory when getDiceHistory resolves empty', async () => {
    const getDiceHistory = vi.fn(() => Promise.resolve([]));
    // @ts-expect-error - partial mock, only fields exercised by the transport
    window.electronAPI = {
      sendDiceRoll: vi.fn(),
      onDiceRoll: vi.fn(() => () => {}),
      getDiceHistory,
    };

    const transport = createElectronDiceTransport();
    const onHistory = vi.fn();
    transport!.subscribe({ onRoll: vi.fn(), onHistory });

    await Promise.resolve();
    await Promise.resolve();
    expect(onHistory).not.toHaveBeenCalled();
  });

  it('ignores a late getDiceHistory resolution after unsubscribe', async () => {
    let resolveHistory: (rolls: DiceRoll[]) => void;
    const getDiceHistory = vi.fn(
      () => new Promise<DiceRoll[]>((resolve) => { resolveHistory = resolve; })
    );
    // @ts-expect-error - partial mock, only fields exercised by the transport
    window.electronAPI = {
      sendDiceRoll: vi.fn(),
      onDiceRoll: vi.fn(() => () => {}),
      getDiceHistory,
    };

    const transport = createElectronDiceTransport();
    const onHistory = vi.fn();
    const unsubscribe = transport!.subscribe({ onRoll: vi.fn(), onHistory });
    unsubscribe();

    resolveHistory!([sampleRoll]);
    await Promise.resolve();
    await Promise.resolve();
    expect(onHistory).not.toHaveBeenCalled();
  });
});
