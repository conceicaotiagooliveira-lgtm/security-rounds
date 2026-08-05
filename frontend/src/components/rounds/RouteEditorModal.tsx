import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Save, Trash2, Plus, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/services/api';
import { addPendingRoute, isOnline, queueAction } from '@/services/offlineStore';

interface Checkpoint {
  lat: number;
  lng: number;
  label: string;
  radius_m: number;
}

interface RouteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  route?: any;
}

// Component to handle map clicks
function MapClickHandler({ mode, onMapClick }: { mode: string; onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Auto-fit map to content
function FitBounds({ checkpoints, geofence }: { checkpoints: Checkpoint[]; geofence: number[][] }) {
  const map = useMap();
  useEffect(() => {
    const allPoints = [
      ...checkpoints.map(c => [c.lat, c.lng] as [number, number]),
      ...geofence.map(g => [g[0], g[1]] as [number, number]),
    ];
    if (allPoints.length > 1) {
      map.fitBounds(allPoints, { padding: [40, 40] });
    }
  }, []);
  return null;
}

const getCheckpointIcon = (index: number, total: number) => {
  const color = '#7c3aed';
  return new L.DivIcon({
    html: `<div style="background:${color}; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3);">${index + 1}</div>`,
    className: 'custom-checkpoint-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export default function RouteEditorModal({ isOpen, onClose, onSaved, route }: RouteEditorModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [geofence, setGeofence] = useState<number[][]>([]);
  const [mode, setMode] = useState<'checkpoint' | 'geofence' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, acc: number} | null>(null);
  const [isStable, setIsStable] = useState(false);
  const [stableProgress, setStableProgress] = useState(0);
  
  const [startTime, setStartTime] = useState('');
  const [repeatEveryMinutes, setRepeatEveryMinutes] = useState<number | ''>('');
  const [toleranceMinutes, setToleranceMinutes] = useState(15);
  const [assignedShift, setAssignedShift] = useState('');
  const [assignedGuardId, setAssignedGuardId] = useState<number | ''>('');
  const [isRandomSequence, setIsRandomSequence] = useState(false);
  const [sequenceOrder, setSequenceOrder] = useState('default');
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [guards, setGuards] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.get('/guards').then(res => {
        setGuards(res.data);
      }).catch(err => console.error("Failed to load guards:", err));
    }
  }, [isOpen]);

  const stableSinceRef = useRef<number | null>(null);
  const lastPosRef = useRef<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    let watchId: number;
    if (isOpen && navigator.geolocation) {
      // Reset state on open
      stableSinceRef.current = null;
      lastPosRef.current = null;
      setIsStable(false);
      setStableProgress(0);

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentLocation({lat, lng, acc: pos.coords.accuracy});

          if (lastPosRef.current) {
            const dist = L.latLng(lat, lng).distanceTo(L.latLng(lastPosRef.current.lat, lastPosRef.current.lng));
            if (dist > 8) {
              // Movimentou mais de 8 metros
              stableSinceRef.current = Date.now();
              lastPosRef.current = { lat, lng };
              setIsStable(false);
            }
          } else {
            stableSinceRef.current = Date.now();
            lastPosRef.current = { lat, lng };
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      setCurrentLocation(null);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      if (stableSinceRef.current && !isStable) {
        const elapsed = (Date.now() - stableSinceRef.current) / 1000;
        setStableProgress(Math.min(10, elapsed));
        if (elapsed >= 10) {
          setIsStable(true);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen, isStable]);

  useEffect(() => {
    if (route) {
      setName(route.name || '');
      setDescription(route.description || '');
      setEstimatedDuration(route.estimated_duration_min || 60);
      if (route.start_time) {
        const d = new Date(route.start_time.endsWith('Z') ? route.start_time : `${route.start_time}Z`);
        // Adjust for timezone offset to get local YYYY-MM-DDThh:mm
        const localISO = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().substring(0, 16);
        setStartTime(localISO);
      } else {
        setStartTime('');
      }
      setRepeatEveryMinutes(route.repeat_every_minutes ?? '');
      setToleranceMinutes(route.tolerance_minutes ?? 15);
      setAssignedGuardId(route.assigned_guard_id ?? '');
      setIsRandomSequence(route.is_random_sequence ?? false);
      setSequenceOrder(route.sequence_order ?? (route.is_random_sequence ? 'random' : 'default'));
      setNotifyWhatsapp(route.notify_whatsapp ?? false);
      setWhatsappNumber(route.whatsapp_number || '');
      try {
        setCheckpoints(JSON.parse(route.checkpoints || '[]'));
        setGeofence(JSON.parse(route.geofence || '[]'));
      } catch {
        setCheckpoints([]);
        setGeofence([]);
      }
    } else {
      setName('');
      setDescription('');
      setEstimatedDuration(60);
      setStartTime('');
      setRepeatEveryMinutes('');
      setToleranceMinutes(15);
      setAssignedShift('');
      setAssignedGuardId('');
      setIsRandomSequence(false);
      setSequenceOrder('default');
      setNotifyWhatsapp(false);
      setWhatsappNumber('');
      setCheckpoints([]);
      setGeofence([]);
    }
    setMode('none');
    setError('');
  }, [route, isOpen]);

  const markCurrentLocation = () => {
    if (!navigator.geolocation) { setError('GPS indisponível neste dispositivo'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos.coords.accuracy > 50) {
          setError(`Atenção: Sinal de GPS fraco (precisão de ${Math.round(pos.coords.accuracy)}m). Ponto criado, mas pode estar impreciso.`);
        }
        setCheckpoints(prev => [...prev, { 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude, 
          label: `Ponto ${prev.length + 1}`, 
          radius_m: 15 
        }]);
        setLoading(false);
      },
      (err) => {
        setError('Não foi possível obter a localização. Verifique as permissões.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (mode === 'checkpoint') {
      setCheckpoints(prev => [...prev, { lat, lng, label: `Ponto ${prev.length + 1}`, radius_m: 15 }]);
    } else if (mode === 'geofence') {
      setGeofence(prev => [...prev, [lat, lng]]);
    }
  };

  const removeCheckpoint = (idx: number) => {
    setCheckpoints(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    if (checkpoints.length === 0) { setError('Adicione pelo menos 1 ponto de controle'); return; }

    setLoading(true);
    setError('');

    const payload = {
      name,
      description,
      checkpoints: JSON.stringify(checkpoints),
      geofence: JSON.stringify(geofence),
      estimated_duration_min: estimatedDuration,
      is_active: true,
      start_time: startTime ? new Date(startTime).toISOString() : null,
      repeat_every_minutes: repeatEveryMinutes === '' ? null : Number(repeatEveryMinutes),
      tolerance_minutes: Number(toleranceMinutes),
      assigned_shift: assignedShift || null,
      assigned_guard_id: assignedGuardId === '' ? null : Number(assignedGuardId),
      is_random_sequence: sequenceOrder.split(',').includes('random'),
      sequence_order: sequenceOrder,
      notify_whatsapp: notifyWhatsapp,
      whatsapp_number: notifyWhatsapp ? whatsappNumber : null,
    };

    try {
      if (route) {
        await api.put(`/patrol-routes/${route.id}`, payload);
      } else {
        await api.post('/patrol-routes', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      // Check if it's a network error (offline)
      const isNetworkError = !isOnline() || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      
      if (isNetworkError && !route) {
        // Save locally for later sync
        addPendingRoute(payload);
        alert('📡 Sem conexão — Roteiro salvo localmente! Será sincronizado automaticamente quando a internet voltar.');
        onSaved();
        onClose();
      } else if (isNetworkError && route) {
        // Queue the update for later
        queueAction('PUT', `/patrol-routes/${route.id}`, payload, `Atualizar rota "${name}"`);
        alert('📡 Sem conexão — Alterações salvas localmente! Serão sincronizadas quando a internet voltar.');
        onSaved();
        onClose();
      } else {
        setError(err.response?.data?.detail || 'Erro ao salvar roteiro');
      }
    } finally {
      setLoading(false);
    }
  };

  const mapCenter: [number, number] = checkpoints.length > 0
    ? [checkpoints[0].lat, checkpoints[0].lng]
    : geofence.length > 0
      ? [geofence[0][0], geofence[0][1]]
      : [-26.3044, -48.8487]; // Default: Joinville

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 bg-white rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{route ? 'Editar Roteiro' : 'Novo Roteiro'}</h2>
                <p className="text-sm text-slate-500">Defina a área e os pontos de controle no mapa</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 min-h-0">
              {/* Left Panel — Form */}
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col p-4 gap-4 overflow-y-auto shrink-0 max-h-[45%] md:max-h-full">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Roteiro *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    placeholder="Ex: Ronda Noturna Fábrica"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none"
                    rows={2}
                    placeholder="Descrição opcional..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duração Estimada (min)</label>
                  <input
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agendamento & Acesso</p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Início da Primeira Ronda (Opcional)</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Frequência (Repetir a cada X minutos)</label>
                    <input
                      type="number"
                      value={repeatEveryMinutes}
                      onChange={(e) => setRepeatEveryMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                      placeholder="Ex: 30"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tolerância para início (minutos)</label>
                    <input
                      type="number"
                      value={toleranceMinutes}
                      onChange={(e) => setToleranceMinutes(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Permitir para Turno</label>
                    <select
                      value={assignedShift}
                      onChange={(e) => setAssignedShift(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white"
                    >
                      <option value="">Qualquer Turno</option>
                      <option value="Diurno">Diurno</option>
                      <option value="Noturno">Noturno</option>
                      <option value="12x36">12x36</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Permitir para Vigia Específico</label>
                    <select
                      value={assignedGuardId}
                      onChange={(e) => setAssignedGuardId(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white"
                    >
                      <option value="">Qualquer Vigia</option>
                      {guards.map((g) => (
                        <option key={g.id} value={g.id}>{g.name} ({g.registration})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Ordenações Permitidas para a Ronda *
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                      {[
                        { id: 'default', label: 'Livre (Sem Sequência Obrigatória)' },
                        { id: 'strict_sequential', label: 'Sequencial Estrito (Ordem de Criação)' },
                        { id: 'random', label: 'Aleatória (Embaralhar Pontos)' },
                        { id: 'clockwise', label: 'Sentido Horário (Espacial)' },
                        { id: 'counter_clockwise', label: 'Sentido Anti-horário (Espacial)' },
                        { id: 'inverse', label: 'Inversa (Sentido Oposto)' },
                      ].map((opt) => {
                        const isChecked = sequenceOrder.split(',').includes(opt.id);
                        return (
                          <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900 select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                let current = sequenceOrder.split(',').filter(Boolean);
                                if (current.includes(opt.id)) {
                                  if (current.length > 1) {
                                    current = current.filter(o => o !== opt.id);
                                  }
                                } else {
                                  current.push(opt.id);
                                }
                                setSequenceOrder(current.join(','));
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      * Se selecionar mais de uma ordenação, o sistema escolherá aleatoriamente uma das opções selecionadas no início de cada ronda para o vigia.
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="notifyWhatsapp"
                        checked={notifyWhatsapp}
                        onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="notifyWhatsapp" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Notificar violações via WhatsApp (Cerca ou Incompleta)
                      </label>
                    </div>
                    {notifyWhatsapp && (
                      <div className="pl-6">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Número do WhatsApp (com DDD)</label>
                        <input
                          type="text"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ex: 11999999999"
                          className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Tools */}
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ferramentas do Mapa</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setMode(mode === 'checkpoint' ? 'none' : 'checkpoint')}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${mode === 'checkpoint' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      <MapPin className="w-4 h-4" />
                      Ponto
                    </button>
                    <button
                      onClick={() => setMode(mode === 'geofence' ? 'none' : 'geofence')}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${mode === 'geofence' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      <Plus className="w-4 h-4" />
                      Cerca
                    </button>
                    <div className="flex flex-col relative w-full sm:w-auto">
                      <button
                        onClick={markCurrentLocation}
                        disabled={!isStable}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-[10px] sm:text-xs font-semibold transition-all h-full ${
                          isStable 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Navigation className="w-4 h-4" />
                        Meu Local
                      </button>
                      {!isStable && currentLocation && (
                        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(stableProgress / 10) * 100}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                  {mode !== 'none' && (
                    <p className="text-[10px] text-center mt-2 text-purple-600 font-medium animate-pulse">
                      {mode === 'checkpoint' ? '👆 Clique no mapa para adicionar um ponto de controle' : '👆 Clique no mapa para definir os vértices da área'}
                    </p>
                  )}
                  {!isStable && currentLocation && (
                    <p className="text-[10px] text-center mt-2 text-slate-500 font-medium">
                      Aguarde {10 - Math.floor(stableProgress)}s parado para estabilizar o sinal do GPS...
                    </p>
                  )}
                </div>

                {/* Checkpoints List */}
                {checkpoints.length > 0 && (
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pontos de Controle ({checkpoints.length})</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {checkpoints.map((cp, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <div className="w-6 h-6 shrink-0 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                            <input
                              type="text"
                              value={cp.label}
                              onChange={(e) => {
                                const updated = [...checkpoints];
                                updated[idx].label = e.target.value;
                                setCheckpoints(updated);
                              }}
                              placeholder="Nome do Ponto"
                              title="Clique para renomear este ponto"
                              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 rounded px-2 py-1 outline-none w-full transition-all hover:border-slate-300"
                            />
                          </div>
                          <button onClick={() => removeCheckpoint(idx)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geofence info */}
                {geofence.length > 0 && (
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cerca ({geofence.length} vértices)</p>
                      <button onClick={() => setGeofence([])} className="text-xs text-red-500 hover:text-red-700 font-medium">Limpar</button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center font-medium border border-red-100">
                    {error}
                  </div>
                )}

                {/* Save */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-70 text-white rounded-xl py-3 font-semibold text-sm transition-colors shadow-lg flex items-center justify-center gap-2 mt-auto"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Salvando...' : 'Salvar Roteiro'}
                </button>
              </div>

              {/* Right Panel — Map */}
              <div className="flex-1 relative">
                <MapContainer
                  key={`editor-${isOpen}`}
                  center={mapCenter}
                  zoom={16}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                  scrollWheelZoom={true}
                  attributionControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapClickHandler mode={mode} onMapClick={handleMapClick} />

                  {(checkpoints.length > 1 || geofence.length > 1) && (
                    <FitBounds checkpoints={checkpoints} geofence={geofence} />
                  )}

                  {/* Geofence Polygon */}
                  {geofence.length >= 3 && (
                    <Polygon
                      positions={geofence.map(g => [g[0], g[1]] as [number, number])}
                      pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2, dashArray: '8 4' }}
                    />
                  )}

                  {/* Checkpoints */}
                  {checkpoints.map((cp, idx) => (
                    <Marker key={idx} position={[cp.lat, cp.lng]} icon={getCheckpointIcon(idx, checkpoints.length)}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold text-sm">{cp.label}</p>
                          <p className="text-xs text-slate-500">Raio: {cp.radius_m}m</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Current Location Marker with Accuracy Radius */}
                  {currentLocation && (
                    <>
                      <Circle 
                        center={[currentLocation.lat, currentLocation.lng]} 
                        radius={currentLocation.acc} 
                        pathOptions={{ 
                          color: isStable ? '#10b981' : '#3b82f6', 
                          fillColor: isStable ? '#10b981' : '#3b82f6', 
                          fillOpacity: 0.15, 
                          weight: 1, 
                          dashArray: '4' 
                        }} 
                      />
                      <Marker 
                        position={[currentLocation.lat, currentLocation.lng]} 
                        icon={new L.DivIcon({
                          html: `<div style="background:${isStable ? '#10b981' : '#3b82f6'}; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(${isStable ? '16,185,129' : '59,130,246'},0.6); ${!isStable ? 'animation: pulse 2s infinite;' : ''}"></div>`,
                          className: 'current-user-icon',
                          iconSize: [16, 16],
                          iconAnchor: [8, 8],
                        })}
                        zIndexOffset={1000}
                      />
                    </>
                  )}
                </MapContainer>

                {/* Mode indicator overlay */}
                {mode !== 'none' && (
                  <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg ${mode === 'checkpoint' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    {mode === 'checkpoint' ? '📍 Modo: Adicionar Ponto de Controle' : '🔷 Modo: Definir Cerca Geográfica'}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
