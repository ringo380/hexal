// Cloud persistence adapter — routes through Supabase + local cache with offline support

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Campaign } from '../../types';
import type { PersistenceAdapter, CampaignListItem, SaveResult, LoadResult, DeleteResult } from './types';
import {
  loadCloudCampaign,
  saveCloudCampaign,
  deleteCloudCampaign,
  subscribeToChanges,
} from '../cloudStorage';
import type { HexChangePayload, CampaignChangePayload } from '../cloudStorage';
import { loadCampaignWithCache, listCampaignsWithCache } from '../storageLayer';
import { cacheCampaign } from '../localCache';
import { migrateCampaign } from '../../types/Campaign';

/**
 * CloudPersistenceAdapter implements PersistenceAdapter for Supabase-backed
 * campaigns with offline fallback via IndexedDB cache.
 *
 * Identifier semantics: campaign UUID (not file path).
 */
export class CloudPersistenceAdapter implements PersistenceAdapter {
  private client: SupabaseClient;
  private userId: string;

  constructor(client: SupabaseClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  async list(): Promise<CampaignListItem[]> {
    const items = await listCampaignsWithCache(this.client, this.userId);
    return items.map(item => ({
      name: item.name,
      path: item.id, // "path" is the campaign UUID in cloud mode
      modifiedAt: item.modifiedAt,
    }));
  }

  async save(campaign: Campaign, _identifier?: string, _options?: { compact?: boolean }): Promise<SaveResult> {
    try {
      // Always cache locally first
      await cacheCampaign(campaign, campaign.version ?? 1);

      // Attempt remote save
      const result = await saveCloudCampaign(this.client, campaign, this.userId);
      if (result.error) {
        // Saved locally but remote failed — partial success
        console.warn('Cloud save failed, cached locally:', result.error);
        return { success: true, path: campaign.id };
      }

      return { success: true, path: campaign.id };
    } catch (error) {
      console.error('Cloud save error:', error);
      return { success: false, error: String(error) };
    }
  }

  async load(identifier: string): Promise<LoadResult> {
    try {
      const campaign = await loadCampaignWithCache(this.client, identifier);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      const migrated = migrateCampaign(campaign);
      return { success: true, campaign: migrated, path: identifier };
    } catch (error) {
      console.error('Cloud load error:', error);
      return { success: false, error: String(error) };
    }
  }

  async delete(identifier: string): Promise<DeleteResult> {
    try {
      const result = await deleteCloudCampaign(this.client, identifier);
      if (result.error) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  onRemoteChange(_callback: (campaign: Campaign) => void): () => void {
    // No-op when campaignId is unknown — use subscribeToRemoteChanges instead
    return () => {};
  }

  /**
   * Subscribe to Realtime changes for a specific campaign.
   * Call this when a campaign is loaded and the ID is known.
   * Returns an unsubscribe function.
   *
   * @param campaignId - The UUID of the loaded campaign
   * @param onCampaignUpdate - Called with the full campaign when a remote change arrives
   * @param onVersionConflict - Called when remote version is higher than local
   */
  subscribeToRemoteChanges(
    campaignId: string,
    onCampaignUpdate: (campaign: Campaign) => void,
    onVersionConflict?: (remoteVersion: number) => void
  ): () => void {
    if (!campaignId) return () => {};

    return subscribeToChanges(
      this.client,
      campaignId,
      (_hexPayload: HexChangePayload) => {
        // Hex-level changes handled by sync engine, not here
      },
      async (campaignPayload: CampaignChangePayload) => {
        // Notify about the version change
        if (onVersionConflict) {
          onVersionConflict(campaignPayload.version);
        }

        // Reload full campaign on campaign-level change
        const result = await loadCloudCampaign(this.client, campaignPayload.campaignId);
        if (result.campaign) {
          onCampaignUpdate(migrateCampaign(result.campaign));
        }
      }
    );
  }
}
