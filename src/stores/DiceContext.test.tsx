import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DiceProvider, useDice } from './DiceContext';
import { DiceParseError } from '../services/diceService';
import type { DiceTransport } from '../types';

function makeMockTransport(): DiceTransport & { send: ReturnType<typeof vi.fn> } {
  return {
    send: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  };
}

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
