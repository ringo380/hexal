// Sync types — Data structures for offline-first conflict detection and resolution.

import type { Campaign, Hex } from './Campaign';

/** A single field that differs between local and remote versions. */
export interface FieldDiff<T = unknown> {
  field: string;
  label: string;
  localValue: T;
  remoteValue: T;
}

/** A hex that was modified on both local and remote since the last sync. */
export interface HexConflict {
  hexKey: string;
  localHex: Hex;
  remoteHex: Hex;
}

/** Full conflict description between local and remote campaign states. */
export interface CampaignConflict {
  campaignId: string;
  localVersion: number;
  remoteVersion: number;
  localCampaign: Campaign;
  remoteCampaign: Campaign;
  /** Campaign metadata fields that differ between local and remote. */
  metadataDiffs: FieldDiff[];
  /** Hexes modified on both sides — require user resolution. */
  hexConflicts: HexConflict[];
  /** Hex keys with non-overlapping changes — auto-merged without user input. */
  autoMergedHexKeys: string[];
}

/** User's choice for resolving a conflict. */
export type ConflictResolution =
  | { strategy: 'keep-local' }
  | { strategy: 'keep-remote' }
  | { strategy: 'manual'; resolvedCampaign: Campaign };
