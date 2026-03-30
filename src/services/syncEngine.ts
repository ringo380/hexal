// syncEngine — Coordinates between local IndexedDB cache and Supabase.
// Writes to cache immediately for instant local feedback, then queues
// changes for remote sync. Replays the offline queue when connectivity
// is restored. Detects version conflicts via the versioned RPC and
// exposes conflict state for the resolution UI.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Campaign, Hex } from '../types';
import type { CampaignConflict, ConflictResolution } from '../types/Sync';
import {
  cacheCampaign,
  cacheHex,
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
  getSyncQueueCount,
  updateBaseSnapshot,
  type SyncQueueEntry,
} from './localCache';
import { saveCloudCampaignVersioned, loadCloudCampaign, upsertHex } from './cloudStorage';
import type { VersionedSaveResult } from './cloudStorage';
import { connectionManager } from './connectionManager';
import { computeCampaignConflict } from './conflictResolver';

// ============ TYPES ============

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'conflict' | 'error';
type SyncStatusListener = (status: SyncStatus) => void;
type ConflictListener = (conflict: CampaignConflict | null) => void;
type CampaignReloadListener = (campaign: Campaign) => void;

const MAX_RETRIES = 3;

// ============ QUEUE COALESCING ============

/**
 * Coalesce queue entries: keep only the latest entry per campaign (campaign type)
 * and per campaign:hexKey (hex type). This avoids pushing N intermediate states
 * when the user made N edits offline.
 */
function coalesceQueue(entries: SyncQueueEntry[]): SyncQueueEntry[] {
  // Track the latest entry per key
  const campaignMap = new Map<string, SyncQueueEntry>();
  const hexMap = new Map<string, SyncQueueEntry>();

  for (const entry of entries) {
    if (entry.type === 'campaign') {
      // Keep the latest campaign-level entry per campaignId
      const existing = campaignMap.get(entry.campaignId);
      if (!existing || entry.timestamp > existing.timestamp) {
        campaignMap.set(entry.campaignId, entry);
      }
    } else if (entry.type === 'hex' && entry.hexKey) {
      const key = `${entry.campaignId}:${entry.hexKey}`;
      const existing = hexMap.get(key);
      if (!existing || entry.timestamp > existing.timestamp) {
        hexMap.set(key, entry);
      }
    }
  }

  // Rebuild: campaign entries first, then hex entries
  const result: SyncQueueEntry[] = [];

  Array.from(campaignMap.values()).forEach(entry => {
    result.push(entry);
  });

  Array.from(hexMap.values()).forEach(entry => {
    result.push(entry);
  });

  result.sort((a, b) => a.timestamp - b.timestamp);

  return result;
}

/**
 * Get IDs of entries that were removed during coalescing (for cleanup).
 */
function getCoalescedIds(original: SyncQueueEntry[], coalesced: SyncQueueEntry[]): number[] {
  const keptIds = new Set(coalesced.map(e => e.id).filter((id): id is number => id !== undefined));
  return original
    .map(e => e.id)
    .filter((id): id is number => id !== undefined && !keptIds.has(id));
}

// ============ SYNC ENGINE ============

export class SyncEngine {
  private client: SupabaseClient;
  private userId: string;
  private status: SyncStatus = 'synced';
  private statusListeners: Set<SyncStatusListener> = new Set();
  private conflictListeners: Set<ConflictListener> = new Set();
  private reloadListeners: Set<CampaignReloadListener> = new Set();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionCleanup: (() => void) | null = null;
  private pendingConflict: CampaignConflict | null = null;
  private queuePaused: boolean = false;

  constructor(client: SupabaseClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  /**
   * Start the engine: subscribe to connection changes and replay any
   * queued offline changes if currently online.
   */
  start(): void {
    this.connectionCleanup = connectionManager.subscribe((online) => {
      if (online) {
        this.setStatus('syncing');
        this.replayQueue().catch(() => {
          this.setStatus('error');
        });
      } else {
        this.setStatus('offline');
      }
    });

    // Set initial status based on current connectivity
    if (!connectionManager.online) {
      this.setStatus('offline');
    } else {
      // Replay any entries that accumulated while the engine was stopped
      this.replayQueue().catch(() => {
        this.setStatus('error');
      });
    }
  }

  /**
   * Stop the engine: clean up timers and subscriptions.
   */
  stop(): void {
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.connectionCleanup) {
      this.connectionCleanup();
      this.connectionCleanup = null;
    }
  }

