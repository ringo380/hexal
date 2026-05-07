// PersistenceAdapter — abstraction layer for campaign storage
// Enables swapping between local file I/O (Electron IPC) and cloud (Supabase)

import type { Campaign } from '../../types';

export interface CampaignListItem {
  name: string;
  path: string;
  modifiedAt: string;
}

export interface SaveResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface LoadResult {
  success: boolean;
  campaign?: Campaign;
  path?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * PersistenceAdapter defines the contract for campaign storage backends.
 * Implementations: localAdapter (Electron IPC), cloudAdapter (Supabase, future).
 */
export interface PersistenceAdapter {
  /** List all available campaigns */
  list(): Promise<CampaignListItem[]>;

  /** Save a campaign, optionally at a specific path/identifier */
  save(campaign: Campaign, identifier?: string, options?: { compact?: boolean }): Promise<SaveResult>;

  /** Load a campaign by path/identifier */
  load(identifier: string): Promise<LoadResult>;

  /** Delete a campaign by path/identifier */
  delete(identifier: string): Promise<DeleteResult>;

  /**
   * Subscribe to remote changes (for cloud sync).
   * Returns an unsubscribe function. No-op for local adapter.
   */
  onRemoteChange(callback: (campaign: Campaign) => void): () => void;
}
