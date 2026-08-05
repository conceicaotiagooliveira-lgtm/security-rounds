import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import api from '@/services/api';

interface ArrivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  movement: any;
  guards?: any[];
}

export default function ArrivalModal({ isOpen, onClose, onSuccess, movement, guards = [] }: ArrivalModalProps) {
  const [arrivalKm, setArrivalKm] = useState(movement?.departure_km?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guardPassword, setGuardPassword] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');

  if (!isOpen || !movement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalKm || !guardPassword) {
      setError('Informe o KM de chegada e a senha do vigia');
      return;
    }

    if (!authorizedBy) {
      setError('Senha do vigia inválida ou não encontrada');
      return;
    }

    if (parseFloat(arrivalKm) < movement.departure_km) {
      setError(`O KM não pode ser menor que o de saída (${movement.departure_km})`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.put(`/movements/${movement.id}/arrival`, {
        arrival_km: parseFloat(arrivalKm),
        arrival_authorized_by: authorizedBy
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao registrar chegada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
            <div>
              <h2 className="text-xl font-bold text-emerald-800">Registrar Retorno</h2>
              <p className="text-sm text-emerald-600/80">Veículo entregue na base</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-emerald-600/50 hover:text-emerald-700 hover:bg-emerald-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Condutor</p>
              <p className="font-semibold text-slate-800 mb-3">{movement.driver_name}</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Destino</p>
                  <p className="font-semibold text-slate-700 truncate" title={movement.destination}>{movement.destination || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">KM Saída</p>
                  <p className="font-semibold text-slate-700">{movement.departure_km} km</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estimativa (Ida e Volta)</p>
                  {movement.estimated_distance_km ? (
                    <p className="font-semibold text-indigo-600">~{movement.estimated_distance_km} km</p>
                  ) : (
                    <p className="font-semibold text-slate-400">N/A</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Odômetro Final (KM de Chegada)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={arrivalKm}
                  onChange={(e) => setArrivalKm(e.target.value)}
                  className="w-full pl-4 pr-8 py-3 bg-white border-2 border-emerald-100 rounded-xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all text-lg font-bold text-slate-800"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">km</span>
              </div>
              
              {arrivalKm && movement.estimated_distance_km && parseFloat(arrivalKm) >= movement.departure_km && (
                <div className={`mt-3 p-3 rounded-xl flex items-center justify-between text-sm font-medium border ${
                  ((parseFloat(arrivalKm) - movement.departure_km) > movement.estimated_distance_km * 1.3) 
                  ? 'bg-rose-50 text-rose-700 border-rose-100' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                  <span>Rodado na viagem:</span>
                  <span className="font-bold">{(parseFloat(arrivalKm) - movement.departure_km).toFixed(1)} km</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Autorização da Portaria</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha do Vigia</label>
                  <input
                    type="password"
                    value={guardPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGuardPassword(val);
                      const matched = guards.find(g => g.auth_password && g.auth_password === val);
                      if (matched) {
                        setAuthorizedBy(matched.name);
                        setError('');
                      } else {
                        setAuthorizedBy('');
                      }
                    }}
                    placeholder="••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vigia Identificado</label>
                  <input
                    type="text"
                    readOnly
                    value={authorizedBy || 'Aguardando senha...'}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none font-semibold ${
                      authorizedBy 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? 'Registrando...' : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Finalizar Viagem
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