  /**
   * Save a campaign change. Writes to IndexedDB cache immediately.
   * If online, pushes to Supabase after a debounce (default 2000ms).
   * If offline, queues the change for later replay.
   */
  async saveCampaign(campaign: Campaign, debounceMs: number = 2000): Promise<void> {
    const version = campaign.version ?? 1;

    // Write to local cache immediately
    await cacheCampaign(campaign, version);

    if (connectionManager.online && !this.queuePaused) {
      // Debounce remote push
      if (this.syncTimer !== null) {
        clearTimeout(this.syncTimer);
      }
      this.syncTimer = setTimeout(async () => {
        this.syncTimer = null;
        this.setStatus('syncing');
        try {
          const result = await this.pushCampaignToRemote(campaign);
          if (result === 'conflict') {
            // Conflict handling already triggered in pushCampaignToRemote
            return;
          } else if (result === 'error') {
            await this.queueCampaign(campaign, version);
            this.setStatus('error');
          } else {
            // Success — update base snapshot
            await updateBaseSnapshot(campaign.id, { ...campaign, version: result });
            this.setStatus('synced');
          }
        } catch {
          await this.queueCampaign(campaign, version);
          this.setStatus('error');
        }
      }, debounceMs);
    } else {
      // Offline or paused — queue for later
      await this.queueCampaign(campaign, version);
      if (!connectionManager.online) {
        this.setStatus('offline');
      }
    }
  }

  /**
   * Save a single hex change (for granular incremental sync).
   * Writes to cache immediately and queues/pushes to remote.
   */
  async saveHex(campaignId: string, hexKey: string, hex: Hex): Promise<void> {
    const version = 1; // Hex-level version; server will reconcile

    // Write to local cache immediately
    await cacheHex(campaignId, hexKey, hex, version);

    if (connectionManager.online && !this.queuePaused) {
      this.setStatus('syncing');
      try {
        const { error } = await upsertHex(this.client, campaignId, hexKey, hex, version);
        if (error) {
          await addToSyncQueue({
            campaignId,
            type: 'hex',
            hexKey,
            data: hex,
            version,
            timestamp: Date.now(),
          });
          this.setStatus('error');
        } else {
          this.setStatus('synced');
        }
      } catch {
        await addToSyncQueue({
          campaignId,
          type: 'hex',
          hexKey,
          data: hex,
          version,
          timestamp: Date.now(),
        });
        this.setStatus('error');
      }
    } else {
      await addToSyncQueue({
        campaignId,
        type: 'hex',
        hexKey,
        data: hex,
        version,
        timestamp: Date.now(),
      });
      if (!connectionManager.online) {
        this.setStatus('offline');
      }
    }
  }

  /**
   * Replay the offline sync queue with coalescing and retry logic.
   * On conflict (version mismatch), pauses and triggers conflict resolution.
   */
  async replayQueue(): Promise<void> {
    if (this.queuePaused) return;

    const allEntries = await getSyncQueue();
    if (allEntries.length === 0) {
      this.setStatus('synced');
      return;
    }

    this.setStatus('syncing');

    // Coalesce: keep only the latest entry per entity
    const coalesced = coalesceQueue(allEntries);

    // Clean up entries that were coalesced away
    const removedIds = getCoalescedIds(allEntries, coalesced);
    if (removedIds.length > 0) {
      await clearSyncQueue(removedIds);
    }

    const processedIds: number[] = [];

    for (let i = 0; i < coalesced.length; i++) {
      const entry = coalesced[i];
      if (!connectionManager.online) {
        this.setStatus('offline');
        break;
      }
      if (this.queuePaused) break;

      const result = await this.pushEntryToRemote(entry);
      if (result === 'success') {
        if (entry.id !== undefined) {
          processedIds.push(entry.id);
        }
      } else if (result === 'conflict') {
        // Conflict detected — pause and wait for resolution
        break;
      } else {
        // Error — skip after retries exhausted (handled in pushEntryToRemote)
        // Continue to next entry
        if (entry.id !== undefined) {
          processedIds.push(entry.id); // Remove failed entry after max retries
        }
      }
    }

    // Clear processed entries
    if (processedIds.length > 0) {
      await clearSyncQueue(processedIds);
    }

    // Update status
    if (this.status !== 'conflict' && this.status !== 'offline') {
      const remaining = await getSyncQueueCount();
      this.setStatus(remaining === 0 ? 'synced' : 'error');
    }
  }

