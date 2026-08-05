/**
 * offlineStore.ts
 * Central offline storage module — queue & replay architecture.
 * Uses localStorage for persistence across sessions.
 */

const QUEUE_KEY = 'sgp_offline_queue';
const PENDING_ROUTES_KEY = 'sgp_pending_routes';

export interface QueuedAction {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  payload: any;
  createdAt: string;
  label?: string; // human-readable description
}

// ── Helpers ──────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

// ── Generic key-value store ──────────────────────────────

export function saveOffline(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Offline] Erro ao salvar no localStorage:', e);
  }
}

export function getOffline<T = any>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function removeOffline(key: string): void {
  localStorage.removeItem(key);
}

// ── Action Queue ─────────────────────────────────────────

export function getQueue(): QueuedAction[] {
  return getOffline<QueuedAction[]>(QUEUE_KEY) || [];
}

export function queueAction(
  method: QueuedAction['method'],
  url: string,
  payload: any,
  label?: string,
): string {
  const queue = getQueue();
  const id = generateId();
  queue.push({
    id,
    method,
    url,
    payload,
    createdAt: new Date().toISOString(),
    label,
  });
  saveOffline(QUEUE_KEY, queue);
  return id;
}

export function removeQueueItem(id: string): void {
  const queue = getQueue().filter(item => item.id !== id);
  saveOffline(QUEUE_KEY, queue);
}

export function clearQueue(): void {
  removeOffline(QUEUE_KEY);
}

// ── Sync Engine ──────────────────────────────────────────

/**
 * Attempt to replay all queued actions against the API.
 * Returns { synced: number, failed: number }
 */
export async function syncAll(
  apiCall: (method: string, url: string, payload: any) => Promise<any>,
): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const action of queue) {
    // Skip patrol start actions — handled by syncOfflinePatrol
    if (action.url === '/patrols/start') {
      removeQueueItem(action.id);
      synced++;
      continue;
    }
    try {
      await apiCall(action.method, action.url, action.payload);
      removeQueueItem(action.id);
      synced++;
    } catch (err) {
      console.warn(`[Offline Sync] Falha ao sincronizar ${action.label || action.url}:`, err);
      failed++;
    }
  }

  // Also sync pending routes
  await syncPendingRoutes(apiCall);

  return { synced, failed };
}

// ── Pending Routes (special handling) ────────────────────

export interface PendingRoute {
  id: string;
  name: string;
  description: string;
  checkpoints: string;
  geofence: string;
  estimated_duration_min: number;
  is_active: boolean;
  createdAt: string;
}

export function getPendingRoutes(): PendingRoute[] {
  return getOffline<PendingRoute[]>(PENDING_ROUTES_KEY) || [];
}

export function addPendingRoute(route: Omit<PendingRoute, 'id' | 'createdAt'>): string {
  const routes = getPendingRoutes();
  const id = generateId();
  routes.push({ ...route, id, createdAt: new Date().toISOString() });
  saveOffline(PENDING_ROUTES_KEY, routes);
  return id;
}

export function removePendingRoute(id: string): void {
  const routes = getPendingRoutes().filter(r => r.id !== id);
  saveOffline(PENDING_ROUTES_KEY, routes);
}

async function syncPendingRoutes(
  apiCall: (method: string, url: string, payload: any) => Promise<any>,
): Promise<void> {
  const routes = getPendingRoutes();
  for (const route of routes) {
    try {
      const { id, createdAt, ...payload } = route;
      await apiCall('POST', '/patrol-routes', payload);
      removePendingRoute(id);
    } catch (err) {
      console.warn(`[Offline Sync] Falha ao sincronizar rota "${route.name}":`, err);
    }
  }
}

// ── Offline Patrol Data (GPS positions, checkpoints) ─────

const OFFLINE_PATROL_KEY = 'sgp_offline_patrol';

