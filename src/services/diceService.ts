// Dice notation parsing

import type { ParsedDice } from '../types';

export const MAX_DICE = 100;
export const MAX_SIDES = 1000;

export class DiceParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiceParseError';
  }
}

const DICE_TERM_PATTERN = /^(\d*)d(\d+|%)$/i;
const MODIFIER_TERM_PATTERN = /^\d+$/;

/**
 * Parses dice notation (e.g. "2d6+3", "1d20-2", "d%") into structured terms
 * and a flat modifier. Throws DiceParseError on malformed input, an
 * out-of-range die (count < 1, sides < 2), or a total exceeding MAX_DICE /
 * MAX_SIDES.
 */
export function parseNotation(input: string): ParsedDice {
  const cleaned = input.replace(/\s+/g, '');
  if (!cleaned) {
    throw new DiceParseError('Dice notation cannot be empty');
  }

  const rawTokens = cleaned.match(/[+-]?[^+-]+/g);
  if (!rawTokens) {
    throw new DiceParseError(`Invalid dice notation: "${input}"`);
  }

  const terms: { count: number; sides: number }[] = [];
  let modifier = 0;
  let totalCount = 0;
  let sawDiceTerm = false;

  for (const rawToken of rawTokens) {
    const isNegative = rawToken.startsWith('-');
    const token = rawToken.replace(/^[+-]/, '');
    if (!token) {
      throw new DiceParseError(`Invalid dice notation: "${input}"`);
    }

    const diceMatch = DICE_TERM_PATTERN.exec(token);
    if (diceMatch) {
      if (isNegative) {
        throw new DiceParseError(`Dice terms cannot be negated: "${rawToken}"`);
      }

      const [, countStr, sidesStr] = diceMatch;
      const count = countStr === '' ? 1 : parseInt(countStr, 10);
      const sides = sidesStr === '%' ? 100 : parseInt(sidesStr, 10);

      if (count < 1) {
        throw new DiceParseError(`Dice count must be at least 1: "${token}"`);
      }
      if (sides < 2) {
        throw new DiceParseError(`A die must have at least 2 sides: "${token}"`);
      }
      if (sides > MAX_SIDES) {
        throw new DiceParseError(`Die sides cannot exceed ${MAX_SIDES}: "${token}"`);
      }

      totalCount += count;
      if (totalCount > MAX_DICE) {
        throw new DiceParseError(`Total dice count cannot exceed ${MAX_DICE}`);
      }

      terms.push({ count, sides });
      sawDiceTerm = true;
      continue;
    }

    if (MODIFIER_TERM_PATTERN.test(token)) {
      modifier += (isNegative ? -1 : 1) * parseInt(token, 10);
      continue;
    }

    throw new DiceParseError(`Invalid dice notation: "${input}"`);
  }

  if (!sawDiceTerm) {
    throw new DiceParseError(`Dice notation must include at least one die: "${input}"`);
  }

  return { terms, modifier };
}
