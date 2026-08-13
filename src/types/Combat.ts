// ============ COMBAT TRACKER (session-only, not persisted) ============
// Combat state lives in CombatContext for the app session and is never
// written to the campaign file. Players receive a filtered view over the
// combat-update sync channel (see services/combatTracker.ts).

export type CombatantKind = 'pc' | 'creature';

export interface Combatant {
  id: string;
  name: string;
  kind: CombatantKind;
  initiative: number;
  maxHp: number | null;      // null = untracked (common for PCs)
  currentHp: number | null;
  conditions: string[];
  sourceId?: string;         // PlayerCharacter.id or Encounter.id it came from
  isVisibleToPlayers: boolean;
}

export interface CombatState {
  isActive: boolean;
  combatants: Combatant[];   // array order IS the initiative order
  turnIndex: number;
  round: number;
}

// Filtered payload sent to player views: no HP, no hidden combatants
export interface PlayerCombatant {
  id: string;
  name: string;
  kind: CombatantKind;
  conditions: string[];
  isCurrentTurn: boolean;
}

export interface PlayerCombatState {
  combatants: PlayerCombatant[];
  round: number;
}

export const STANDARD_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Exhaustion'
] as const;

export function createCombatant(partial: Partial<Combatant> & { name: string }): Combatant {
  return {
    id: crypto.randomUUID(),
    kind: 'creature',
    initiative: 0,
    maxHp: null,
    currentHp: null,
    conditions: [],
    isVisibleToPlayers: true,
    ...partial
  };
}

export function createCombatState(): CombatState {
  return {
    isActive: false,
    combatants: [],
    turnIndex: 0,
    round: 1
  };
}
