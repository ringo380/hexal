// syncEngine — Coordinates between local IndexedDB cache and Supabase.
// Writes to cache immediately for instant local feedback, then queues
// changes for remote sync. Replays the offline queue when connectivity
// is restored.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Campaign, Hex } from '../types';
import {
  cacheCampaign,
  cacheHex,
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
  type SyncQueueEntry,
} from './localCache';
import { saveCloudCampaign, upsertHex } from './cloudStorage';
import { connectionManager } from './connectionManager';

// ============ TYPES ============

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'conflict' | 'error';
type SyncStatusListener = (status: SyncStatus) => void;

// ============ SYNC ENGINE ============

export class SyncEngine {
  private client: SupabaseClient;
  private userId: string;
  private status: SyncStatus = 'synced';
  private statusListeners: Set<SyncStatusListener> = new Set();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionCleanup: (() => void) | null = null;

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

    if (connectionManager.online) {
      // Debounce remote push
      if (this.syncTimer !== null) {
        clearTimeout(this.syncTimer);
      }
      this.syncTimer = setTimeout(async () => {
        this.syncTimer = null;
        this.setStatus('syncing');
        try {
          const { error } = await saveCloudCampaign(this.client, campaign, this.userId);
          if (error) {
            // Remote save failed — queue for retry
            await addToSyncQueue({
              campaignId: campaign.id,
              type: 'campaign',
              data: campaign,
              version,
              timestamp: Date.now(),
            });
            this.setStatus('error');
          } else {
            this.setStatus('synced');
          }
        } catch {
          await addToSyncQueue({
            campaignId: campaign.id,
            type: 'campaign',
            data: campaign,
            version,
            timestamp: Date.now(),
          });
          this.setStatus('error');
        }
      }, debounceMs);
    } else {
      // Offline — queue for later
      await addToSyncQueue({
        campaignId: campaign.id,
        type: 'campaign',
        data: campaign,
        version,
        timestamp: Date.now(),
      });
      this.setStatus('offline');
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

    if (connectionManager.online) {
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
      this.setStatus('offline');
    }
  }

  /**
   * Replay the offline sync queue, pushing entries to the server in order.
   * On conflict (version mismatch), sets status to 'conflict' and stops.
   */
  async replayQueue(): Promise<void> {
    const entries = await getSyncQueue();
    if (entries.length === 0) {
      this.setStatus('synced');
      return;
    }

    this.setStatus('syncing');
    const processedIds: number[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!connectionManager.online) {
        // Lost connection mid-replay
        this.setStatus('offline');
        break;
      }

      const success = await this.pushToRemote(entry);
      if (success) {
        if (entry.id !== undefined) {
          processedIds.push(entry.id);
        }
      } else {
        // Stop processing on failure — remaining entries stay queued
        break;
      }
    }

    // Clear successfully processed entries
    if (processedIds.length > 0) {
      await clearSyncQueue(processedIds);
    }

    // Update status based on outcome
    if (this.status !== 'conflict' && this.status !== 'offline') {
      const remaining = await getSyncQueue();
      this.setStatus(remaining.length === 0 ? 'synced' : 'error');
    }
  }

  /** Get current sync status. */
  getStatus(): SyncStatus {
    return this.status;
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

  private setStatus(status: SyncStatus): void {
    if (this.status === status) return;
    this.status = status;
    // Use Array.from().forEach() instead of for...of (ES3 compat for electron/)
    Array.from(this.statusListeners).forEach(listener => listener(status));
  }

  /**
   * Push a single queued entry to the remote server.
   * Returns true on success, false on failure.
   * Sets status to 'conflict' if a version conflict is detected.
   */
  private async pushToRemote(entry: SyncQueueEntry): Promise<boolean> {
    try {
      if (entry.type === 'campaign') {
        const campaign = entry.data as Campaign;
        const { error } = await saveCloudCampaign(this.client, campaign, this.userId);
        if (error) {
          // Check for version conflict indicators
          if (error.includes('conflict') || error.includes('version')) {
            this.setStatus('conflict');
          } else {
            this.setStatus('error');
          }
          return false;
        }
        return true;
      } else if (entry.type === 'hex' && entry.hexKey) {
        const hex = entry.data as Hex;
        const { error } = await upsertHex(
          this.client,
          entry.campaignId,
          entry.hexKey,
          hex,
          entry.version
        );
        if (error) {
          if (error.includes('conflict') || error.includes('version')) {
            this.setStatus('conflict');
          } else {
            this.setStatus('error');
          }
          return false;
        }
        return true;
      }
      return false;
    } catch {
      this.setStatus('error');
      return false;
    }
  }
}
