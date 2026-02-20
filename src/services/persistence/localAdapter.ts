// Local persistence adapter — wraps existing Electron IPC calls

import type { Campaign } from '../../types';
import type { PersistenceAdapter, CampaignListItem, SaveResult, LoadResult, DeleteResult } from './types';

/**
 * LocalPersistenceAdapter delegates to window.electronAPI for file I/O.
 * This is the default adapter and matches the existing behavior exactly.
 */
export class LocalPersistenceAdapter implements PersistenceAdapter {
  async list(): Promise<CampaignListItem[]> {
    return window.electronAPI.listCampaigns();
  }

  async save(campaign: Campaign, identifier?: string): Promise<SaveResult> {
    // Increment version counter on each save for future sync conflict detection
    const toSave = { ...campaign, version: (campaign.version ?? 0) + 1 };
    return window.electronAPI.saveCampaign(toSave, identifier);
  }

  async load(identifier: string): Promise<LoadResult> {
    const result = await window.electronAPI.loadCampaign(identifier);
    return {
      success: result.success,
      campaign: result.campaign as Campaign | undefined,
      path: result.path,
      error: result.error,
    };
  }

  async delete(identifier: string): Promise<DeleteResult> {
    return window.electronAPI.deleteCampaign(identifier);
  }

  onRemoteChange(_callback: (campaign: Campaign) => void): () => void {
    // Local adapter has no remote changes — no-op
    return () => {};
  }
}
