import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Activity } from 'lucide-react';

interface VehicleHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  history: any[];
}

export default function VehicleHistoryModal({ isOpen, onClose, vehicle, history }: VehicleHistoryModalProps) {
  if (!isOpen || !vehicle) return null;

  const vehicleHistory = history.filter(m => m.vehicle_id === vehicle.id);

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
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Histórico do Veículo
              </h2>
              <p className="text-sm text-slate-500 font-medium">Placa: {vehicle.plate} - {vehicle.model}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {vehicleHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>Nenhum histórico de movimentação encontrado para este veículo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vehicleHistory.map((m) => (
                  <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                          Status
                        </span>
                        <span className={`font-semibold ${!m.arrival_time ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {!m.arrival_time ? 'Em Uso' : 'Concluída'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                          KM Rodado
                        </span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          {m.arrival_km && m.departure_km ? (m.arrival_km - m.departure_km).toFixed(1) : '-'} km
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Motorista</p>
                        <p className="font-semibold text-slate-800">{m.driver_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Destino</p>
                        <p className="font-semibold text-slate-800 truncate" title={m.destination}>{m.destination || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Saída</p>
                        <p className="font-medium text-slate-700">
                          {new Date(m.departure_time).toLocaleDateString('pt-BR')} às {new Date(m.departure_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p className="text-xs text-slate-500">KM: {m.departure_km}</p>
                        {m.authorized_by && <p className="text-[10px] text-emerald-600 mt-0.5">Aut: {m.authorized_by}</p>}
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300" />
                      <div className="flex-1 text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Retorno</p>
                        <p className="font-medium text-slate-700">
                          {m.arrival_time 
                            ? `${new Date(m.arrival_time).toLocaleDateString('pt-BR')} às ${new Date(m.arrival_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}` 
                            : 'Pendente'}
                        </p>
                        <p className="text-xs text-slate-500">KM: {m.arrival_km || '-'}</p>
                        {m.arrival_authorized_by && <p className="text-[10px] text-emerald-600 mt-0.5 text-right">Aut: {m.arrival_authorized_by}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
