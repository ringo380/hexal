import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DiceProvider, useDice } from './DiceContext';
import { DiceParseError } from '../services/diceService';
import type { DiceRoll, DiceTransport } from '../types';

function makeMockTransport(): DiceTransport & { send: ReturnType<typeof vi.fn<(roll: DiceRoll) => void>> } {
  return {
    send: vi.fn<(roll: DiceRoll) => void>(),
    subscribe: vi.fn(() => () => {}),
  };
}

// Captures the handlers DiceProvider passes to transport.subscribe() so
// tests can simulate remote arrivals directly, bypassing the transport.
type DiceHandlers = { onRoll(r: DiceRoll): void; onHistory(rolls: DiceRoll[]): void };

function makeCapturingTransport(): { transport: DiceTransport; getHandlers: () => DiceHandlers | null } {
  let handlers: DiceHandlers | null = null;
  const transport: DiceTransport = {
    send: vi.fn(),
    subscribe: vi.fn((h: DiceHandlers) => {
      handlers = h;
      return () => {};
    }),
  };
  return { transport, getHandlers: () => handlers };
}

const validRoll: DiceRoll = {
  id: 'remote-1',
  notation: '1d20',
  rolls: [{ sides: 20, value: 12 }],
  modifier: 0,
  total: 12,
  advantage: 'none',
  roller: { kind: 'player', name: 'Remote' },
  isHidden: false,
  timestamp: Date.now(),
};

function renderDiceHook(transport?: DiceTransport) {
  return renderHook(() => useDice(), {
    wrapper: ({ children }) => (
      <DiceProvider campaignId="campaign-1" roller={{ kind: 'dm', name: 'DM' }} transport={transport}>
        {children}
      </DiceProvider>
    ),
  });
}

describe('DiceProvider roll() transport dispatch', () => {
  it('sends a visible roll to the transport exactly once', () => {
    const transport = makeMockTransport();
    const { result } = renderDiceHook(transport);

    let rolled;
    act(() => {
      rolled = result.current.roll('1d20');
    });

    expect(transport.send).toHaveBeenCalledTimes(1);
    expect(transport.send).toHaveBeenCalledWith(rolled);
  });

  it('never sends a hidden roll to the transport', () => {
    const transport = makeMockTransport();
    const { result } = renderDiceHook(transport);

    act(() => {
      result.current.roll('1d20', { isHidden: true });
    });

    expect(transport.send).not.toHaveBeenCalled();
  });

  it('does not throw when no transport is provided for a visible roll', () => {
    const { result } = renderDiceHook(undefined);

    expect(() => {
      act(() => {
        result.current.roll('1d20');
      });
    }).not.toThrow();
  });
});

describe('DiceProvider roll() object-input bounds validation', () => {
  it('accepts an in-bounds object input', () => {
    const { result } = renderDiceHook();

    let rolled;
    act(() => {
      rolled = result.current.roll({ sides: 6, count: 2 });
    });

    expect(rolled!.rolls).toHaveLength(2);
  });

  it('throws DiceParseError for an out-of-bounds object input (sides too small)', () => {
    const { result } = renderDiceHook();

    expect(() => {
      act(() => {
        result.current.roll({ sides: 1, count: 1 });
      });
    }).toThrow(DiceParseError);
  });

  it('throws DiceParseError for an out-of-bounds object input (count exceeds MAX_DICE)', () => {
    const { result } = renderDiceHook();

    expect(() => {
      act(() => {
        result.current.roll({ sides: 6, count: 101 });
      });
    }).toThrow(DiceParseError);
  });
});

describe('DiceProvider transport subscription validates incoming rolls', () => {
  it('appends a well-formed remote roll delivered via onRoll', () => {
    const { transport, getHandlers } = makeCapturingTransport();
    const { result } = renderDiceHook(transport);

    act(() => {
      getHandlers()!.onRoll(validRoll);
    });

    expect(result.current.history).toContainEqual(validRoll);
  });

  it('drops a malformed roll delivered via onRoll instead of reaching the reducer', () => {
    const { transport, getHandlers } = makeCapturingTransport();
    const { result } = renderDiceHook(transport);

    act(() => {
      // A hostile/corrupted payload: `value` is an object, which would
      // crash a naive `{die.value}` render if it reached the history.
      getHandlers()!.onRoll({ ...validRoll, rolls: [{ sides: 20, value: {} }] } as unknown as DiceRoll);
    });

    expect(result.current.history).toHaveLength(0);
  });

  it('keeps only well-formed entries from a mixed onHistory replay', () => {
    const { transport, getHandlers } = makeCapturingTransport();
    const { result } = renderDiceHook(transport);
    const malformed = { ...validRoll, id: 'bad-1', total: Infinity };

    act(() => {
      getHandlers()!.onHistory([validRoll, malformed as unknown as DiceRoll]);
    });

    expect(result.current.history).toEqual([validRoll]);
  });
});
