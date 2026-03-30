// SyncContext — React context wrapping SyncEngine for UI consumption.
// Exposes sync status, pending conflicts, queue count, and resolution actions.
// Falls back to a no-op context when cloud sync is disabled.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { SyncEngine, SyncStatus } from '../services/syncEngine';
import type { CampaignConflict, ConflictResolution } from '../types/Sync';

interface SyncContextValue {
  syncStatus: SyncStatus;
  pendingConflict: CampaignConflict | null;
  queueCount: number;
  resolveConflict: (resolution: ConflictResolution) => Promise<void>;
}

const defaultValue: SyncContextValue = {
  syncStatus: 'synced',
  pendingConflict: null,
  queueCount: 0,
  resolveConflict: async () => {},
};

const SyncContext = createContext<SyncContextValue>(defaultValue);

export function useSyncContext(): SyncContextValue {
  return useContext(SyncContext);
}

interface SyncProviderProps {
  engine: SyncEngine | null;
  children: ReactNode;
}

export function SyncProvider({ engine, children }: SyncProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    engine?.getStatus() ?? 'synced'
  );
  const [pendingConflict, setPendingConflict] = useState<CampaignConflict | null>(
    engine?.getPendingConflict() ?? null
  );
  const [queueCount, setQueueCount] = useState(0);

  // Subscribe to engine status and conflict changes
  useEffect(() => {
    if (!engine) return;

    let mounted = true;
    const safeSetQueueCount = (count: number) => { if (mounted) setQueueCount(count); };

    setSyncStatus(engine.getStatus());
    setPendingConflict(engine.getPendingConflict());

    const unsubStatus = engine.onStatusChange((status) => {
      if (mounted) setSyncStatus(status);
      // Refresh queue count on status change
      engine.getQueueCount().then(safeSetQueueCount).catch(() => {});
    });

    const unsubConflict = engine.onConflictChange((conflict) => {
      if (mounted) setPendingConflict(conflict);
    });

    // Initial queue count
    engine.getQueueCount().then(safeSetQueueCount).catch(() => {});

    return () => {
      mounted = false;
      unsubStatus();
      unsubConflict();
    };
  }, [engine]);

  const resolveConflict = useCallback(
    async (resolution: ConflictResolution) => {
      if (!engine) return;
      try {
        await engine.resolveConflict(resolution);
      } finally {
        // Always refresh queue count, even on error
        engine.getQueueCount().then(setQueueCount).catch(() => {});
      }
    },
    [engine]
  );

  const value = useMemo(
    () => ({
      syncStatus,
      pendingConflict,
      queueCount,
      resolveConflict,
    }),
    [syncStatus, pendingConflict, queueCount, resolveConflict]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