export interface OfflinePatrolData {
  patrolId: number;
  patrolRouteId?: number; // needed to create patrol on server when syncing
  positions: Array<{ lat: number; lng: number; timestamp: string }>;
  checkpoints: Array<{ checkpoint_index: number; lat: number; lng: number; visited_at: string }>;
  finishAction?: 'finish' | 'cancel';
  observations?: string;
}

export function getOfflinePatrolData(): OfflinePatrolData | null {
  return getOffline<OfflinePatrolData>(OFFLINE_PATROL_KEY);
}

export function saveOfflinePatrolData(data: OfflinePatrolData): void {
  saveOffline(OFFLINE_PATROL_KEY, data);
}

export function addOfflinePosition(patrolId: number, lat: number, lng: number): void {
  const data = getOfflinePatrolData() || { patrolId, positions: [], checkpoints: [] };
  data.positions.push({ lat, lng, timestamp: new Date().toISOString() });
  saveOfflinePatrolData(data);
}

export function addOfflineCheckpoint(patrolId: number, checkpoint_index: number, lat: number, lng: number): void {
  const data = getOfflinePatrolData() || { patrolId, positions: [], checkpoints: [] };
  data.checkpoints.push({ checkpoint_index, lat, lng, visited_at: new Date().toISOString() });
  saveOfflinePatrolData(data);
}

export function setOfflineFinishAction(action: 'finish' | 'cancel', observations?: string): void {
  const data = getOfflinePatrolData();
  if (data) {
    data.finishAction = action;
    if (observations) {
      data.observations = observations;
    }
    saveOfflinePatrolData(data);
  }
}

export function clearOfflinePatrolData(): void {
  removeOffline(OFFLINE_PATROL_KEY);
}

/**
 * Sync all offline patrol data (positions, checkpoints, finish/cancel).
 * Handles fully-offline patrols (negative ID) by creating the patrol first.
 */
export async function syncOfflinePatrol(
  apiCall: (method: string, url: string, payload: any) => Promise<any>,
): Promise<void> {
  const data = getOfflinePatrolData();
  if (!data) return;

  let realPatrolId = data.patrolId;

  // If patrol was created offline (negative ID), create it on server first
  if (realPatrolId < 0 && data.patrolRouteId) {
    try {
      const res = await apiCall('POST', '/patrols/start', { patrol_route_id: data.patrolRouteId });
      realPatrolId = res.data.id;
      console.log(`[Offline Sync] Ronda criada no servidor com ID ${realPatrolId}`);
    } catch (err) {
      console.error('[Offline Sync] Falha ao criar ronda no servidor:', err);
      // Can't sync anything without a real ID — keep data for next attempt
      return;
    }
  } else if (realPatrolId < 0) {
    // No route ID saved — can't create patrol. Clear stale data.
    console.warn('[Offline Sync] Ronda offline sem patrol_route_id. Limpando dados.');
    clearOfflinePatrolData();
    return;
  }

  // 1. Sync positions (in order)
  for (const pos of data.positions) {
    try {
      await apiCall('POST', `/patrols/${realPatrolId}/position`, { lat: pos.lat, lng: pos.lng });
    } catch (err) {
      console.warn('[Offline Sync] Falha ao enviar posição GPS:', err);
    }
  }

  // 2. Sync checkpoints (in order)
  for (const cp of data.checkpoints) {
    try {
      await apiCall('POST', `/patrols/${realPatrolId}/checkpoint`, {
        checkpoint_index: cp.checkpoint_index,
        lat: cp.lat,
        lng: cp.lng,
      });
    } catch (err) {
      console.warn('[Offline Sync] Falha ao enviar checkpoint:', err);
    }
  }

  // 4. Sync Finish/Cancel
  if (data.finishAction) {
    try {
      const payload = data.finishAction === 'finish' ? { observations: data.observations } : {};
      await apiCall('POST', `/patrols/${realPatrolId}/${data.finishAction}`, payload);
    } catch (err) {
      console.warn('[Offline Sync] Falha ao finalizar/cancelar ronda:', err);
    }
  }

  clearOfflinePatrolData();
}
