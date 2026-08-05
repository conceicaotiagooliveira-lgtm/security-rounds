import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Play, Square, MapPin, Navigation, AlertTriangle, Gauge, XCircle, CheckCircle, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import {
  isOnline,
  addOfflinePosition,
  addOfflineCheckpoint,
  setOfflineFinishAction,
  saveOffline,
  getOffline,
  removeOffline,
  saveOfflinePatrolData,
  getOfflinePatrolData,
  clearOfflinePatrolData,
  queueAction,
} from '@/services/offlineStore';

const GPS_INTERVAL = 5000; // 5 seconds

// Geofence exit siren using Web Audio API
let sirenOsc: OscillatorNode | null = null;
let sirenCtx: AudioContext | null = null;
let sirenLfo: OscillatorNode | null = null;

function playGeofenceAlarm() {
  if (sirenOsc) return; // already playing
  try {
    const ctx = new AudioContext();
    sirenCtx = ctx;

    // Main oscillator — sawtooth for harsh siren tone
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 900;

    // LFO to sweep frequency up and down (600Hz ↔ 1200Hz) = siren wail
    const lfo = ctx.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 2; // 2 sweeps per second

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300; // sweep range: 900 ± 300 = 600-1200Hz

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Volume — loud
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;

    osc.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc.start();
    lfo.start();

    sirenOsc = osc;
    sirenLfo = lfo;
  } catch (e) {
    console.warn('[Alarm] Web Audio não disponível:', e);
  }
}

function stopGeofenceAlarm() {
  if (sirenOsc) {
    sirenOsc.stop();
    sirenOsc = null;
  }
  if (sirenLfo) {
    sirenLfo.stop();
    sirenLfo = null;
  }
  if (sirenCtx) {
    sirenCtx.close().catch(() => {});
    sirenCtx = null;
  }
}

const getCheckpointIcon = (index: number, visited: boolean, isCurrentTarget: boolean) => {
  const color = visited ? '#10b981' : (isCurrentTarget ? '#000000' : '#ef4444');
  return new L.DivIcon({
    html: `<div style="background:${color}; transform: rotate(var(--map-counter-rotation, 0deg)); transition: transform 0.5s ease-out; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:13px; border:3px solid white; box-shadow:0 2px 10px rgba(0,0,0,0.3);">${index + 1}</div>`,
    className: 'custom-cp-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const getGuardIcon = (heading: number | null) => {
  const rotation = heading !== null ? `transform: rotate(${heading}deg);` : '';
  return new L.DivIcon({
    html: `<div style="position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; ${rotation}">
      <svg width="80" height="80" viewBox="0 0 80 80" style="position: absolute; top: 0; left: 0;">
        <defs>
          <radialGradient id="beam" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(59, 130, 246, 0.6)" />
            <stop offset="100%" stop-color="rgba(59, 130, 246, 0)" />
          </radialGradient>
        </defs>
        <polygon points="40,40 15,0 65,0" fill="url(#beam)" />
      </svg>
      <div style="background: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 2;"></div>
    </div>`,
    className: 'custom-guard-icon',
    iconSize: [80, 80],
    iconAnchor: [40, 40],
  });
};

// Fit map bounds to route area only once (not on every GPS update)
function FitBoundsOnce({ checkpoints, geofence }: { checkpoints: any[]; geofence: number[][] }) {
  const map = useMap();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current) return;
    const points: [number, number][] = [
      ...checkpoints.map((cp: any) => [cp.lat, cp.lng] as [number, number]),
      ...geofence.map((g: number[]) => [g[0], g[1]] as [number, number]),
    ];
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
      hasFitted.current = true;
    } else if (points.length === 1) {
      map.setView(points[0], 18);
      hasFitted.current = true;
    }
  }, [checkpoints, geofence, map]);
  return null;
}

// Map Controller for Navigation Mode (Centers and locks dragging)
function NavigationController({ position, isNavMode }: { position: [number, number] | null; isNavMode: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isNavMode && position) {
      map.setView(position, 19, { animate: true, duration: 0.5 });
    }
  }, [position, isNavMode, map]);

  useEffect(() => {
    if (isNavMode) {
      map.dragging.disable();
      map.touchZoom.disable();
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
    }
  }, [isNavMode, map]);
  return null;
}

// Clear all live patrol cache from localStorage
function clearLivePatrolCache() {
  localStorage.removeItem('sgp_last_position');
  localStorage.removeItem('sgp_live_gps_track');
  localStorage.removeItem('sgp_visited_indices');
}

