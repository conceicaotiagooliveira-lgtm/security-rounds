import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, XCircle, User } from 'lucide-react';
import api from '@/services/api';

export default function GuardHistory() {
  const [patrols, setPatrols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patrols').then(res => {
      setPatrols(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusConfig = (status: string) => {
    switch (status) {
      case 'Concluída': return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'Incompleta': return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'Em Andamento': return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      default: return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    }
  };

  // Backend stores UTC without 'Z' suffix — normalize to ensure correct local conversion
  const toLocal = (dt: string) => {
    if (!dt) return new Date();
    // If no timezone info, treat as UTC
    return new Date(dt.endsWith('Z') || dt.includes('+') ? dt : dt + 'Z');
  };

  const formatDate = (dt: string) => {
    return toLocal(dt).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const duration = (start: string, end: string | null) => {
    if (!end) return 'Em andamento';
    const diff = (toLocal(end).getTime() - toLocal(start).getTime()) / 60000;
    return `${Math.round(diff)} min`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Histórico de Rondas</h2>
        <p className="text-sm text-slate-500">Suas rondas realizadas</p>
      </div>

      {loading ? (
        <p className="text-slate-500 animate-pulse text-center py-10">Carregando...</p>
      ) : patrols.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-300 p-10 text-center shadow-sm">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma ronda registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patrols.map((p, idx) => {
            const cfg = statusConfig(p.status);
            const Icon = cfg.icon;
            const checkpoints = JSON.parse(p.checkpoints_visited || '[]');
            const alerts = JSON.parse(p.alerts || '[]');

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-xl border border-slate-300 p-4 shadow-sm`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {p.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(p.started_at)}</span>
                </div>
                
                {p.guard && (
                  <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      <span className="text-slate-400 font-normal mr-1">Vigia:</span>
                      {p.guard.name}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{checkpoints.length}</p>
                    <p className="text-[10px] text-slate-400">Checkpoints</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{duration(p.started_at, p.finished_at)}</p>
                    <p className="text-[10px] text-slate-400">Duração</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{alerts.length}</p>
                    <p className="text-[10px] text-slate-400">Alertas</p>
                  </div>
                </div>
                {p.observations && (
                  <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Observações</p>
                    <p className="text-xs text-slate-600 mt-1">{p.observations}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
