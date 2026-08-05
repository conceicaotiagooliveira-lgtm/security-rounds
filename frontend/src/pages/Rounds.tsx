import { motion } from 'framer-motion';
import { Shield, Plus, Clock, MapPin, CheckSquare, Search, Edit2, Trash2, Eye, CloudOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import RouteEditorModal from '@/components/rounds/RouteEditorModal';
import PatrolHistoryModal from '@/components/rounds/PatrolHistoryModal';
import { getPendingRoutes, removePendingRoute, type PendingRoute } from '@/services/offlineStore';

export default function Rounds() {
  const [search, setSearch] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRouteId, setHistoryRouteId] = useState<number | null>(null);
  const [historyRouteName, setHistoryRouteName] = useState<string>('');

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/patrol-routes');
      setRoutes(res.data);
    } catch (err) {
      console.error('Erro ao carregar roteiros', err);
    } finally {
      setLoading(false);
    }
    // Always load pending offline routes
    setPendingOfflineRoutes(getPendingRoutes());
  };

  const [pendingOfflineRoutes, setPendingOfflineRoutes] = useState<PendingRoute[]>(getPendingRoutes());

  useEffect(() => { fetchRoutes(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este roteiro?')) return;
    try {
      await api.delete(`/patrol-routes/${id}`);
      fetchRoutes();
    } catch (err) {
      console.error('Erro ao excluir', err);
    }
  };

  const handleToggleActive = async (route: any) => {
    try {
      // Need to parse the json strings back to objects for the payload, or just send what we need
      // Since the backend expects valid JSON strings for checkpoints and geofence, we can just send the route object as is, 
      // but modifying is_active.
      const payload = { ...route, is_active: !route.is_active };
      // Some endpoints might complain if assigned_guard is an object, so we clean it up
      delete payload.assigned_guard;
      await api.put(`/patrol-routes/${route.id}`, payload);
      fetchRoutes();
    } catch (err) {
      console.error('Erro ao alternar status', err);
      alert('Erro ao alterar o status do roteiro.');
    }
  };

  const filtered = routes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const parseCheckpoints = (json: string) => {
    try { return JSON.parse(json); } catch { return []; }
  };

  const parseGeofence = (json: string) => {
    try { return JSON.parse(json); } catch { return []; }
  };

  return (
    <div className="w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Roteiros de Ronda</h1>
          <p className="text-sm text-slate-500 mt-1">Defina áreas, pontos de controle e itinerários de ronda</p>
        </div>
        <button
          onClick={() => { setEditingRoute(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-[#0f172a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
        >
          <Plus className="w-4 h-4" />
          Novo Roteiro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-400 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Roteiros Ativos</p>
              <p className="text-2xl font-bold text-slate-800">{routes.filter(r => r.is_active).length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-400 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total de Checkpoints</p>
              <p className="text-2xl font-bold text-slate-800">
                {routes.reduce((sum, r) => sum + parseCheckpoints(r.checkpoints).length, 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-400 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tempo Médio</p>
              <p className="text-2xl font-bold text-slate-800">
                {routes.length > 0 ? Math.round(routes.reduce((s, r) => s + r.estimated_duration_min, 0) / routes.length) : 0} min
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar roteiros..."
          className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500 animate-pulse font-medium">Carregando roteiros...</p>
        </div>
      ) : filtered.length === 0 && routes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-400 shadow-sm flex flex-col items-center justify-center py-20"
        >
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Nenhum roteiro cadastrado</h2>
          <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
            Clique em "Novo Roteiro" para definir áreas de ronda, pontos de controle obrigatórios e itinerários no mapa.
          </p>
          <button
            onClick={() => { setEditingRoute(null); setModalOpen(true); }}
            className="bg-[#0f172a] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Roteiro
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Pending offline routes */}
          {pendingOfflineRoutes.map((pr) => {
            const cps = parseCheckpoints(pr.checkpoints);
            const fence = parseGeofence(pr.geofence);
            return (
              <motion.div
                key={`pending-${pr.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 rounded-2xl border-2 border-dashed border-amber-400 p-5 shadow-sm relative"
              >
                <div className="absolute top-3 right-3">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 border border-amber-300">
                    <CloudOff className="w-3 h-3" />
                    Pendente de Sincronização
                  </span>
                </div>
                <div className="mb-3">
                  <h3 className="font-bold text-slate-800">{pr.name}</h3>
                  {pr.description && <p className="text-xs text-slate-500 mt-0.5">{pr.description}</p>}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-purple-700">{cps.length}</p>
                    <p className="text-[10px] text-purple-500 font-medium">Pontos</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-blue-700">{fence.length}</p>
                    <p className="text-[10px] text-blue-500 font-medium">Vértices</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-emerald-700">{pr.estimated_duration_min}</p>
                    <p className="text-[10px] text-emerald-500 font-medium">Min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-amber-200">
                  <button
                    onClick={() => { removePendingRoute(pr.id); setPendingOfflineRoutes(getPendingRoutes()); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Descartar
                  </button>
                </div>
              </motion.div>
            );
          })}
          {/* Server routes */}
          {filtered.map((route, idx) => {
            const cps = parseCheckpoints(route.checkpoints);
            const fence = parseGeofence(route.geofence);
            
            // Check if delayed/alerted
            let isDelayed = false;
            let expectedStartStr = "";
            let expectedDeadlineStr = "";

            if (route.last_missed_alert_time && route.is_active) {
              const alertTimeStr = route.last_missed_alert_time.endsWith('Z') ? route.last_missed_alert_time : `${route.last_missed_alert_time}Z`;
              const alertTime = new Date(alertTimeStr);
              const repeatMs = (route.repeat_every_minutes || 1440) * 60 * 1000;
              if (new Date().getTime() - alertTime.getTime() < repeatMs) {
                isDelayed = true;

                if (route.start_time && route.repeat_every_minutes) {
                  // start_time is local time (e.g. 2026-05-22T09:30:00). 
                  // By avoiding 'Z', new Date() parses it as local time.
                  const cleanTimeStr = route.start_time.replace('Z', '');
                  const startDate = new Date(cleanTimeStr);
                  const now = new Date();
                  const deltaM = (now.getTime() - startDate.getTime()) / (1000 * 60);
                  if (deltaM >= 0) {
                    const N = Math.floor(deltaM / route.repeat_every_minutes);
                    const expectedStart = new Date(startDate.getTime() + N * route.repeat_every_minutes * 60 * 1000);
                    const tolerance = route.tolerance_minutes || 15;
                    const expectedDeadline = new Date(expectedStart.getTime() + tolerance * 60 * 1000);
                    
                    expectedStartStr = expectedStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    expectedDeadlineStr = expectedDeadline.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  }
                }
              }
            }

            return (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`${isDelayed ? 'bg-red-50 border-red-300 shadow-red-900/10' : 'bg-white border-slate-400'} rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden`}
              >
                {isDelayed && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${isDelayed ? 'text-red-900' : 'text-slate-800'}`}>{route.name}</h3>
                      {isDelayed && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                            Ronda Atrasada
                          </span>
                          {route.notify_whatsapp && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 border border-blue-200 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                              Notificado
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {route.description && <p className={`text-xs mt-0.5 ${isDelayed ? 'text-red-700/70' : 'text-slate-500'}`}>{route.description}</p>}
                  </div>
                  <button
                    onClick={() => handleToggleActive(route)}
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border transition-colors cursor-pointer hover:shadow-sm ${route.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                    title={route.is_active ? "Clique para desativar" : "Clique para ativar"}
                  >
                    {route.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-purple-700">{cps.length}</p>
                    <p className="text-[10px] text-purple-500 font-medium">Pontos</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-blue-700">{fence.length}</p>
                    <p className="text-[10px] text-blue-500 font-medium">Vértices</p>
                  </div>
                  <div className={`${isDelayed ? 'bg-red-100/50' : 'bg-emerald-50'} rounded-lg p-2 text-center`}>
                    <p className={`text-lg font-bold ${isDelayed ? 'text-red-700' : 'text-emerald-700'}`}>{route.estimated_duration_min}</p>
                    <p className={`text-[10px] font-medium ${isDelayed ? 'text-red-500' : 'text-emerald-500'}`}>Min</p>
                  </div>
                </div>

                <div className={`flex flex-col gap-1 text-[11px] mb-4 p-2.5 rounded-xl border ${isDelayed ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  {isDelayed && expectedStartStr && (
                    <div className="flex flex-col mb-1 pb-1.5 border-b border-red-200/60">
                      <span className="font-bold text-red-800">⚠️ Faltou iniciar a ronda de {expectedStartStr}</span>
                      <span className="text-[10px] text-red-600/80">O limite de tolerância era até {expectedDeadlineStr}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Frequência:</span>
                    <span className="font-semibold text-slate-700">
                      {route.repeat_every_minutes ? `A cada ${route.repeat_every_minutes} min` : 'Avulsa / Manual'}
                    </span>
                  </div>
                  {route.repeat_every_minutes && (
                    <div className="flex justify-between">
                      <span>Tolerância para início:</span>
                      <span className="font-semibold text-slate-700">{route.tolerance_minutes} min</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Turno autorizado:</span>
                    <span className="font-semibold text-slate-700">{route.assigned_shift || 'Qualquer Turno'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vigia autorizado:</span>
                    <span className="font-semibold">
                      {route.assigned_guard?.name ? `${route.assigned_guard.name} (${route.assigned_guard.registration})` : 'Qualquer Vigia'}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-2 pt-3 border-t ${isDelayed ? 'border-red-200' : 'border-slate-100'}`}>
                  <button
                    onClick={() => {
                      setHistoryRouteId(route.id);
                      setHistoryRouteName(route.name);
                      setHistoryModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-bold"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Histórico
                  </button>
                  <button
                    onClick={() => { setEditingRoute(route); setModalOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-xs font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(route.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      <RouteEditorModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRoute(null); }}
        onSaved={fetchRoutes}
        route={editingRoute}
      />

      {/* History Modal */}
      <PatrolHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        routeId={historyRouteId}
        routeName={historyRouteName}
      />
    </div>
  );
}
