import { useState, useEffect } from 'react';
import { X, Trash2, Plus, Calendar, Settings } from 'lucide-react';
import api from '@/services/api';

interface OilHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  onHistoryUpdated: () => void;
}

export default function OilHistoryModal({ isOpen, onClose, vehicle, onHistoryUpdated }: OilHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [km, setKm] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && vehicle) {
      fetchHistory();
      setKm(vehicle.last_oil_change_km ? vehicle.last_oil_change_km.toString() : '');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [isOpen, vehicle]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vehicles/${vehicle.id}/oil-history`);
      setHistory(res.data);
    } catch (e) {
      console.error("Failed to fetch oil history", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!km || isNaN(Number(km))) {
      alert("Quilometragem inválida");
      return;
    }

    try {
      await api.post(`/vehicles/${vehicle.id}/oil-history`, {
        km_at_change: Number(km),
        date: new Date(date).toISOString(),
        notes: notes || undefined
      });
      fetchHistory();
      onHistoryUpdated();
      setNotes('');
    } catch (e) {
      console.error("Failed to add history", e);
      alert("Erro ao adicionar histórico");
    }
  };

  const handleDelete = async (historyId: number) => {
    if (confirm("Deseja realmente excluir este registro?")) {
      try {
        await api.delete(`/vehicles/oil-history/${historyId}`);
        fetchHistory();
      } catch (e) {
        console.error("Failed to delete history", e);
        alert("Erro ao excluir registro");
      }
    }
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Histórico de Troca de Óleo</h2>
              <p className="text-sm text-slate-500">Veículo: {vehicle.plate} - {vehicle.model}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Form to add new */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Registrar Nova Troca</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Hodômetro (KM)</label>
                <input 
                  type="number" 
                  value={km} 
                  onChange={e => setKm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                  placeholder="Ex: 45000"
                  required
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Observações (Óleo, Filtro, Oficina)</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                    placeholder="Opcional..."
                  />
                  <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap">
                    <Plus className="w-4 h-4" />
                    Registrar
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* History List */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Registros Anteriores</h3>
            {loading ? (
              <p className="text-center text-slate-500 py-8">Carregando...</p>
            ) : history.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nenhum registro de troca de óleo encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-orange-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        #{history.length - idx}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <p className="font-bold text-slate-800">{new Date(item.date).toLocaleDateString()}</p>
                          <p className="text-sm font-medium text-orange-600">{item.km_at_change.toLocaleString()} km</p>
                        </div>
                        {item.notes && <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir Registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
