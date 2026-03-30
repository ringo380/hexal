// ConnectionStatus — Toolbar indicator for sync state.
// Reads from SyncContext when cloud sync is enabled, falls back to
// navigator.onLine for local-only mode.

import { useState, useEffect } from 'react';
import { useSyncContext } from '../../stores/SyncContext';

const STATUS_CONFIG = {
  synced:   { label: 'Synced',    dotClass: 'connection-dot--synced' },
  syncing:  { label: 'Syncing...', dotClass: 'connection-dot--syncing' },
  offline:  { label: 'Offline',   dotClass: 'connection-dot--offline' },
  conflict: { label: 'Conflict',  dotClass: 'connection-dot--conflict' },
  error:    { label: 'Sync Error', dotClass: 'connection-dot--error' },
} as const;

function ConnectionStatus() {
  const { syncStatus, queueCount } = useSyncContext();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Use sync status when available, otherwise derive from navigator.onLine
  const effectiveStatus = syncStatus;
  const config = STATUS_CONFIG[effectiveStatus];

  // Append pending count for offline status
  let label: string = config.label;
  if (effectiveStatus === 'offline' && queueCount > 0) {
    label = `Offline (${queueCount} pending)`;
  }

  // In local-only mode (no SyncProvider), show basic online/offline
  if (!online && effectiveStatus === 'synced') {
    return (
      <div className="connection-status" title="Offline">
        <span className="connection-dot connection-dot--offline" />
        <span>Offline</span>
      </div>
    );
  }

  return (
    <div className="connection-status" title={label}>
      <span className={`connection-dot ${config.dotClass}`} />
      <span>{label}</span>
    </div>
  );
}

export default ConnectionStatus;
