import { useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/offline-storage';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize offline storage
    offlineStorage.init().then(() => {
      setIsInitialized(true);
    }).catch(error => {
      console.error('Failed to initialize offline storage:', error);
    });

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          return registration.sync.register('sync-pending-data');
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_START') {
        console.log('Sync started');
      } else if (event.data.type === 'SYNC_COMPLETE') {
        console.log('Sync completed');
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isInitialized
  };
}

// Hook for offline-first data operations
export function useOfflineStorage() {
  const { isOnline, isInitialized } = useOffline();

  const saveWithFallback = async (
    onlineOperation: () => Promise<any>,
    offlineOperation: () => Promise<void>,
    pendingOperation?: () => Promise<void>
  ) => {
    if (!isInitialized) {
      throw new Error('Offline storage not initialized');
    }

    if (isOnline) {
      try {
        const result = await onlineOperation();
        // Also save to offline storage for caching
        await offlineOperation();
        return result;
      } catch (error) {
        // If online operation fails, save to offline storage and queue for sync
        await offlineOperation();
        if (pendingOperation) {
          await pendingOperation();
        }
        throw error;
      }
    } else {
      // Save to offline storage and queue for sync
      await offlineOperation();
      if (pendingOperation) {
        await pendingOperation();
      }
      return { offline: true, message: 'Saved offline, will sync when online' };
    }
  };

  const getWithFallback = async (
    onlineOperation: () => Promise<any>,
    offlineOperation: () => Promise<any>
  ) => {
    if (!isInitialized) {
      throw new Error('Offline storage not initialized');
    }

    if (isOnline) {
      try {
        const result = await onlineOperation();
        return result;
      } catch (error) {
        // Fallback to offline storage
        return await offlineOperation();
      }
    } else {
      return await offlineOperation();
    }
  };

  return {
    isOnline,
    isInitialized,
    saveWithFallback,
    getWithFallback,
    storage: offlineStorage
  };
}