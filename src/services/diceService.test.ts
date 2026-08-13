import { describe, it, expect } from 'vitest';
import {
  parseNotation,
  DiceParseError,
  MAX_DICE,
  MAX_SIDES,
  rollDie,
  executeRoll,
  formatRoll,
  isValidDiceRollPayload,
} from './diceService';
import type { DiceRoll } from '../types';

describe('parseNotation', () => {
  describe('valid notation', () => {
    it('parses a single die roll', () => {
      expect(parseNotation('1d20')).toEqual({ terms: [{ count: 1, sides: 20 }], modifier: 0 });
    });

    it('parses multiple dice with a positive modifier', () => {
      expect(parseNotation('2d6+3')).toEqual({ terms: [{ count: 2, sides: 6 }], modifier: 3 });
    });

    it('defaults count to 1 when omitted', () => {
      expect(parseNotation('d8')).toEqual({ terms: [{ count: 1, sides: 8 }], modifier: 0 });
    });

    it('treats d%% as d100', () => {
      expect(parseNotation('d%')).toEqual({ terms: [{ count: 1, sides: 100 }], modifier: 0 });
    });

    it('parses multiple dice terms plus a modifier', () => {
      expect(parseNotation('2d6+1d4+3')).toEqual({
        terms: [
          { count: 2, sides: 6 },
          { count: 1, sides: 4 },
        ],
        modifier: 3,
      });
    });

    it('parses a negative modifier', () => {
      expect(parseNotation('1d20-2')).toEqual({ terms: [{ count: 1, sides: 20 }], modifier: -2 });
    });

    it('tolerates surrounding and internal whitespace', () => {
      expect(parseNotation(' 2d6 + 3 ')).toEqual({ terms: [{ count: 2, sides: 6 }], modifier: 3 });
    });

    it('tolerates a leading positive sign on the first term', () => {
      expect(parseNotation('+2d6')).toEqual({ terms: [{ count: 2, sides: 6 }], modifier: 0 });
    });
  });

  describe('invalid notation', () => {
    it('throws DiceParseError on empty input', () => {
      expect(() => parseNotation('')).toThrow(DiceParseError);
    });

    it('throws DiceParseError on garbage input', () => {
      expect(() => parseNotation('abc')).toThrow(DiceParseError);
    });

    it('throws DiceParseError on zero count', () => {
      expect(() => parseNotation('0d6')).toThrow(DiceParseError);
    });

    it('throws DiceParseError on zero-sided (and 1-sided) die', () => {
      expect(() => parseNotation('1d0')).toThrow(DiceParseError);
      expect(() => parseNotation('1d1')).toThrow(DiceParseError);
    });

    it('throws DiceParseError on a dangling d with no sides', () => {
      expect(() => parseNotation('1d')).toThrow(DiceParseError);
    });

    it('throws DiceParseError on a bare modifier with no dice', () => {
      expect(() => parseNotation('+3')).toThrow(DiceParseError);
    });

    it('throws DiceParseError on a trailing operator', () => {
      expect(() => parseNotation('2d6+')).toThrow(DiceParseError);
    });

    it('throws DiceParseError on consecutive operators', () => {
      expect(() => parseNotation('2d6++3')).toThrow(DiceParseError);
    });
  });

  describe('caps', () => {
    it('throws DiceParseError when dice count exceeds MAX_DICE', () => {
      expect(() => parseNotation(`${MAX_DICE + 1}d6`)).toThrow(DiceParseError);
    });

    it('throws DiceParseError when sides exceed MAX_SIDES', () => {
      expect(() => parseNotation(`1d${MAX_SIDES + 1}`)).toThrow(DiceParseError);
    });

    it('allows exactly MAX_DICE and MAX_SIDES', () => {
      expect(() => parseNotation(`${MAX_DICE}d${MAX_SIDES}`)).not.toThrow();
    });
  });
});

const dmRoller: DiceRoll['roller'] = { kind: 'dm', name: 'DM' };

describe('rollDie', () => {
  it('returns values within 1..sides across 10,000 rolls, with reasonable spread', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 10_000; i++) {
      const v = rollDie(20);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(20);
      seen.add(v);
    }
    expect(seen.size).toBeGreaterThanOrEqual(15);
  });
});

