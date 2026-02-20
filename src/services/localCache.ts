// localCache — IndexedDB cache using Dexie for cloud campaigns and sync queue.
// Provides offline storage for campaign data and a queue for pending changes
// that need to be synced when connectivity is restored.

import Dexie, { type Table } from 'dexie';
import type { Campaign } from '../types';

// ============ CACHED DATA TYPES ============

/** Cached campaign metadata and full data */
export interface CachedCampaign {
  id: string;           // campaign UUID (primary key)
  data: unknown;        // full Campaign object
  version: number;      // last known server version
  lastSynced: number;   // timestamp ms
}

/** Cached hex data (individual hex granularity) */
export interface CachedHex {
  id: string;           // `${campaignId}:${hexKey}` composite key
  campaignId: string;
  hexKey: string;
  data: unknown;        // Hex object
  version: number;
  lastSynced: number;
}

/** Pending changes to sync when back online */
export interface SyncQueueEntry {
  id?: number;          // auto-increment
  campaignId: string;
  type: 'campaign' | 'hex';
  hexKey?: string;      // only for hex changes
  data: unknown;        // the changed data
  version: number;      // local version at time of change
  timestamp: number;    // when the change was made
}

// ============ DATABASE ============

class HexalCache extends Dexie {
  campaigns!: Table<CachedCampaign, string>;
  hexes!: Table<CachedHex, string>;
  syncQueue!: Table<SyncQueueEntry, number>;

  constructor() {
    super('hexal-cache');
    this.version(1).stores({
      campaigns: 'id',
      hexes: 'id, campaignId',
      syncQueue: '++id, campaignId, type',
    });
  }
}

export const cache = new HexalCache();

// ============ HELPER FUNCTIONS ============

/**
 * Cache a full campaign object in IndexedDB.
 */
export async function cacheCampaign(campaign: Campaign, version: number): Promise<void> {
  await cache.campaigns.put({
    id: campaign.id,
    data: campaign,
    version,
    lastSynced: Date.now(),
  });
}

/**
 * Retrieve a cached campaign by ID.
 * Returns the Campaign object or null if not cached.
 */
export async function getCachedCampaign(id: string): Promise<{ campaign: Campaign; version: number } | null> {
  const entry = await cache.campaigns.get(id);
  if (!entry) return null;
  return {
    campaign: entry.data as Campaign,
    version: entry.version,
  };
}

/**
 * Cache a single hex for a campaign.
 */
export async function cacheHex(
  campaignId: string,
  hexKey: string,
  hex: unknown,
  version: number
): Promise<void> {
  const id = `${campaignId}:${hexKey}`;
  await cache.hexes.put({
    id,
    campaignId,
    hexKey,
    data: hex,
    version,
    lastSynced: Date.now(),
  });
}

/**
 * Retrieve all cached hexes for a campaign.
 * Returns a record keyed by hex coordinate string ("q,r").
 */
export async function getCachedHexes(campaignId: string): Promise<Record<string, unknown>> {
  const entries = await cache.hexes.where('campaignId').equals(campaignId).toArray();
  const result: Record<string, unknown> = {};
  entries.forEach(entry => {
    result[entry.hexKey] = entry.data;
  });
  return result;
}

/**
 * Add an entry to the sync queue for later replay.
 */
export async function addToSyncQueue(entry: Omit<SyncQueueEntry, 'id'>): Promise<void> {
  await cache.syncQueue.add(entry as SyncQueueEntry);
}

/**
 * Get pending sync queue entries.
 * If campaignId is provided, filters to that campaign only.
 * Returns entries sorted by id (insertion order).
 */
export async function getSyncQueue(campaignId?: string): Promise<SyncQueueEntry[]> {
  if (campaignId) {
    return cache.syncQueue.where('campaignId').equals(campaignId).sortBy('id');
  }
  return cache.syncQueue.orderBy('id').toArray();
}

/**
 * Remove processed entries from the sync queue by their IDs.
 */
export async function clearSyncQueue(ids: number[]): Promise<void> {
  await cache.syncQueue.bulkDelete(ids);
}

/**
 * Remove all cached data for a campaign: campaign entry, hexes, and queue entries.
 */
export async function clearCampaignCache(campaignId: string): Promise<void> {
  await cache.transaction('rw', [cache.campaigns, cache.hexes, cache.syncQueue], async () => {
    // Remove campaign
    await cache.campaigns.delete(campaignId);

    // Remove all hexes for this campaign
    const hexKeys = await cache.hexes
      .where('campaignId')
      .equals(campaignId)
      .primaryKeys();
    await cache.hexes.bulkDelete(hexKeys);

    // Remove all queue entries for this campaign
    const queueIds = await cache.syncQueue
      .where('campaignId')
      .equals(campaignId)
      .primaryKeys();
    await cache.syncQueue.bulkDelete(queueIds);
  });
}
