import { useState, useEffect } from 'react';
import { syncService } from '../lib/sync';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(syncService.getOnlineStatus());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