export default function GuardDashboard() {
  const { user, logout } = useAuthStore();

  const [currentGuard, setCurrentGuard] = useState<any | null>(null);
  const [patrolRoutes, setPatrolRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [activePatrol, setActivePatrol] = useState<any>(null);

  // Desloga o vigia automaticamente se ficar 2 minutos sem ronda ativa
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    // Aplica o logout automático apenas para Vigias comuns. Se for gerente/admin/operador, ou um vigia com permissões extras, não desloga.
    const isJustRegularGuard = user?.role === 'Vigia' && (!user?.permissions || user.permissions.length === 0);
    
    if (!activePatrol && isJustRegularGuard) {
      timer = setTimeout(() => {
        logout();
      }, 2 * 60 * 1000); // 2 minutos
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activePatrol, logout, user]);
  // Restore position from cache so blue marker appears instantly after reload
  const [position, setPosition] = useState<[number, number] | null>(() => {
    try { return JSON.parse(localStorage.getItem('sgp_last_position') || 'null'); } catch { return null; }
  });
  const [accuracy, setAccuracy] = useState<number>(10);
  const [heading, setHeading] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [isNavigationMode, setIsNavigationMode] = useState(true);
  // Restore GPS track from cache so trajectory line appears instantly after reload
  const [gpsTrack, setGpsTrack] = useState<[number, number][]>(() => {
    try { return JSON.parse(localStorage.getItem('sgp_live_gps_track') || '[]'); } catch { return []; }
  });
  const [insideGeofence, setInsideGeofence] = useState(true);
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(() => {
    try { 
      const arr = JSON.parse(localStorage.getItem('sgp_visited_indices') || '[]');
      return new Set(arr);
    } catch { return new Set(); }
  });
  const [autoCheckinCandidate, setAutoCheckinCandidate] = useState<{ idx: number, timer: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Celebration Popup State
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState("");
  
  // Justification State
  const [showDelayJustification, setShowDelayJustification] = useState(false);
  const [delayJustification, setDelayJustification] = useState('');

  // Observation Modal State
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [observationText, setObservationText] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const positionRef = useRef<[number, number] | null>(position);
  const lastValidPosRef = useRef<{lat: number, lng: number, timestamp: number} | null>(null);

  const [isForceGpsLoading, setIsForceGpsLoading] = useState(false);

  const forceGpsUpdate = () => {
    if (!navigator.geolocation) return;
    setIsForceGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setAccuracy(pos.coords.accuracy);
        lastValidPosRef.current = { lat: coords[0], lng: coords[1], timestamp: Date.now() };
        setPosition(coords);
        positionRef.current = coords;
        if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
          setHeading(pos.coords.heading);
        }
        if (pos.coords.speed !== null && !isNaN(pos.coords.speed)) {
          setSpeed(Math.max(0, pos.coords.speed * 3.6));
        }
        setIsForceGpsLoading(false);
      },
      (err) => {
        setIsForceGpsLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  // Keep screen on during active patrol
  useEffect(() => {
    const acquireWakeLock = async () => {
      if ('wakeLock' in navigator && activePatrol) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('[WakeLock] Tela travada — não vai desligar');
          wakeLockRef.current.addEventListener('release', () => {
            console.log('[WakeLock] Liberado');
          });
        } catch (err) {
          console.warn('[WakeLock] Não foi possível manter a tela ligada:', err);
        }
      }
    };

    if (activePatrol) {
      acquireWakeLock();
      // Re-acquire on visibility change (e.g., user switches tabs and comes back)
      const handleVisibility = () => {
        if (document.visibilityState === 'visible' && activePatrol) {
          acquireWakeLock();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        wakeLockRef.current?.release();
        wakeLockRef.current = null;
      };
    } else {
      // Release if patrol ended
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    }
  }, [activePatrol]);

  // Persist live patrol state to localStorage (survives page reloads)
  useEffect(() => {
    if (position) {
      localStorage.setItem('sgp_last_position', JSON.stringify(position));
    }
  }, [position]);

  useEffect(() => {
    if (gpsTrack.length > 0) {
      localStorage.setItem('sgp_live_gps_track', JSON.stringify(gpsTrack));
    }
  }, [gpsTrack]);

  useEffect(() => {
    if (visitedIndices.size > 0) {
      localStorage.setItem('sgp_visited_indices', JSON.stringify([...visitedIndices]));
    }
  }, [visitedIndices]);

  // Fetch patrol routes (with offline fallback)
  // Only re-fetch from server if there's NO pending offline data
  useEffect(() => {
    if (user?.id) {
      api.get('/guards').then(res => {
        const found = res.data.find((g: any) => g.user_id === user.id);
        if (found) {
          setCurrentGuard(found);
          saveOffline('sgp_cached_current_guard', found);
        }
      }).catch(() => {
        const cached = getOffline<any>('sgp_cached_current_guard');
        if (cached) setCurrentGuard(cached);
      });
    }

    const offlineData = getOfflinePatrolData();
    const hasPendingOffline = offlineData && (offlineData.positions.length > 0 || offlineData.checkpoints.length > 0 || offlineData.finishAction);

    // Cached live track from localStorage (survives reloads)
    const cachedLiveTrack: [number, number][] = (() => {
      try { return JSON.parse(localStorage.getItem('sgp_live_gps_track') || '[]'); } catch { return []; }
    })();

    const restorePatrol = (patrol: any) => {
      setActivePatrol(patrol);
      saveOffline('sgp_cached_active_patrol', patrol);

      const visited = JSON.parse(patrol.checkpoints_visited || '[]');
      const offlineVisited = offlineData?.checkpoints?.map((c: any) => c.checkpoint_index) || [];
      setVisitedIndices(new Set([...visited.map((v: any) => v.checkpoint_index), ...offlineVisited]));

      // Use the longer track (local may have more points than server)
      const serverTrack: [number, number][] = JSON.parse(patrol.gps_track || '[]').map((t: any) => [t.lat, t.lng]);
      const bestTrack = cachedLiveTrack.length >= serverTrack.length ? cachedLiveTrack : serverTrack;
      setGpsTrack(bestTrack);

      // Re-start GPS tracking so the blue marker keeps moving
      startGpsTracking(patrol.id);
    };

    api.get('/patrol-routes').then(res => {
      setPatrolRoutes(res.data);
      saveOffline('sgp_cached_patrol_routes', res.data);
    }).catch(() => {
      const cached = getOffline<any[]>('sgp_cached_patrol_routes');
      if (cached) setPatrolRoutes(cached);
    });

    if (!hasPendingOffline) {
      api.get('/patrols/active').then(res => {
        restorePatrol(res.data);
      }).catch(() => {
        const cached = getOffline<any>('sgp_cached_active_patrol');
        if (cached) restorePatrol(cached);
      });
    } else {
      const cached = getOffline<any>('sgp_cached_active_patrol');
      if (cached) restorePatrol(cached);
    }

    return () => {
      // Cleanup on unmount
      stopGpsTracking();
    };
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      console.log('[Sync] Internet voltou — sincronizando silenciosamente...');

      // Check if patrol was finished/cancelled offline BEFORE syncing
      const offlineData = getOfflinePatrolData();
      const wasFinishedOffline = offlineData?.finishAction != null;

      const { syncAll, syncOfflinePatrol } = await import('@/services/offlineStore');
      const apiCall = async (method: string, url: string, payload: any) => {
        if (method === 'POST') return api.post(url, payload);
        if (method === 'PUT') return api.put(url, payload);
        return api.delete(url, { data: payload });
      };
      await syncAll(apiCall);
      await syncOfflinePatrol(apiCall);

      if (wasFinishedOffline) {
        setActivePatrol(null);
        clearLivePatrolCache();
        setVisitedIndices(new Set());
        removeOffline('sgp_cached_active_patrol');
        console.log('[Sync] Ronda finalizada/cancelada offline — UI limpa');
      }
      // If patrol is still active, don't reload — keep current state stable
      // The interval GPS position updates will resume automatically
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Start GPS tracking
  const startGpsTracking = useCallback((patrolId: number) => {
    if (!navigator.geolocation) { setError('GPS não disponível'); return; }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];

        // GPS Stabilization: Ignore highly inaccurate readings
        if (pos.coords.accuracy > 35 && positionRef.current) {
          return;
        }

        // Advanced Anti-Jitter: Speed & Distance filter
        if (lastValidPosRef.current) {
          const dist = L.latLng(lastValidPosRef.current.lat, lastValidPosRef.current.lng).distanceTo(L.latLng(coords[0], coords[1]));
          const timeDiff = (now - lastValidPosRef.current.timestamp) / 1000; // seconds
          const speedMS = timeDiff > 0 ? dist / timeDiff : 0;
          
          // If speed is impossible for a walking human (> 8m/s or ~28km/h) and accuracy isn't perfect, it's a GPS multipath jump
          if (speedMS > 8 && pos.coords.accuracy > 10) {
            return;
          }

          // If distance moved is less than 3 meters, ignore update to stop jittering when standing still
          if (dist < 3) {
            return; 
          }
        }

        // Update real accuracy
        setAccuracy(pos.coords.accuracy);
        
        lastValidPosRef.current = { lat: coords[0], lng: coords[1], timestamp: now };
        
        setGpsTrack(prev => [...prev, coords]);
        setPosition(coords);
        positionRef.current = coords;
        
        if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
          setHeading(pos.coords.heading);
        }
        if (pos.coords.speed !== null && !isNaN(pos.coords.speed)) {
          setSpeed(Math.max(0, pos.coords.speed * 3.6));
        }
      },
      (err) => {
        setError('Erro ao obter localização. Verifique as permissões de GPS.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    intervalRef.current = setInterval(async () => {
      const currentPos = positionRef.current;
      if (!currentPos) return;
      try {
        const res = await api.post(`/patrols/${patrolId}/position`, { lat: currentPos[0], lng: currentPos[1] });
        setInsideGeofence(res.data.inside_geofence);
        if (!res.data.inside_geofence) {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
          playGeofenceAlarm();
        } else {
          stopGeofenceAlarm();
        }
      } catch (err) {
        // Offline: save position locally
        addOfflinePosition(patrolId, currentPos[0], currentPos[1]);
        console.log('[Offline] Posição GPS salva localmente');
      }
    }, GPS_INTERVAL);
  }, []);

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    watchIdRef.current = null;
    intervalRef.current = null;
    stopGeofenceAlarm();
  };

  const [gpsStatus, setGpsStatus] = useState<'checking' | 'granted' | 'denied' | 'unavailable' | null>(null);

  useEffect(() => {
    const handleOrientation = (e: any) => {
      if (e.webkitCompassHeading !== undefined) {
        setHeading(e.webkitCompassHeading);
      } else if (e.absolute && e.alpha !== null) {
        setHeading(360 - e.alpha);
      }
    };
    window.addEventListener('deviceorientationabsolute', handleOrientation);
    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }
    navigator.permissions?.query({ name: 'geolocation' }).then(result => {
      setGpsStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : null);
      result.onchange = () => {
        setGpsStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : null);
      };
    }).catch(() => {});
  }, []);

  const handleStartClick = () => {
    if (!selectedRouteId) { setError('Selecione um roteiro'); return; }
    
    // Check if delayed
    const route = patrolRoutes.find(r => r.id === selectedRouteId);
    let isDelayed = false;
    if (route && route.last_missed_alert_time && route.is_active) {
      const alertTimeStr = route.last_missed_alert_time.endsWith('Z') ? route.last_missed_alert_time : `${route.last_missed_alert_time}Z`;
      const alertTime = new Date(alertTimeStr);
      const repeatMs = (route.repeat_every_minutes || 1440) * 60 * 1000;
      if (new Date().getTime() - alertTime.getTime() < repeatMs) {
        isDelayed = true;
      }
    }

    if (isDelayed) {
      setShowDelayJustification(true);
      setDelayJustification('');
    } else {
      startPatrol();
    }
  };

  const startPatrol = async (justification?: string) => {
    if (!selectedRouteId) { setError('Selecione um roteiro'); return; }
    setLoading(true);
    setError('');
    setShowDelayJustification(false);

    if (!navigator.geolocation) {
      setError('GPS não disponível neste dispositivo.');
      setGpsStatus('unavailable');
      setLoading(false);
      return;
    }

    try {
      const pos: GeolocationPosition = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Timeout customizado GPS"));
        }, 15000); // 15 seconds max

        navigator.geolocation.getCurrentPosition(
          (p) => {
            clearTimeout(timer);
            resolve(p);
          },
          (err) => {
            clearTimeout(timer);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      });
      setPosition([pos.coords.latitude, pos.coords.longitude]);
      setGpsStatus('granted');
    } catch (gpsErr: any) {
      setGpsStatus('denied');
      setError('⚠️ Permissão de GPS negada ou sinal fraco. Verifique o GPS do aparelho.');
      setLoading(false);
      return;
    }

    try {
      const payload: any = { patrol_route_id: selectedRouteId };
      if (justification) payload.delay_justification = justification;
      
      const res = await api.post('/patrols/start', payload);
      setActivePatrol(res.data);
      setVisitedIndices(new Set());
      setGpsTrack([]);
      
      // Update local state to remove the delay flag so it doesn't prompt again
      setPatrolRoutes(prev => prev.map(r => 
        r.id === selectedRouteId ? { ...r, last_missed_alert_time: null } : r
      ));

      saveOffline('sgp_cached_active_patrol', res.data);
      startGpsTracking(res.data.id);
    } catch (err: any) {
      const isNetworkError = !isOnline() || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      if (isNetworkError) {
        // Create a local patrol so the guard can work offline
        const offlinePatrolId = -Date.now(); // negative ID = offline
        const localPatrol = {
          id: offlinePatrolId,
          patrol_route_id: selectedRouteId,
          guard_id: null,
          status: 'Em andamento',
          started_at: new Date().toISOString(),
          finished_at: null,
          checkpoints_visited: '[]',
          gps_track: '[]',
          alerts: '[]',
          _offline: true,
        };
        setActivePatrol(localPatrol);
        setVisitedIndices(new Set());
        setGpsTrack([]);
        saveOffline('sgp_cached_active_patrol', localPatrol);
        // Queue the start action for when we're back online
        saveOfflinePatrolData({ patrolId: offlinePatrolId, patrolRouteId: selectedRouteId, positions: [], checkpoints: [] });
        startGpsTracking(offlinePatrolId);
        alert('📡 Sem conexão — Ronda iniciada em modo offline. Os dados serão sincronizados quando a internet voltar.');
      } else {
        setError(err.response?.data?.detail || 'Erro ao iniciar ronda');
      }
    } finally {
      setLoading(false);
    }
  };

  const visitCheckpoint = async (idx: number) => {
    if (!activePatrol || !position) return;
    setError('');

    // Proximity check — only allow if guard is within checkpoint radius
    const cp = checkpoints[idx];
    if (cp) {
      const dist = L.latLng(position[0], position[1]).distanceTo(L.latLng(cp.lat, cp.lng));
      const radius = cp.radius_m || 15;
      if (dist > radius) {
        setError(`Você está a ${Math.round(dist)}m do ponto. Aproxime-se (raio: ${radius}m).`);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        return;
      }
    }

    try {
      const res = await api.post(`/patrols/${activePatrol.id}/checkpoint`, {
        checkpoint_index: idx,
        lat: position[0],
        lng: position[1],
      });
      setActivePatrol(res.data);
      setVisitedIndices(prev => new Set([...prev, idx]));
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (err: any) {
      const isNetworkError = !isOnline() || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      if (isNetworkError) {
        // Save locally
        addOfflineCheckpoint(activePatrol.id, idx, position[0], position[1]);
        setVisitedIndices(prev => new Set([...prev, idx]));
        if (navigator.vibrate) navigator.vibrate(100);
        console.log('[Offline] Checkpoint salvo localmente');
      } else {
        setError(err.response?.data?.detail || 'Erro ao registrar checkpoint');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    }
  };

  // Finish patrol
  const finishPatrol = async (observations: string = "") => {
    if (!activePatrol) return;
    setLoading(true);
    setShowObservationModal(false);
    try {
      const payload = observations ? { observations } : {};
      const res = await api.post(`/patrols/${activePatrol.id}/finish`, payload);
      setActivePatrol(null);
      clearLivePatrolCache();
      stopGpsTracking();
      setVisitedIndices(new Set());
      clearOfflinePatrolData();
      removeOffline('sgp_cached_active_patrol');
      setCelebrationMsg(`Ronda ${res.data.status}! ${res.data.status === 'Concluída' ? '✅' : '⚠️'}`);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    } catch (err: any) {
      const isNetworkError = !isOnline() || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      if (isNetworkError) {
        setOfflineFinishAction('finish', observations);
        setActivePatrol(null);
        clearLivePatrolCache();
        stopGpsTracking();
        setVisitedIndices(new Set());
        removeOffline('sgp_cached_active_patrol');
        setCelebrationMsg('📡 Salva localmente! Sincronizará quando houver internet.');
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      } else {
        setError(err.response?.data?.detail || 'Erro ao finalizar');
      }
    } finally {
      setLoading(false);
    }
  };

  // Derived active route and checkpoints
  const activeRoute = activePatrol
    ? patrolRoutes.find(r => r.id === activePatrol.patrol_route_id)
    : null;

  const checkpoints = activeRoute ? JSON.parse(activeRoute.checkpoints || '[]') : [];
  const geofence = activeRoute ? JSON.parse(activeRoute.geofence || '[]') : [];
  const visitedData = activePatrol ? JSON.parse(activePatrol.checkpoints_visited || '[]') : [];

  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [chosenOrder, setChosenOrder] = useState<string>('default');
  const isRandom = chosenOrder !== 'default';
  const nextTargetIdx = isRandom ? shuffledIndices.find(idx => !visitedIndices.has(idx)) : null;

  useEffect(() => {
    if (activePatrol && activeRoute && checkpoints.length > 0) {
      const allowed = (activeRoute.sequence_order || (activeRoute.is_random_sequence ? 'random' : 'default')).split(',').filter(Boolean);
      
      const orderKey = `sgp_chosen_order_${activePatrol.id}`;
      const order = localStorage.getItem(orderKey);
      
      let finalOrder = 'default';
      if (order && allowed.includes(order)) {
        finalOrder = order;
      } else {
        finalOrder = allowed[Math.floor(Math.random() * allowed.length)] || 'default';
        localStorage.setItem(orderKey, finalOrder);
      }
      
      setChosenOrder(finalOrder);

      if (finalOrder === 'random') {
        const seq = localStorage.getItem(`sgp_seq_${activePatrol.id}`);
        if (seq) {
          try {
            setShuffledIndices(JSON.parse(seq));
          } catch {
            setShuffledIndices(Array.from({length: checkpoints.length}, (_, i) => i));
          }
        } else {
          const indices = Array.from({length: checkpoints.length}, (_, i) => i);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          localStorage.setItem(`sgp_seq_${activePatrol.id}`, JSON.stringify(indices));
          setShuffledIndices(indices);
        }
      } else if (finalOrder === 'inverse') {
        setShuffledIndices(Array.from({length: checkpoints.length}, (_, i) => i).reverse());
      } else if (finalOrder === 'strict_sequential') {
        setShuffledIndices(Array.from({length: checkpoints.length}, (_, i) => i));
      } else if (finalOrder === 'clockwise' || finalOrder === 'counter_clockwise') {
        if (checkpoints.length <= 2) {
          setShuffledIndices(Array.from({length: checkpoints.length}, (_, i) => i));
        } else {
          // 1. Calculate centroid
          let sumLat = 0;
          let sumLng = 0;
          checkpoints.forEach((c: any) => {
            sumLat += c.lat;
            sumLng += c.lng;
          });
          const centroid = { lat: sumLat / checkpoints.length, lng: sumLng / checkpoints.length };

          // 2. Map checkpoints to their original index and polar angle
          const mapped = checkpoints.map((c: any, i: number) => {
            const angle = Math.atan2(c.lng - centroid.lng, c.lat - centroid.lat);
            return { index: i, angle };
          });

          // 3. Sort by polar angle
          mapped.sort((a: { index: number; angle: number }, b: { index: number; angle: number }) => {
            if (finalOrder === 'clockwise') {
              return a.angle - b.angle;
            } else {
              return b.angle - a.angle;
            }
          });

          setShuffledIndices(mapped.map((item: { index: number; angle: number }) => item.index));
        }
      } else {
        setShuffledIndices(Array.from({length: checkpoints.length}, (_, i) => i));
      }
    } else {
      setShuffledIndices([]);
      setChosenOrder('default');
    }
  }, [activePatrol, activeRoute?.id]);

  // Auto-finish when all checkpoints are visited
  useEffect(() => {
    if (activePatrol && checkpoints.length > 0) {
      if (visitedIndices.size === checkpoints.length && !loading) {
        // Delay slightly so the user sees the last checkpoint turn green before the popup
        const t = setTimeout(() => {
          setShowObservationModal(true);
        }, 1500);
        return () => clearTimeout(t);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitedIndices, activePatrol, loading]);

  // Cancel patrol
  const cancelPatrol = async () => {
    if (!activePatrol) return;
    if (!window.confirm('Tem certeza que deseja cancelar esta ronda? Os dados coletados até agora serão marcados como cancelados.')) return;
    
    setLoading(true);
    try {
      await api.post(`/patrols/${activePatrol.id}/cancel`);
      setActivePatrol(null);
      clearLivePatrolCache();
      stopGpsTracking();
      setVisitedIndices(new Set());
      clearOfflinePatrolData();
      removeOffline('sgp_cached_active_patrol');
      alert('Ronda cancelada.');
    } catch (err: any) {
      const isNetworkError = !isOnline() || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      if (isNetworkError) {
        setOfflineFinishAction('cancel');
        setActivePatrol(null);
        clearLivePatrolCache();
        stopGpsTracking();
        setVisitedIndices(new Set());
        removeOffline('sgp_cached_active_patrol');
        alert('📡 Sem conexão — Cancelamento salvo localmente. Será sincronizado ao voltar online.');
      } else {
        setError(err.response?.data?.detail || 'Erro ao cancelar');
      }
    } finally {
      setLoading(false);
    }
  };



  const formatElapsedTime = (startIso: string, endIso: string) => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diffSecs = Math.floor((end - start) / 1000);
    if (diffSecs < 0) return '';
    const m = Math.floor(diffSecs / 60);
    const s = diffSecs % 60;
    return `${m}m ${s}s`;
  };

  // Map center — fixed on route area, not GPS position
  const mapCenter: [number, number] = checkpoints.length > 0 
    ? [
        checkpoints.reduce((s: number, c: any) => s + c.lat, 0) / checkpoints.length,
        checkpoints.reduce((s: number, c: any) => s + c.lng, 0) / checkpoints.length,
      ]
    : (position || [-26.3044, -48.8487]);

  // Auto-Checkin logic
  useEffect(() => {
    if (!position || !activeRoute || !activePatrol) return;
    let foundCandidate: number | null = null;
    
    // Determine the only allowed target if sequence is enforced

    for (let i = 0; i < checkpoints.length; i++) {
      if (!visitedIndices.has(i)) {
        if (isRandom && nextTargetIdx !== undefined && i !== nextTargetIdx) {
          continue; // Skip if random sequence and it's not the next target
        }
        
        const cp = checkpoints[i];
        const dist = L.latLng(position[0], position[1]).distanceTo(L.latLng(cp.lat, cp.lng));
        const radius = cp.radius_m || 15;
        // Trigger if the blue circle (accuracy) overlaps with the red circle (radius)
        if (dist <= radius + accuracy) {
          foundCandidate = i;
          break;
        }
      }
    }

    if (foundCandidate !== null) {
      if (!autoCheckinCandidate || autoCheckinCandidate.idx !== foundCandidate) {
        setAutoCheckinCandidate({ idx: foundCandidate, timer: 3 });
      }
    } else {
      if (autoCheckinCandidate) {
        setAutoCheckinCandidate(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, activePatrol, visitedIndices, accuracy]); // activeRoute and checkpoints are derived from activePatrol

  useEffect(() => {
    if (!autoCheckinCandidate) return;
    
    if (autoCheckinCandidate.timer <= 0) {
      visitCheckpoint(autoCheckinCandidate.idx);
      setAutoCheckinCandidate(null);
      return;
    }

    const timer = setTimeout(() => {
      setAutoCheckinCandidate(prev => prev ? { ...prev, timer: prev.timer - 1 } : null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoCheckinCandidate]);

  return (
    <div className="space-y-4">
      {/* No active patrol — Start screen */}
      {!activePatrol && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-300 p-6 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Iniciar Ronda</h2>
            <p className="text-sm text-slate-500 mb-6">Selecione o roteiro e inicie a ronda de segurança</p>

            <select
              value={selectedRouteId || ''}
              onChange={(e) => setSelectedRouteId(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-xl py-3 px-4 text-sm mb-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
            >
              <option value="">Selecione o roteiro...</option>
               {patrolRoutes.filter(r => {
                 if (!r.is_active) return false;
                 if (!currentGuard) return true;
                 if (r.assigned_guard_id && r.assigned_guard_id !== currentGuard.id) return false;
                 if (r.assigned_shift && r.assigned_shift !== currentGuard.shift) return false;
                 return true;
               }).map(r => (
                 <option key={r.id} value={r.id}>{r.name} ({r.estimated_duration_min} min)</option>
               ))}
            </select>

            {/* GPS Status */}
            {gpsStatus === 'denied' && (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">GPS desativado</p>
                  <p className="text-xs mt-0.5">Ative a localização no celular e permita o acesso para iniciar a ronda.</p>
                </div>
              </div>
            )}
            {gpsStatus === 'unavailable' && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Este dispositivo não possui GPS. Use um smartphone.</p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center font-medium border border-red-100 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleStartClick}
              disabled={loading || !selectedRouteId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl py-4 font-bold text-base transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {loading ? 'Iniciando...' : 'Iniciar Ronda'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Active patrol — Map + controls */}
      {activePatrol && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Alert bar */}
          {!insideGeofence && (
            <div className="bg-red-500 text-white rounded-xl p-3 flex items-center gap-3 animate-pulse shadow-lg">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm">FORA DA ÁREA!</p>
                <p className="text-xs opacity-90">Retorne à área de ronda imediatamente.</p>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-700">Progresso</p>
              <p className="text-sm font-bold text-emerald-600">{visitedIndices.size}/{checkpoints.length} pontos</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${checkpoints.length > 0 ? (visitedIndices.size / checkpoints.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Map */}
          <div 
            className="rounded-2xl overflow-hidden border border-slate-300 shadow-sm relative" 
            style={{ 
              height: '45vh', 
              '--map-counter-rotation': `${-(isNavigationMode && heading !== null ? -heading : 0)}deg` 
            } as React.CSSProperties}
          >
            
            {/* Speedometer Overlay */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 px-3 py-2 z-[2000] flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1 tracking-wider">Velocidade</p>
                <p className="text-base font-black text-slate-800 leading-none">{Math.round(speed)} <span className="text-xs font-bold text-slate-400">km/h</span></p>
              </div>
            </div>

            {/* Force GPS Button */}
            <button
              onClick={forceGpsUpdate}
              disabled={isForceGpsLoading}
              className={`absolute bottom-[5.5rem] right-4 z-[2000] w-12 h-12 flex items-center justify-center rounded-full shadow-lg border-2 bg-white text-slate-600 border-slate-200 hover:bg-slate-50 transition-all ${isForceGpsLoading ? 'opacity-80 cursor-wait' : ''}`}
              title="Forçar atualização do GPS"
            >
              <RefreshCw className={`w-5 h-5 ${isForceGpsLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Navigation Mode Toggle */}
            <button
              onClick={() => setIsNavigationMode(!isNavigationMode)}
              className={`absolute bottom-4 right-4 z-[2000] w-12 h-12 flex items-center justify-center rounded-full shadow-lg border-2 transition-all ${
                isNavigationMode 
                  ? 'bg-blue-600 text-white border-blue-400' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Navigation className={`w-5 h-5 ${isNavigationMode ? 'fill-current' : ''}`} />
            </button>

            {/* Rotating Map Container */}
            <div 
              style={{ 
                 position: 'absolute', 
                 top: '-35%', left: '-35%', width: '170%', height: '170%', 
                 transform: `rotate(${isNavigationMode && heading !== null ? -heading : 0}deg)`, 
                 transition: 'transform 0.5s ease-out',
                 transformOrigin: 'center center'
              }}
            >
              <MapContainer
                center={mapCenter}
                zoom={19}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {!isNavigationMode && <FitBoundsOnce checkpoints={checkpoints} geofence={geofence} />}
                <NavigationController position={position} isNavMode={isNavigationMode} />

              {/* Geofence */}
              {geofence.length >= 3 && (
                <Polygon
                  positions={geofence.map((g: number[]) => [g[0], g[1]] as [number, number])}
                  pathOptions={{ color: insideGeofence ? '#3b82f6' : '#ef4444', fillColor: insideGeofence ? '#3b82f6' : '#ef4444', fillOpacity: 0.08, weight: 2 }}
                />
              )}

              {/* Checkpoints */}
              {shuffledIndices.map((originalIdx: number, renderIdx: number) => {
                const cp = checkpoints[originalIdx];
                if (!cp) return null;
                const isVisited = visitedIndices.has(originalIdx);
                const isCurrentTarget = isRandom && originalIdx === nextTargetIdx;
                const radius = cp.radius_m || 15;
                const labelStr = cp.label.startsWith('Ponto ') ? `Ponto ${renderIdx + 1}` : `${renderIdx + 1} - ${cp.label}`;
                return (
                  <React.Fragment key={originalIdx}>
                    <Circle 
                      center={[cp.lat, cp.lng]} 
                      radius={radius} 
                      pathOptions={{ 
                        color: isVisited ? '#10b981' : (isCurrentTarget ? '#000000' : '#ef4444'), 
                        fillOpacity: 0.15, 
                        weight: isCurrentTarget ? 2 : 1 
                      }} 
                    />
                    <Marker position={[cp.lat, cp.lng]} icon={getCheckpointIcon(renderIdx, isVisited, isCurrentTarget)}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold">{labelStr}</p>
                          <p className="text-xs">{isVisited ? '✅ Visitado' : '⏳ Pendente'}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Raio de alcance: {radius}m</p>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}

              {/* GPS Track */}
              {gpsTrack.length > 0 && (
                <Polyline positions={gpsTrack} pathOptions={{ color: '#eab308', weight: 4 }} />
              )}

              {/* Guard position */}
              {position && position[0] !== undefined && position[1] !== undefined && (
                <>
                  <Marker position={position as [number, number]} icon={getGuardIcon(heading)} />
                  <Circle center={position as [number, number]} radius={accuracy} pathOptions={{ color: '#3b82f6', fillOpacity: 0.15, weight: 1 }} />
                </>
              )}
            </MapContainer>
            </div>

            {/* Auto Check-in Popup */}
            <AnimatePresence>
              {autoCheckinCandidate && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="absolute bottom-6 left-4 right-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border-2 border-emerald-500 p-6 z-[2000] flex flex-col items-center justify-center text-center overflow-hidden"
                >
                  {/* Progress Background */}
                  <div 
                    className="absolute left-0 bottom-0 h-1.5 bg-emerald-500 transition-all duration-1000 ease-linear" 
                    style={{ width: `${((3 - autoCheckinCandidate.timer) / 3) * 100}%` }} 
                  />
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
                    <MapPin className="w-7 h-7 animate-bounce" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-xl tracking-tight">Ponto Detectado!</h3>
                  <p className="text-slate-500 text-sm mb-2 font-medium">Permaneça no local para confirmar</p>
                  <div className="text-5xl font-black text-emerald-600 font-mono tracking-tighter drop-shadow-sm">
                    {autoCheckinCandidate.timer}s
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkpoint buttons */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pontos de Controle</p>
            <div className="grid grid-cols-2 gap-2">
              {shuffledIndices.map((originalIdx: number, renderIdx: number) => {
                const cp = checkpoints[originalIdx];
                if (!cp) return null;
                const visitInfo = visitedData.find((v: any) => v.checkpoint_index === originalIdx);
                const isDisabled = visitedIndices.has(originalIdx) || (isRandom && originalIdx !== nextTargetIdx);

                return (
                  <button
                    key={originalIdx}
                    onClick={() => visitCheckpoint(originalIdx)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
                      visitedIndices.has(originalIdx)
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : isDisabled
                        ? 'bg-slate-50 text-slate-400 border border-slate-200 opacity-70 cursor-not-allowed'
                        : 'bg-white text-slate-700 border border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 active:scale-95'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${visitedIndices.has(originalIdx) ? 'bg-emerald-500' : isDisabled ? 'bg-slate-400' : 'bg-red-500'}`}>
                      {renderIdx + 1}
                    </div>
                    <span className="truncate">{cp.label.startsWith('Ponto ') ? `Ponto ${renderIdx + 1}` : cp.label}</span>
                    {visitInfo && (
                      <span className="ml-auto flex items-center gap-1">
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                          {formatElapsedTime(activePatrol.started_at, visitInfo.visited_at)}
                        </span>
                        <span>✅</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* Finish & Cancel buttons */}
          <div className="flex items-stretch gap-3">
            <button
              onClick={cancelPatrol}
              disabled={loading}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 border border-slate-300 disabled:opacity-60 text-slate-600 rounded-xl py-3 font-bold text-sm transition-colors shadow-sm flex flex-col items-center justify-center gap-1"
            >
              <XCircle className="w-5 h-5" />
              Cancelar
            </button>
            <button
              onClick={() => setShowObservationModal(true)}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl py-4 font-bold text-base transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              {loading ? 'Aguarde...' : 'Finalizar Ronda'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Observation Modal before Finishing */}
      <AnimatePresence>
        {showObservationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-6 shadow-2xl max-w-sm w-full border border-slate-100"
            >
              <h2 className="text-xl font-black text-slate-800 mb-2">Finalizar Ronda</h2>
              <p className="text-slate-500 text-sm mb-4">Deseja registrar alguma observação sobre a ronda (ex: porta aberta, lâmpada queimada)?</p>
              
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] mb-4 resize-none"
                placeholder="Nenhuma ocorrência..."
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowObservationModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={() => finishPatrol(observationText)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm"
                >
                  Concluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Popup */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center max-w-sm w-full border border-emerald-100">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
                className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner"
              >
                <CheckCircle className="w-14 h-14" />
              </motion.div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Excelente!</h2>
              <p className="text-slate-600 font-medium text-lg leading-snug">{celebrationMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delay Justification Modal */}
      <AnimatePresence>
        {showDelayJustification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="p-6">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Atraso Identificado</h3>
                {(() => {
                  const r = patrolRoutes.find(r => r.id === selectedRouteId);
                  const time = r?.start_time ? r.start_time.substring(11, 16) : '';
                  const missedDate = r?.last_missed_alert_time 
                    ? new Date(r.last_missed_alert_time.endsWith('Z') ? r.last_missed_alert_time : `${r.last_missed_alert_time}Z`).toLocaleDateString('pt-BR') 
                    : '';
                  return (
                    <p className="text-sm text-center text-slate-600 mb-6">
                      A ronda <b>"{r?.name}"</b> de <b>{time}</b> do dia <b>{missedDate}</b> não foi realizada no horário previsto. Por favor, informe o motivo para prosseguir.
                    </p>
                  );
                })()}

                <textarea
                  value={delayJustification}
                  onChange={(e) => setDelayJustification(e.target.value)}
                  placeholder="Ex: Tive que atender uma ocorrência urgente..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none resize-none h-32 mb-4"
                ></textarea>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDelayJustification(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => startPatrol(delayJustification)}
                    disabled={!delayJustification.trim() || loading}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Iniciando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
