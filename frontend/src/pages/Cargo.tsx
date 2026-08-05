import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, Clock, Key, CheckCircle, ArrowRight, User, Gauge, Droplet } from 'lucide-react';
import api, { getAssetUrl } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import DepartureModal from '@/components/movements/DepartureModal';
import ArrivalModal from '@/components/movements/ArrivalModal';
import VehicleHistoryModal from '@/components/movements/VehicleHistoryModal';

function RunningTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setElapsed(formatted);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded ml-1 tracking-wider">{elapsed}</span>;
}

export default function Cargo() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [activeMovements, setActiveMovements] = useState<any[]>([]);
  const [historyMovements, setHistoryMovements] = useState<any[]>([]);
  const [guards, setGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDepartureOpen, setIsDepartureOpen] = useState(false);
  const [selectedArrival, setSelectedArrival] = useState<any>(null);
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<any>(null);
  const [preSelectedVehicleId, setPreSelectedVehicleId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'Todos' | 'Base' | 'Rua' | 'Manutencao' | 'Inativos'>('Rua');
  const { user } = useAuthStore();

  const tabCounts = useMemo(() => {
    const counts = { Todos: 0, Base: 0, Rua: 0, Manutencao: 0, Inativos: 0 };
    vehicles.forEach(v => {
      const hideExternalCars = user?.permissions?.includes('hide_external_cars');
      if (hideExternalCars && v.driver_id != null) return;
      
      const hasActiveMovement = activeMovements.some(m => m.vehicle_id === v.id);
      const isAtivo = v.status === 'Ativo';
      const isOilUrgent = v.oil_change_interval_km 
        ? (100 - ((v.current_km - (v.last_oil_change_km || 0)) / v.oil_change_interval_km) * 100) <= 10 
        : false;
      const needsMaintenance = v.status === 'Manutenção' || isOilUrgent;
      
      counts.Todos++;
      if (isAtivo && !hasActiveMovement && !needsMaintenance && v.driver_id == null) counts.Base++;
      if (hasActiveMovement) counts.Rua++;
      if (needsMaintenance) counts.Manutencao++;
      if (v.status === 'Inativo') counts.Inativos++;
    });
    return counts;
  }, [vehicles, activeMovements, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, dRes, mRes, gRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/movements'),
        api.get('/guards').catch(() => ({ data: [] }))
      ]);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
      setGuards(gRes.data);
      
      const allMovements = mRes.data;
      setActiveMovements(allMovements.filter((m: any) => m.status === 'EM USO'));
      setHistoryMovements(allMovements.filter((m: any) => m.status === 'CONCLUIDO'));
    } catch (err) {
      console.error("Failed to load movements data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getVehiclePlate = (id: number) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.plate} - ${v.model}` : 'Veículo Desconhecido';
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Carregando portaria...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 flex flex-col relative">
      
      {/* Sticky Header */}
      <div className="bg-white px-6 md:px-8 py-6 border-b border-slate-200 sticky top-0 z-20 shadow-sm shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Entrada e Saída de Veículos</h1>
            <p className="text-slate-500 mt-1 font-medium">Controle em tempo real de liberações da frota</p>
          </div>
          <button 
            onClick={() => {
              setPreSelectedVehicleId('');
              setIsDepartureOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <Key className="w-5 h-5" />
            Liberação Rápida
          </button>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide w-full">
          {(['Todos', 'Base', 'Rua', 'Manutencao', 'Inativos'] as const).map(tab => {
            const isActive = activeTab === tab;
            let label = '';
            let count = tabCounts[tab];
            
            if (tab === 'Todos') label = 'Todos os Veículos';
            else if (tab === 'Base') label = 'Na Base (Disponíveis)';
            else if (tab === 'Rua') label = 'Na Rua (Em Uso)';
            else if (tab === 'Manutencao') label = 'Manutenção / Óleo';
            else if (tab === 'Inativos') label = 'Inativos';

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`group relative px-5 py-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${
                  isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                }`}>
                  {count}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full shadow-[0_-2px_4px_rgba(79,70,229,0.4)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vehicles.filter(v => {
          const hideExternalCars = user?.permissions?.includes('hide_external_cars');
          if (hideExternalCars && v.driver_id != null) return false;
          
          const hasActiveMovement = activeMovements.some(m => m.vehicle_id === v.id);
          const isAtivo = v.status === 'Ativo';
          const isOilUrgent = v.oil_change_interval_km 
            ? (100 - ((v.current_km - (v.last_oil_change_km || 0)) / v.oil_change_interval_km) * 100) <= 10 
            : false;
          const needsMaintenance = v.status === 'Manutenção' || isOilUrgent;
          
          if (activeTab === 'Todos') return true;
          if (activeTab === 'Base') return isAtivo && !hasActiveMovement && !needsMaintenance && v.driver_id == null;
          if (activeTab === 'Rua') return hasActiveMovement;
          if (activeTab === 'Manutencao') return needsMaintenance;
          if (activeTab === 'Inativos') return v.status === 'Inativo';
          
          return true;
        }).map(vehicle => {
          const activeMovement = activeMovements.find(m => m.vehicle_id === vehicle.id);
          const isAtivo = vehicle.status === 'Ativo';
          const oilPercentage = vehicle.oil_change_interval_km 
            ? (100 - ((vehicle.current_km - (vehicle.last_oil_change_km || 0)) / vehicle.oil_change_interval_km) * 100)
            : null;
          
          const isOilUrgent = oilPercentage !== null && oilPercentage <= 10;
          const isOilWarning = oilPercentage !== null && oilPercentage > 10 && oilPercentage <= 30;

          const cardBorderClass = !isAtivo ? 'border-slate-200 opacity-70 grayscale'
            : isOilUrgent ? 'border-red-300 hover:border-red-400 shadow-red-100/50'
            : isOilWarning ? 'border-amber-300 hover:border-amber-400 shadow-amber-100/50'
            : 'border-emerald-200 hover:border-emerald-300 shadow-emerald-100/50';

          const sideBarClass = !isAtivo ? 'bg-slate-300'
            : isOilUrgent ? 'bg-red-500'
            : isOilWarning ? 'bg-amber-400'
            : 'bg-emerald-400';

          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={vehicle.id} 
              onClick={(e) => {
                // Ignore clicks on buttons to not open history modal when clicking action buttons
                if ((e.target as HTMLElement).closest('button')) return;
                setSelectedVehicleForHistory(vehicle);
              }}
              className={`bg-white rounded-xl p-4 border shadow-sm relative overflow-hidden flex flex-col h-full cursor-pointer transition-all hover:shadow-md ${cardBorderClass}`}
            >
              <div className={`absolute top-0 right-0 w-1.5 h-full ${sideBarClass}`}></div>
              
              <div className="mb-3 pb-3 border-b border-slate-100 flex gap-3 items-start">
                <div className="flex-1 min-w-0">
                  {activeMovement ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Em Uso</span>
                      <RunningTimer startTime={activeMovement.departure_time} />
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
                      !isAtivo ? 'text-slate-400' : isOilUrgent ? 'text-red-600' : isOilWarning ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      <CheckCircle className="w-3 h-3" />
                      <span>{isAtivo ? 'Base' : 'Inativo'}</span>
                    </div>
                  )}
                  <h3 className="text-lg font-black text-slate-800 leading-tight truncate">{vehicle.plate}</h3>
                  <p className="text-xs font-semibold text-slate-500 truncate">{vehicle.model}</p>
                </div>
                
                {vehicle.photo_url ? (
                  <img 
                    src={getAssetUrl(vehicle.photo_url)} 
                    alt={vehicle.plate} 
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                    <Car className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 mb-4">
                {activeMovement ? (
                  <div className="flex flex-col space-y-2 py-1">
                    <div className="flex items-start gap-2 text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="font-semibold text-xs leading-tight pt-1" title={activeMovement.driver_name}>{activeMovement.driver_name}</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <MapPin className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-xs leading-tight pt-1" title={activeMovement.destination}>{activeMovement.destination || 'Sem destino'}</span>
                    </div>
                    {activeMovement.authorized_by && (
                      <div className="flex items-start gap-2 text-emerald-600 pt-0.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider leading-tight pt-1">Portaria: {activeMovement.authorized_by}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col h-full space-y-2 py-0.5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Gauge className="w-3 h-3 text-slate-500" />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KM</p>
                        <p className="font-semibold text-xs text-slate-700">{vehicle.current_km.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Droplet className={`w-3 h-3 ${
                          !vehicle.oil_change_interval_km 
                            ? 'text-slate-400' 
                            : (100 - ((vehicle.current_km - (vehicle.last_oil_change_km || 0)) / vehicle.oil_change_interval_km) * 100) <= 10
                              ? 'text-red-500'
                              : (100 - ((vehicle.current_km - (vehicle.last_oil_change_km || 0)) / vehicle.oil_change_interval_km) * 100) <= 30
                                ? 'text-amber-500'
                                : 'text-emerald-500'
                        }`} />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Óleo</p>
                        <p className="font-semibold text-[11px] text-slate-700 text-right">
                          {!vehicle.oil_change_interval_km 
                            ? 'N/A' 
                            : (100 - ((vehicle.current_km - (vehicle.last_oil_change_km || 0)) / vehicle.oil_change_interval_km) * 100) <= 10
                              ? 'Troca Urgente'
                              : (100 - ((vehicle.current_km - (vehicle.last_oil_change_km || 0)) / vehicle.oil_change_interval_km) * 100) <= 30
                                ? 'Troca Próxima'
                                : 'Em Dia'
                          }
                        </p>
                      </div>
                    </div>
                    {vehicle.driver_id && (() => {
                      const linkedDriver = drivers.find(d => d.id === vehicle.driver_id);
                      if (!linkedDriver) return null;
                      return (
                        <div className="flex items-start gap-2 text-slate-600">
                          <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <User className="w-3 h-3 text-indigo-500" />
                          </div>
                          <div className="flex-1 flex justify-between items-start pt-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mt-0.5 shrink-0">Fixo</p>
                            <p className="font-semibold text-xs text-indigo-700 text-right ml-2 leading-tight">{linkedDriver.name}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="mt-auto">
                {activeMovement ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArrival(activeMovement);
                    }}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Registrar Retorno
                  </button>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isOilUrgent || vehicle.driver_id) return;
                      setPreSelectedVehicleId(vehicle.id.toString());
                      setIsDepartureOpen(true);
                    }}
                    disabled={!isAtivo || isOilUrgent || vehicle.driver_id != null}
                    className={`w-full py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isOilUrgent
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : vehicle.driver_id
                          ? 'bg-slate-100 text-slate-500 border border-slate-200'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {isOilUrgent ? (
                      <>
                        <Droplet className="w-3.5 h-3.5" />
                        Troca Vencida
                      </>
                    ) : vehicle.driver_id ? (
                      <>
                        <User className="w-3.5 h-3.5" />
                        Uso Exclusivo
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-3.5 h-3.5" />
                        Liberar Saída
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        </div>
      </div>



      <DepartureModal 
        isOpen={isDepartureOpen} 
        onClose={() => setIsDepartureOpen(false)} 
        onSuccess={fetchData} 
        vehicles={vehicles} 
        drivers={drivers}
        guards={guards}
        preSelectedVehicleId={preSelectedVehicleId}
        activeMovements={activeMovements}
      />

      <ArrivalModal 
        isOpen={!!selectedArrival} 
        onClose={() => setSelectedArrival(null)} 
        onSuccess={fetchData} 
        movement={selectedArrival} 
        guards={guards}
      />

      <VehicleHistoryModal 
        isOpen={!!selectedVehicleForHistory} 
        onClose={() => setSelectedVehicleForHistory(null)} 
        vehicle={selectedVehicleForHistory} 
        history={historyMovements} 
      />

    </div>
  );
}