  /**
   * Resolve a pending conflict with the user's chosen strategy.
   */
  async resolveConflict(resolution: ConflictResolution): Promise<void> {
    const conflict = this.pendingConflict;
    if (!conflict) return;

    this.setStatus('syncing');

    try {
      if (resolution.strategy === 'keep-local') {
        // Force-push local version using the server's version as expected
        const result = await saveCloudCampaignVersioned(
          this.client,
          conflict.localCampaign,
          this.userId,
          conflict.remoteVersion
        );
        if (result.error || result.conflict) {
          this.setStatus('error');
          return;
        }
        const updatedCampaign = { ...conflict.localCampaign, version: result.newVersion };
        await cacheCampaign(updatedCampaign, result.newVersion ?? conflict.remoteVersion + 1);
        await updateBaseSnapshot(conflict.campaignId, updatedCampaign);
        // Clear stale queue entries for this campaign
        const entries = await getSyncQueue(conflict.campaignId);
        const ids = entries.map(e => e.id).filter((id): id is number => id !== undefined);
        if (ids.length > 0) {
          await clearSyncQueue(ids);
        }
        // Notify CampaignContext to update in-memory version
        this.notifyReload(updatedCampaign);
      } else if (resolution.strategy === 'keep-remote') {
        // Discard local changes — replace with remote
        const remote = conflict.remoteCampaign;
        await cacheCampaign(remote, conflict.remoteVersion);
        await updateBaseSnapshot(conflict.campaignId, remote);
        // Clear all queue entries for this campaign
        const entries = await getSyncQueue(conflict.campaignId);
        const ids = entries.map(e => e.id).filter((id): id is number => id !== undefined);
        if (ids.length > 0) {
          await clearSyncQueue(ids);
        }
        // Notify CampaignContext to reload with remote data
        this.notifyReload(remote);
      } else if (resolution.strategy === 'manual') {
        // Push the user's merged campaign
        const merged = resolution.resolvedCampaign;
        const result = await saveCloudCampaignVersioned(
          this.client,
          merged,
          this.userId,
          conflict.remoteVersion
        );
        if (result.error || result.conflict) {
          this.setStatus('error');
          return;
        }
        const updatedCampaign = { ...merged, version: result.newVersion };
        await cacheCampaign(updatedCampaign, result.newVersion ?? conflict.remoteVersion + 1);
        await updateBaseSnapshot(conflict.campaignId, updatedCampaign);
        this.notifyReload(updatedCampaign);
      }

      // Clear conflict state and resume
      this.setPendingConflict(null);
      this.queuePaused = false;
      this.setStatus('synced');

      // Resume queue replay for any remaining entries
      this.replayQueue().catch(() => {
        this.setStatus('error');
      });
    } catch {
      this.setStatus('error');
    }
  }

  /** Get current sync status. */
  getStatus(): SyncStatus {
    return this.status;
  }

  /** Get the current pending conflict, if any. */
  getPendingConflict(): CampaignConflict | null {
    return this.pendingConflict;
  }

  /** Get the number of pending queue entries. */
  async getQueueCount(): Promise<number> {
    return getSyncQueueCount();
  }

