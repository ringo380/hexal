// ConnectionStatus — Toolbar indicator for online/offline and sync state.
// Currently reads navigator.onLine only. Sync status will be integrated
// when the cloud sync engine is wired up.

import { useState, useEffect } from 'react';

type Status = 'synced' | 'syncing' | 'offline' | 'conflict' | 'error';

function ConnectionStatus() {
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

  // For now, status is derived solely from navigator.onLine.
  // Once the sync engine is integrated, this will read from a SyncContext
  // that provides granular status: synced | syncing | offline | conflict | error.
  const status: Status = online ? 'synced' : 'offline';
  const label = online ? 'Online' : 'Offline';

  return (
    <div className="connection-status" title={label}>
      <span className={`connection-dot connection-dot--${status}`} />
      <span>{label}</span>
    </div>
  );
}

export default ConnectionStatus;
