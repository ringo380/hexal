// Dice notation parsing, roll execution, formatting, and payload validation

import type { DiceAdvantage, DiceRoll, DieResult, ParsedDice } from '../types';

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

  // Reject malformed operator placement up front: a trailing operator
  // ("2d6+"), a leading operator with nothing after it ("+"), or consecutive
  // operators ("2d6++3") would otherwise be silently swallowed by the token
  // regex below (unmatched characters between tokens are just skipped).
  if (!/^[+-]?[^+-]+([+-][^+-]+)*$/.test(cleaned)) {
    throw new DiceParseError(`Invalid dice notation: "${input}"`);
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

/**
 * Rolls a single die with `sides` faces using a cryptographically strong
 * source and rejection sampling to avoid modulo bias.
 */
export function rollDie(sides: number): number {
  const max = Math.floor(0x100000000 / sides) * sides;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= max);
  return (value % sides) + 1;
}

/** Rebuilds canonical dice notation (e.g. "2d6+1d4+3") from parsed terms. */
function buildNotation(parsed: ParsedDice): string {
  const parts = parsed.terms.map((term) => `${term.count}d${term.sides}`);
  if (parsed.modifier > 0) {
    parts.push(String(parsed.modifier));
  } else if (parsed.modifier < 0) {
    parts[parts.length - 1] += String(parsed.modifier);
  }
  return parts.join('+').replace(/\+-/g, '-');
}

/**
 * Executes a parsed dice roll, producing a fully-formed DiceRoll.
 * Advantage/disadvantage is only valid for a single 1d20 term (an optional
 * modifier is allowed); it rolls two d20s and marks the losing die
 * `discarded: true`.
 */
export function executeRoll(
  parsed: ParsedDice,
  opts: { advantage?: DiceAdvantage; roller: DiceRoll['roller']; isHidden?: boolean }
): DiceRoll {
  const advantage = opts.advantage ?? 'none';

  if (advantage !== 'none') {
    const isSingleD20 =
      parsed.terms.length === 1 && parsed.terms[0].count === 1 && parsed.terms[0].sides === 20;
    if (!isSingleD20) {
      throw new DiceParseError(
        `Advantage/disadvantage can only be applied to a single d20 roll`
      );
    }

    const first = rollDie(20);
    const second = rollDie(20);
    const keepFirst =
      advantage === 'advantage' ? first >= second : first <= second;

    const rolls: DieResult[] = [
      { sides: 20, value: first, ...(keepFirst ? {} : { discarded: true }) },
      { sides: 20, value: second, ...(keepFirst ? { discarded: true } : {}) },
    ];
    const kept = keepFirst ? first : second;

    return {
      id: crypto.randomUUID(),
      notation: buildNotation(parsed),
      rolls,
      modifier: parsed.modifier,
      total: kept + parsed.modifier,
      advantage,
      roller: opts.roller,
      isHidden: opts.isHidden ?? false,
      timestamp: Date.now(),
    };
  }

  const rolls: DieResult[] = [];
  for (const term of parsed.terms) {
    for (let i = 0; i < term.count; i++) {
      rolls.push({ sides: term.sides, value: rollDie(term.sides) });
    }
  }
  const total = rolls.reduce((acc, r) => acc + r.value, 0) + parsed.modifier;

  return {
    id: crypto.randomUUID(),
    notation: buildNotation(parsed),
    rolls,
    modifier: parsed.modifier,
    total,
    advantage,
    roller: opts.roller,
    isHidden: opts.isHidden ?? false,
    timestamp: Date.now(),
  };
}

/** Formats a DiceRoll as a human-readable string, striking discarded dice. */
export function formatRoll(roll: DiceRoll): string {
  const rollsStr = roll.rolls
    .map((r) => (r.discarded ? `~~${r.value}~~` : String(r.value)))
    .join(', ');
  return `${roll.notation}: ${roll.total} (${rollsStr})`;
}

const DICE_ADVANTAGE_VALUES: DiceAdvantage[] = ['none', 'advantage', 'disadvantage'];
const ROLLER_KINDS = ['dm', 'player'];

function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

function isValidDieResult(x: unknown): x is DieResult {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Record<string, unknown>;
  if (!isFiniteNumber(r.sides) || r.sides < 1 || r.sides > MAX_SIDES) return false;
  if (!isFiniteNumber(r.value) || r.value < 1 || r.value > r.sides) return false;
  if ('discarded' in r && r.discarded !== undefined && typeof r.discarded !== 'boolean') {
    return false;
  }
  return true;
}

/** Runtime guard verifying an unknown value is a well-formed, in-bounds DiceRoll. */
export function isValidDiceRollPayload(x: unknown): x is DiceRoll {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Record<string, unknown>;

  if (typeof r.id !== 'string' || r.id.length === 0 || r.id.length > 64) return false;
  if (typeof r.notation !== 'string' || r.notation.length === 0 || r.notation.length > 100) {
    return false;
  }
  if (!Array.isArray(r.rolls) || r.rolls.length > MAX_DICE * 2) return false;
  if (!r.rolls.every(isValidDieResult)) return false;
  if (!isFiniteNumber(r.modifier)) return false;
  if (!isFiniteNumber(r.total)) return false;
  if (typeof r.advantage !== 'string' || !DICE_ADVANTAGE_VALUES.includes(r.advantage as DiceAdvantage)) {
    return false;
  }
  if (typeof r.roller !== 'object' || r.roller === null) return false;
  const roller = r.roller as Record<string, unknown>;
  if (typeof roller.kind !== 'string' || !ROLLER_KINDS.includes(roller.kind)) return false;
  if (typeof roller.name !== 'string' || roller.name.length > 50) return false;
  if (typeof r.isHidden !== 'boolean') return false;
  if (!isFiniteNumber(r.timestamp)) return false;

  return true;
}