  /**
   * Subscribe to status changes.
   * Returns an unsubscribe function.
   */
  onStatusChange(listener: SyncStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Subscribe to conflict changes.
   * Returns an unsubscribe function.
   */
  onConflictChange(listener: ConflictListener): () => void {
    this.conflictListeners.add(listener);
    return () => {
      this.conflictListeners.delete(listener);
    };
  }

  /**
   * Subscribe to campaign reload events (triggered by keep-remote resolution).
   * Returns an unsubscribe function.
   */
  onCampaignReload(listener: CampaignReloadListener): () => void {
    this.reloadListeners.add(listener);
    return () => {
      this.reloadListeners.delete(listener);
    };
  }

  // ============ PRIVATE ============

  private setStatus(status: SyncStatus): void {
    if (this.status === status) return;
    this.status = status;
    Array.from(this.statusListeners).forEach(listener => listener(status));
  }

  private setPendingConflict(conflict: CampaignConflict | null): void {
    this.pendingConflict = conflict;
    Array.from(this.conflictListeners).forEach(listener => listener(conflict));
  }

  private notifyReload(campaign: Campaign): void {
    Array.from(this.reloadListeners).forEach(listener => listener(campaign));
  }

  private async queueCampaign(campaign: Campaign, version: number): Promise<void> {
    await addToSyncQueue({
      campaignId: campaign.id,
      type: 'campaign',
      data: campaign,
      version,
      timestamp: Date.now(),
    });
  }

  /**
   * Push a campaign to remote with version checking.
   * Returns the new version number on success, 'conflict' if version mismatch,
   * or 'error' on failure.
   */
  private async pushCampaignToRemote(
    campaign: Campaign
  ): Promise<number | 'conflict' | 'error'> {
    const expectedVersion = campaign.version ?? 0;

    let result: VersionedSaveResult;
    try {
      result = await saveCloudCampaignVersioned(
        this.client,
        campaign,
        this.userId,
        expectedVersion
      );
    } catch {
      return 'error';
    }

    if (result.error) {
      return 'error';
    }

    if (result.conflict) {
      // Version mismatch — fetch remote and compute conflict
      await this.handleVersionConflict(campaign, result.serverVersion ?? 0);
      return 'conflict';
    }

    return result.newVersion ?? expectedVersion + 1;
  }

  /**
   * Push a single queued entry to the remote server with retry logic.
   * Returns 'success', 'conflict', or 'error'.
   */
  private async pushEntryToRemote(
    entry: SyncQueueEntry
  ): Promise<'success' | 'conflict' | 'error'> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (entry.type === 'campaign') {
          const campaign = entry.data as Campaign;
          const result = await this.pushCampaignToRemote(campaign);
          if (result === 'conflict') return 'conflict';
          if (typeof result === 'number') {
            await updateBaseSnapshot(campaign.id, { ...campaign, version: result });
            return 'success';
          }
          // result === 'error' — retry
        } else if (entry.type === 'hex' && entry.hexKey) {
          const hex = entry.data as Hex;
          const { error } = await upsertHex(
            this.client,
            entry.campaignId,
            entry.hexKey,
            hex,
            entry.version
          );
          if (!error) return 'success';
          // Has error — retry
        } else {
          return 'error'; // Unknown entry type
        }
      } catch {
        // Network error — retry
      }
    }

    // Exhausted retries
    return 'error';
  }

  /**
   * Handle a version conflict: fetch remote campaign, compute diff,
   * pause queue, and notify listeners.
   */
  private async handleVersionConflict(
    localCampaign: Campaign,
    _serverVersion: number
  ): Promise<void> {
    this.queuePaused = true;

    try {
      // Fetch the latest remote state (may be newer than _serverVersion if
      // another write landed between the RPC rejection and this fetch)
      const { campaign: remoteCampaign } = await loadCloudCampaign(
        this.client,
        localCampaign.id
      );
      if (!remoteCampaign) {
        this.setStatus('error');
        return;
      }

      // computeCampaignConflict already populates versions from the campaigns
      const conflict = computeCampaignConflict(localCampaign, remoteCampaign);

      this.setPendingConflict(conflict);
      this.setStatus('conflict');
    } catch {
      this.setStatus('error');
      this.queuePaused = false;
    }
  }
}