describe('executeRoll', () => {
  it('rolls the correct number of dice and computes total for a single term', () => {
    const parsed = parseNotation('2d6+3');
    const roll = executeRoll(parsed, { roller: dmRoller });
    expect(roll.rolls).toHaveLength(2);
    expect(roll.modifier).toBe(3);
    const sum = roll.rolls.reduce((acc, r) => acc + r.value, 0);
    expect(roll.total).toBe(sum + 3);
    expect(roll.advantage).toBe('none');
    expect(roll.roller).toEqual(dmRoller);
    expect(roll.isHidden).toBe(false);
    expect(typeof roll.id).toBe('string');
    expect(roll.id.length).toBeGreaterThan(0);
    expect(typeof roll.timestamp).toBe('number');
  });

  it('computes total correctly across multiple dice terms', () => {
    const parsed = parseNotation('2d6+1d4+3');
    const roll = executeRoll(parsed, { roller: dmRoller });
    expect(roll.rolls).toHaveLength(3);
    const sum = roll.rolls.reduce((acc, r) => acc + r.value, 0);
    expect(roll.total).toBe(sum + 3);
    expect(roll.notation).toBe('2d6+1d4+3');
  });

  it('rebuilds canonical notation with a negative modifier', () => {
    const parsed = parseNotation('2d6-1');
    const roll = executeRoll(parsed, { roller: dmRoller });
    expect(roll.notation).toBe('2d6-1');
  });

  it('rebuilds canonical notation with no modifier', () => {
    const parsed = parseNotation('1d20');
    const roll = executeRoll(parsed, { roller: dmRoller });
    expect(roll.notation).toBe('1d20');
  });

  it('respects isHidden option', () => {
    const parsed = parseNotation('1d20');
    const roll = executeRoll(parsed, { roller: dmRoller, isHidden: true });
    expect(roll.isHidden).toBe(true);
  });

  describe('advantage / disadvantage', () => {
    it('rolls two d20s for advantage and keeps the higher', () => {
      const parsed = parseNotation('1d20');
      const roll = executeRoll(parsed, { roller: dmRoller, advantage: 'advantage' });
      expect(roll.rolls).toHaveLength(2);
      expect(roll.advantage).toBe('advantage');
      const discarded = roll.rolls.filter((r) => r.discarded);
      const kept = roll.rolls.filter((r) => !r.discarded);
      expect(discarded).toHaveLength(1);
      expect(kept).toHaveLength(1);
      expect(kept[0].value).toBeGreaterThanOrEqual(discarded[0].value);
      expect(roll.total).toBe(kept[0].value + roll.modifier);
    });

    it('rolls two d20s for disadvantage and keeps the lower', () => {
      const parsed = parseNotation('1d20');
      const roll = executeRoll(parsed, { roller: dmRoller, advantage: 'disadvantage' });
      expect(roll.rolls).toHaveLength(2);
      const discarded = roll.rolls.filter((r) => r.discarded);
      const kept = roll.rolls.filter((r) => !r.discarded);
      expect(discarded).toHaveLength(1);
      expect(kept).toHaveLength(1);
      expect(kept[0].value).toBeLessThanOrEqual(discarded[0].value);
      expect(roll.total).toBe(kept[0].value + roll.modifier);
    });

    it('applies modifier on top of the kept advantage die', () => {
      const parsed = parseNotation('1d20+5');
      const roll = executeRoll(parsed, { roller: dmRoller, advantage: 'advantage' });
      const kept = roll.rolls.find((r) => !r.discarded)!;
      expect(roll.total).toBe(kept.value + 5);
    });

    it('throws when advantage is requested on a multi-term roll', () => {
      const parsed = parseNotation('2d6');
      expect(() => executeRoll(parsed, { roller: dmRoller, advantage: 'advantage' })).toThrow(
        DiceParseError
      );
      expect(() => executeRoll(parsed, { roller: dmRoller, advantage: 'advantage' })).toThrow(
        /advantage/i
      );
    });

    it('throws when advantage is requested on a roll with count != 1', () => {
      const parsed = parseNotation('2d20');
      expect(() => executeRoll(parsed, { roller: dmRoller, advantage: 'advantage' })).toThrow(
        DiceParseError
      );
    });

    it('throws when advantage is requested on a non-d20 roll', () => {
      const parsed = parseNotation('1d12');
      expect(() => executeRoll(parsed, { roller: dmRoller, advantage: 'advantage' })).toThrow(
        DiceParseError
      );
    });

    it('throws when disadvantage is requested on an invalid roll', () => {
      const parsed = parseNotation('1d20+1d4');
      expect(() => executeRoll(parsed, { roller: dmRoller, advantage: 'disadvantage' })).toThrow(
        DiceParseError
      );
    });
  });
});

