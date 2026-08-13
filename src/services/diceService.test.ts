import { describe, it, expect } from 'vitest';
import { parseNotation, DiceParseError, MAX_DICE, MAX_SIDES } from './diceService';

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
