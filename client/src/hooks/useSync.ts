import { useState, useEffect } from 'react';
import { syncService } from '../lib/sync';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Listen to sync status changes from the service
    const handleSyncStatusChange = (syncing: boolean) => {
      setIsSyncing(syncing);
    };

    syncService.addSyncListener(handleSyncStatusChange);

    return () => {
      syncService.removeSyncListener(handleSyncStatusChange);
    };
  }, []);

  const sync = async () => {
    await syncService.sync();
  };

  return { sync, isSyncing };
}
