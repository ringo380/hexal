// storageLayer — Unified read/write layer that routes to cache or remote
// based on connectivity. Provides seamless offline-first data access by
// trying the remote server first when online and falling back to the
// local IndexedDB cache.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Campaign } from '../types';
import { getCachedCampaign, cacheCampaign, cache } from './localCache';
import { loadCloudCampaign, listCloudCampaigns } from './cloudStorage';
import { connectionManager } from './connectionManager';

// ============ CAMPAIGN LOADING ============

/**
 * Load a campaign: try remote first (if online), fall back to cache.
 * Caches the result for offline access whenever a remote load succeeds.
 */
export async function loadCampaignWithCache(
  client: SupabaseClient,
  campaignId: string
): Promise<Campaign | null> {
  // Try remote first if online
  if (connectionManager.online) {
    try {
      const { campaign, error } = await loadCloudCampaign(client, campaignId);
      if (campaign && !error) {
        // Cache the fresh data for offline use
        await cacheCampaign(campaign, campaign.version ?? 1);
        return campaign;
      }
      // Remote failed — fall through to cache
    } catch {
      // Network error — fall through to cache
    }
  }

  // Fall back to cache
  const cached = await getCachedCampaign(campaignId);
  return cached?.campaign ?? null;
}

// ============ CAMPAIGN LISTING ============

export interface CampaignListEntry {
  id: string;
  name: string;
  modifiedAt: string;
  isCached: boolean;
}

/**
 * List campaigns: merge remote list with cached list.
 * Remote campaigns update cache metadata. Cached-only campaigns
 * (not found on remote) are included with `isCached: true`.
 */
export async function listCampaignsWithCache(
  client: SupabaseClient,
  userId: string
): Promise<CampaignListEntry[]> {
  const result: CampaignListEntry[] = [];
  const seenIds = new Set<string>();

  // Try remote first if online
  if (connectionManager.online) {
    try {
      const { campaigns, error } = await listCloudCampaigns(client, userId);
      if (!error && campaigns.length > 0) {
        campaigns.forEach(row => {
          seenIds.add(row.id);
          result.push({
            id: row.id,
            name: row.name,
            modifiedAt: row.modified_at,
            isCached: false,
          });
        });
      }
    } catch {
      // Network error — will merge with cache below
    }
  }

  // Merge cached campaigns that aren't already in the remote list
  try {
    const cachedCampaigns = await cache.campaigns.toArray();
    cachedCampaigns.forEach(entry => {
      if (!seenIds.has(entry.id)) {
        const campaign = entry.data as Campaign;
        result.push({
          id: entry.id,
          name: campaign.name ?? 'Unknown Campaign',
          modifiedAt: campaign.modifiedAt ?? new Date(entry.lastSynced).toISOString(),
          isCached: true,
        });
      }
    });
  } catch {
    // IndexedDB error — return whatever we have from remote
  }

  return result;
}
