/**
 * offlineSync.ts
 * React hook for automatic background synchronization.
 * Listens to online/offline events, syncs queued data when connectivity returns.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isOnline,
  syncAll,
  syncOfflinePatrol,
  getQueue,
  getPendingRoutes,
  getOfflinePatrolData,
} from './offlineStore';
import api from './api';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced';

const SYNC_INTERVAL = 30_000; // 30 seconds

/**
 * Bridge function that maps our queue actions to actual axios calls.
 */
async function apiCall(method: string, url: string, payload: any): Promise<any> {
  switch (method) {
    case 'POST':
      return api.post(url, payload);
    case 'PUT':
      return api.put(url, payload);
    case 'DELETE':
      return api.delete(url, { data: payload });
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>(isOnline() ? 'online' : 'offline');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number } | null>(null);
  const syncingRef = useRef(false);
  const syncedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Count all pending items
  const updatePendingCount = useCallback(() => {
    const queueCount = getQueue().length;
    const routesCount = getPendingRoutes().length;
    const patrolData = getOfflinePatrolData();
    const patrolCount = patrolData
      ? patrolData.positions.length + patrolData.checkpoints.length + (patrolData.finishAction ? 1 : 0)
      : 0;
    setPendingCount(queueCount + routesCount + patrolCount);
  }, []);

  // Main sync function
  const doSync = useCallback(async () => {
    if (syncingRef.current || !isOnline()) return;

    updatePendingCount();
    if (pendingCount === 0 && getQueue().length === 0 && getPendingRoutes().length === 0 && !getOfflinePatrolData()) return;

    syncingRef.current = true;
    setStatus('syncing');

    try {
      // Sync generic queue + pending routes
      const result = await syncAll(apiCall);

      // Sync patrol-specific data
      await syncOfflinePatrol(apiCall);

      setLastSyncResult(result);
      updatePendingCount();

      // Show 'synced' briefly
      setStatus('synced');
      if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
      syncedTimerRef.current = setTimeout(() => {
        setStatus(isOnline() ? 'online' : 'offline');
      }, 4000);
    } catch (err) {
      console.error('[Sync] Erro na sincronização:', err);
      setStatus(isOnline() ? 'online' : 'offline');
    } finally {
      syncingRef.current = false;
    }
  }, [pendingCount, updatePendingCount]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus('online');
      // Give the network a moment to stabilize, then sync
      setTimeout(() => doSync(), 2000);
    };

    const handleOffline = () => {
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [doSync]);

  // Periodic sync attempt
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline()) {
        updatePendingCount();
        doSync();
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [doSync, updatePendingCount]);

  // Initial count
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  return {
    status,
    pendingCount,
    lastSyncResult,
    triggerSync: doSync,
    updatePendingCount,
  };
}
