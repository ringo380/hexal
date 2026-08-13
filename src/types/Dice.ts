// Dice Roller Types

export type DiceAdvantage = 'none' | 'advantage' | 'disadvantage';

export interface DieResult {
  sides: number;
  value: number;
  discarded?: boolean;
}

export interface DiceRoll {
  id: string;
  notation: string;
  rolls: DieResult[];
  modifier: number;
  total: number;
  advantage: DiceAdvantage;
  roller: { kind: 'dm' | 'player'; name: string };
  isHidden: boolean;
  timestamp: number;
}

export interface ParsedDice {
  terms: { count: number; sides: number }[];
  modifier: number;
}

// Abstracts roll delivery over whichever channel is active (Electron IPC,
// the web player's WebSocket) so DiceContext doesn't need to know which one
// it's talking to.
export interface DiceTransport {
  send(roll: DiceRoll): void;
  subscribe(handlers: { onRoll(r: DiceRoll): void; onHistory(rolls: DiceRoll[]): void }): () => void;
}
