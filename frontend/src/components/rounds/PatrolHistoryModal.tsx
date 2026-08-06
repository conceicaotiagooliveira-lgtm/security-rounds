import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, AlertTriangle, Calendar, Shield, ChevronDown, Navigation, Eye, User, MessageSquare } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Polygon, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/services/api';

interface PatrolHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: number | null;
  routeName: string;
}

// Fix UTC timestamps from backend (stored without 'Z' suffix)
const toLocal = (dt: string) => {
  if (!dt) return new Date();
  return new Date(dt.endsWith('Z') || dt.includes('+') ? dt : dt + 'Z');
};

const formatDateTime = (dt: string) =>
  toLocal(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatTime = (dt: string) =>
  toLocal(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const formatElapsed = (startDt: string, endDt: string) => {
  const diff = Math.floor((toLocal(endDt).getTime() - toLocal(startDt).getTime()) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins}m${secs.toString().padStart(2, '0')}s`;
};

// Custom icons for checkpoints
const makeIcon = (idx: number, visited: boolean) => L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:${visited ? '#10b981' : '#ef4444'};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">${idx + 1}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Start/End markers
const startIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">▶</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const endIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#f59e0b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">⏹</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function PatrolHistoryModal({ isOpen, onClose, routeId, routeName }: PatrolHistoryModalProps) {
  const [patrols, setPatrols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [route, setRoute] = useState<any>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = () => {
    if (isOpen && routeId) {
      setLoading(true);
      setExpandedId(null);
      let url = `/patrols?route_id=${routeId}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      if (startDate || endDate) url += `&limit=500`;

      Promise.all([
        api.get(url),
        api.get(`/patrol-routes/${routeId}`),
      ]).then(([patrolsRes, routeRes]) => {
        setPatrols(patrolsRes.data);
        setRoute(routeRes.data);
      }).catch(console.error).finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isOpen, routeId]);

  const routeCheckpoints = useMemo(() => {
    if (!route) return [];
    try { return JSON.parse(route.checkpoints || '[]'); } catch { return []; }
  }, [route]);

  const routeGeofence = useMemo(() => {
    if (!route) return [];
    try { return JSON.parse(route.geofence || '[]'); } catch { return []; }
  }, [route]);

  if (!isOpen) return null;

  const countExits = (alertsStr: string) => {
    try {
      return JSON.parse(alertsStr || '[]').filter((a: any) => a.type === 'FORA_DA_AREA').length;
    } catch { return 0; }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Concluída') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Cancelada') return 'bg-slate-100 text-slate-600 border-slate-200';
    if (status === 'Incompleta') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Histórico de Rondas</h2>
            <p className="text-sm text-slate-500 font-medium">Roteiro: <span className="text-slate-700">{routeName}</span></p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm text-slate-600 outline-none bg-transparent"
                title="Data inicial"
              />
              <span className="text-slate-300">até</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm text-slate-600 outline-none bg-transparent"
                title="Data final"
              />
              <button 
                onClick={fetchHistory}
                className="ml-2 bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                Buscar
              </button>
              {(startDate || endDate) && (
                <button 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    // setTimeout to ensure state is cleared before fetching, or we can just pass empty strings to a fetch function if we refactor it.
                    // Instead, let's just trigger a re-fetch in useEffect by setting a trigger state, or directly fetch with empty dates.
                    setLoading(true);
                    setExpandedId(null);
                    Promise.all([
                      api.get(`/patrols?route_id=${routeId}`),
                      api.get(`/patrol-routes/${routeId}`),
                    ]).then(([patrolsRes, routeRes]) => {
                      setPatrols(patrolsRes.data);
                      setRoute(routeRes.data);
                    }).catch(console.error).finally(() => setLoading(false));
                  }}
                  className="ml-1 text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Limpar filtros"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button onClick={onClose} className="w-10 h-10 shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shadow-sm">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 mt-4 font-medium">Carregando histórico...</p>
            </div>
          ) : patrols.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <Clock className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-medium">Nenhuma ronda registrada para este roteiro ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patrols.map((patrol) => {
                const exits = countExits(patrol.alerts);
                const start = toLocal(patrol.started_at);
                const end = patrol.finished_at ? toLocal(patrol.finished_at) : null;
                const durationMins = end ? Math.floor((end.getTime() - start.getTime()) / 60000) : '-';
                const isExpanded = expandedId === patrol.id;

                // Parse patrol data
                const gpsTrack: [number, number][] = (() => {
                  try { return JSON.parse(patrol.gps_track || '[]').map((p: any) => [p.lat, p.lng]); } catch { return []; }
                })();
                const visitedCheckpoints: any[] = (() => {
                  try { return JSON.parse(patrol.checkpoints_visited || '[]'); } catch { return []; }
                })();
                const visitedIndices = new Set(visitedCheckpoints.map((v: any) => v.checkpoint_index));
                const visitedTimes = new Map(visitedCheckpoints.map((v: any) => [v.checkpoint_index, v.visited_at]));

                return (
                  <div key={patrol.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                    {/* Summary row */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : patrol.id)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(patrol.status)}`}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {formatDateTime(patrol.started_at)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-500 font-medium">ID da Ronda: #{patrol.id}</p>
                              {patrol.guard && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    <User className="w-3 h-3 text-slate-400" />
                                    {patrol.guard.name}
                                  </p>
                                </>
                              )}
                              {patrol.observations && (
                                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-blue-500" />
                                  Obs. Registrada
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg border ${getStatusColor(patrol.status)}`}>
                            {patrol.status}
                          </span>
                          <button className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Duração</p>
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {durationMins} min
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Checkpoints</p>
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {visitedCheckpoints.length}/{routeCheckpoints.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Saídas da Cerca</p>
                          {exits > 0 ? (
                            <p className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" />
                              {exits} {exits === 1 ? 'vez' : 'vezes'}
                            </p>
                          ) : (
                            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">✅ Na área</p>
                          )}
                        </div>
                      </div>

                      {/* Observations Preview directly on Card */}
                      {patrol.observations && (
                        <div className="mt-4 pt-3 border-t border-slate-100 bg-blue-50/70 border-l-4 border-l-blue-500 rounded-r-xl p-3 shadow-xs">
                          <p className="text-[10px] uppercase font-extrabold text-blue-700 flex items-center gap-1.5 mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                            Observação do Vigia:
                          </p>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-3 whitespace-pre-wrap">
                            {patrol.observations}
                          </p>
                        </div>
                      )}

                      {/* Delay Justification Preview directly on Card */}
                      {patrol.delay_justification && (
                        <div className="mt-3 bg-red-50/80 border-l-4 border-l-red-500 rounded-r-xl p-3 shadow-xs">
                          <p className="text-[10px] uppercase font-extrabold text-red-700 flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            Justificativa de Atraso:
                          </p>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-3 whitespace-pre-wrap">
                            {patrol.delay_justification}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                            {/* Observations */}
                            {(patrol as any).observations && (
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Observações do Vigia</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{(patrol as any).observations}</p>
                              </div>
                            )}

                            {/* Delay Justification */}
                            {(patrol as any).delay_justification && (
                              <div className="bg-red-50 border border-red-100 rounded-xl p-3 shadow-sm">
                                <p className="text-[10px] uppercase font-bold text-red-500 mb-1 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Justificativa de Atraso
                                </p>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap font-medium">{(patrol as any).delay_justification}</p>
                              </div>
                            )}

                            {/* Map */}
                            {gpsTrack.length > 0 && (
                              <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 320 }}>
                                <MapContainer
                                  bounds={L.latLngBounds(gpsTrack.length > 0 ? gpsTrack : [[0, 0]])}
                                  style={{ height: '100%', width: '100%' }}
                                  zoomControl={true}
                                  attributionControl={false}
                                >
                                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                  {/* Geofence */}
                                  {routeGeofence.length >= 3 && (
                                    <Polygon
                                      positions={routeGeofence.map((g: number[]) => [g[0], g[1]] as [number, number])}
                                      pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.06, weight: 2, dashArray: '6 4' }}
                                    />
                                  )}

                                  {/* GPS trajectory */}
                                  <Polyline positions={gpsTrack} pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.9 }} />

                                  {/* Start point */}
                                  <Marker position={gpsTrack[0]} icon={startIcon}>
                                    <Popup><b>Início</b><br />{formatTime(patrol.started_at)}</Popup>
                                  </Marker>

                                  {/* End point */}
                                  {gpsTrack.length > 1 && (
                                    <Marker position={gpsTrack[gpsTrack.length - 1]} icon={endIcon}>
                                      <Popup><b>Fim</b><br />{patrol.finished_at ? formatTime(patrol.finished_at) : 'Em andamento'}</Popup>
                                    </Marker>
                                  )}

                                  {/* Checkpoint markers */}
                                  {routeCheckpoints.map((cp: any, idx: number) => {
                                    const isVisited = visitedIndices.has(idx);
                                    const visitTime = isVisited ? formatTime(visitedTimes.get(idx)) : null;
                                    const displayName = cp.label.startsWith('Ponto ') ? `Ponto ${idx + 1}` : `${idx + 1} - ${cp.label}`;
                                    return (
                                      <Marker key={idx} position={[cp.lat, cp.lng]} icon={makeIcon(idx, isVisited)}>
                                        <Popup>
                                          <b>{displayName}</b><br />
                                          {isVisited ? `✅ Visitado às ${visitTime}` : '❌ Não visitado'}
                                        </Popup>
                                      </Marker>
                                    );
                                  })}
                                </MapContainer>
                              </div>
                            )}

                            {gpsTrack.length === 0 && (
                              <div className="flex items-center justify-center h-32 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                                  <Navigation className="w-4 h-4" />
                                  Sem dados de trajeto GPS para esta ronda
                                </p>
                              </div>
                            )}

                            {/* Timeline */}
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Linha do Tempo
                              </p>
                              <div className="space-y-0 relative">
                                {/* Start event */}
                                <div className="flex items-start gap-3 pb-3 relative">
                                  <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs shadow-md">▶</div>
                                    <div className="w-0.5 flex-1 bg-slate-200 mt-1" style={{ minHeight: 16 }} />
                                  </div>
                                  <div className="pt-1">
                                    <p className="text-sm font-bold text-slate-800">Ronda iniciada</p>
                                    <p className="text-xs text-slate-500">{formatTime(patrol.started_at)}</p>
                                  </div>
                                </div>

                                {/* Checkpoint events */}
                                {routeCheckpoints.map((cp: any, idx: number) => {
                                  const visit = visitedCheckpoints.find((v: any) => v.checkpoint_index === idx);
                                  return (
                                    <div key={idx} className="flex items-start gap-3 pb-3 relative">
                                      <div className="relative z-10 flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${visit ? 'bg-emerald-500' : 'bg-red-400'}`}>
                                          {idx + 1}
                                        </div>
                                        <div className="w-0.5 flex-1 bg-slate-200 mt-1" style={{ minHeight: 16 }} />
                                      </div>
                                      <div className="pt-1 flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className={`text-sm font-bold ${visit ? 'text-emerald-700' : 'text-red-500'}`}>
                                            {cp.label}
                                          </p>
                                          {visit && (
                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-200">
                                              {formatElapsed(patrol.started_at, visit.visited_at)}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                          {visit ? `Visitado às ${formatTime(visit.visited_at)}` : 'Não visitado'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* End event */}
                                {patrol.finished_at && (
                                  <div className="flex items-start gap-3 relative">
                                    <div className="relative z-10">
                                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs shadow-md">⏹</div>
                                    </div>
                                    <div className="pt-1">
                                      <p className="text-sm font-bold text-slate-800">Ronda {patrol.status === 'Cancelada' ? 'cancelada' : 'finalizada'}</p>
                                      <p className="text-xs text-slate-500">{formatTime(patrol.finished_at)}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
