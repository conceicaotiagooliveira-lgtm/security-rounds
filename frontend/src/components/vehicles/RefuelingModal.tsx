import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Plus, Fuel, Calendar, Search, ChevronDown } from 'lucide-react';
import api from '@/services/api';

interface RefuelingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  drivers: any[];
  onHistoryUpdated: () => void;
}

export default function RefuelingModal({ isOpen, onClose, vehicle, drivers, onHistoryUpdated }: RefuelingModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [driverId, setDriverId] = useState<number | ''>('');
  const [km, setKm] = useState<string>('');
  const [liters, setLiters] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');

  const [driverSearch, setDriverSearch] = useState('');
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDriverDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && vehicle) {
      fetchHistory();
      setKm(vehicle.current_km ? vehicle.current_km.toString() : '');
      setDriverId('');
      setLiters('');
      setTotalCost('');
    }
  }, [isOpen, vehicle]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vehicles/${vehicle.id}/refuelings`);
      setHistory(res.data);
    } catch (e) {
      console.error("Failed to fetch refueling history", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) {
      alert("Selecione um motorista");
      return;
    }
    if (!km || isNaN(Number(km))) {
      alert("Quilometragem inválida");
      return;
    }
    if (!liters || isNaN(Number(liters))) {
      alert("Litros inválidos");
      return;
    }
    if (!totalCost || isNaN(Number(totalCost))) {
      alert("Custo total inválido");
      return;
    }

    try {
      await api.post(`/vehicles/${vehicle.id}/refuelings`, {
        driver_id: Number(driverId),
        current_km: Number(km),
        liters: Number(liters),
        total_cost: Number(totalCost),
      });
      fetchHistory();
      onHistoryUpdated();
      setLiters('');
      setTotalCost('');
    } catch (e: any) {
      console.error("Failed to add refueling", e);
      alert(e.response?.data?.detail || "Erro ao registrar abastecimento");
    }
  };

  const handleDelete = async (historyId: number) => {
    if (confirm("Deseja realmente excluir este abastecimento?")) {
      try {
        await api.delete(`/vehicles/refuelings/${historyId}`);
        fetchHistory();
      } catch (e) {
        console.error("Failed to delete refueling", e);
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
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Abastecimentos</h2>
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
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Registrar Abastecimento</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2 lg:col-span-4" ref={dropdownRef}>
                <label className="block text-xs font-medium text-slate-500 mb-1">Motorista que Abasteceu</label>
                <div className="relative">
                  <div 
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus-within:ring-2 focus-within:ring-blue-500 flex items-center justify-between cursor-pointer"
                    onClick={() => setShowDriverDropdown(!showDriverDropdown)}
                  >
                    <span className={driverId ? 'text-slate-800' : 'text-slate-400'}>
                      {driverId && drivers.find(d => d.id === driverId) 
                        ? drivers.find(d => d.id === driverId)?.name 
                        : 'Selecione o motorista...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {showDriverDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col">
                      <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Buscar motorista..."
                          value={driverSearch}
                          onChange={(e) => setDriverSearch(e.target.value)}
                          className="w-full outline-none text-sm"
                        />
                      </div>
                      <div className="overflow-y-auto p-1">
                        {drivers
                          .filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()))
                          .map(d => (
                            <div
                              key={d.id}
                              onClick={() => {
                                setDriverId(d.id);
                                setShowDriverDropdown(false);
                                setDriverSearch('');
                              }}
                              className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${driverId === d.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                              {d.name}
                            </div>
                          ))}
                        {drivers.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-500 text-center">Nenhum motorista encontrado</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Hodômetro (KM)</label>
                <input 
                  type="number" 
                  value={km} 
                  onChange={e => setKm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Ex: 45000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Litros (L)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={liters} 
                  onChange={e => setLiters(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Ex: 45.5"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Custo Total (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={totalCost} 
                  onChange={e => setTotalCost(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Ex: 250.00"
                  required
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </form>
          </div>

          {/* History List */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Últimos Abastecimentos</h3>
            {loading ? (
              <p className="text-center text-slate-500 py-8">Carregando...</p>
            ) : history.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <Fuel className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nenhum abastecimento encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...history].reverse().map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        <Fuel className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <p className="font-bold text-slate-800">{new Date(item.created_at).toLocaleDateString()}</p>
                          <p className="text-sm font-medium text-blue-600">{item.current_km.toLocaleString()} km</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.liters} Litros • R$ {item.total_cost.toFixed(2)}
                          {(() => {
                            const drv = drivers.find(d => d.id === item.driver_id);
                            return drv ? ` • Motorista: ${drv.name}` : '';
                          })()}
                        </p>
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