describe('formatRoll', () => {
  it('formats a simple roll as "notation: total (rolls)"', () => {
    const parsed = parseNotation('1d20+3');
    const roll = executeRoll(parsed, { roller: dmRoller });
    const formatted = formatRoll(roll);
    expect(formatted).toContain(roll.notation);
    expect(formatted).toContain(String(roll.total));
  });

  it('marks discarded dice distinctly in the formatted string, as plain text', () => {
    const parsed = parseNotation('1d20');
    const roll = executeRoll(parsed, { roller: dmRoller, advantage: 'advantage' });
    const formatted = formatRoll(roll);
    const discardedValue = roll.rolls.find((r) => r.discarded)!.value;
    expect(formatted).toContain(`(dropped ${discardedValue})`);
    expect(formatted).not.toContain('~~');
  });
});

describe('isValidDiceRollPayload', () => {
  function makeValidRoll(): DiceRoll {
    const parsed = parseNotation('2d6+3');
    return executeRoll(parsed, { roller: dmRoller });
  }

  it('accepts a real roll produced by executeRoll', () => {
    expect(isValidDiceRollPayload(makeValidRoll())).toBe(true);
  });

  it('rejects null and non-objects', () => {
    expect(isValidDiceRollPayload(null)).toBe(false);
    expect(isValidDiceRollPayload(undefined)).toBe(false);
    expect(isValidDiceRollPayload('not an object')).toBe(false);
    expect(isValidDiceRollPayload(42)).toBe(false);
  });

  it('rejects a payload missing roller', () => {
    const roll = makeValidRoll() as unknown as Record<string, unknown>;
    delete roll.roller;
    expect(isValidDiceRollPayload(roll)).toBe(false);
  });

  it('rejects a payload with a non-numeric total', () => {
    const roll = { ...makeValidRoll(), total: 'twelve' };
    expect(isValidDiceRollPayload(roll)).toBe(false);
  });

  it('rejects a payload with an invalid roller kind', () => {
    const roll = { ...makeValidRoll(), roller: { kind: 'admin', name: 'X' } };
    expect(isValidDiceRollPayload(roll)).toBe(false);
  });

  it('rejects a roller name longer than 50 characters', () => {
    const roll = { ...makeValidRoll(), roller: { kind: 'dm', name: 'x'.repeat(51) } };
    expect(isValidDiceRollPayload(roll)).toBe(false);
  });

  it('rejects a notation string longer than 100 characters', () => {
    const roll = { ...makeValidRoll(), notation: 'x'.repeat(101) };
    expect(isValidDiceRollPayload(roll)).toBe(false);
  });

  it('rejects a rolls array exceeding MAX_DICE * 2', () => {
    const base = makeValidRoll();
    const rolls = Array.from({ length: MAX_DICE * 2 + 1 }, () => ({ sides: 6, value: 3 }));
    expect(isValidDiceRollPayload({ ...base, rolls })).toBe(false);
  });

  it('accepts a rolls array of exactly MAX_DICE * 2', () => {
    const base = makeValidRoll();
    const rolls = Array.from({ length: MAX_DICE * 2 }, () => ({ sides: 6, value: 3 }));
    expect(isValidDiceRollPayload({ ...base, rolls })).toBe(true);
  });

  it('rejects a DieResult with value out of range', () => {
    const base = makeValidRoll();
    expect(
      isValidDiceRollPayload({ ...base, rolls: [{ sides: 6, value: 7 }] })
    ).toBe(false);
    expect(
      isValidDiceRollPayload({ ...base, rolls: [{ sides: 6, value: 0 }] })
    ).toBe(false);
  });

  it('rejects a DieResult with sides exceeding MAX_SIDES', () => {
    const base = makeValidRoll();
    expect(
      isValidDiceRollPayload({ ...base, rolls: [{ sides: MAX_SIDES + 1, value: 1 }] })
    ).toBe(false);
  });

  it('rejects a non-finite total, modifier, or timestamp', () => {
    const base = makeValidRoll();
    expect(isValidDiceRollPayload({ ...base, total: Infinity })).toBe(false);
    expect(isValidDiceRollPayload({ ...base, modifier: NaN })).toBe(false);
    expect(isValidDiceRollPayload({ ...base, timestamp: Infinity })).toBe(false);
  });

  it('rejects an invalid advantage literal', () => {
    const base = makeValidRoll();
    expect(isValidDiceRollPayload({ ...base, advantage: 'sneaky' })).toBe(false);
  });

  it('rejects a non-boolean isHidden', () => {
    const base = makeValidRoll();
    expect(isValidDiceRollPayload({ ...base, isHidden: 'yes' })).toBe(false);
  });

  it('rejects an id longer than 64 characters', () => {
    const base = makeValidRoll();
    expect(isValidDiceRollPayload({ ...base, id: 'x'.repeat(65) })).toBe(false);
  });
});
