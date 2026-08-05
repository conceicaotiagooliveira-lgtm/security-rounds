import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Truck, Droplet, MessageCircle, Fuel, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { getAssetUrl } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

import VehicleModal from '@/components/vehicles/VehicleModal';
import OilHistoryModal from '@/components/vehicles/OilHistoryModal';
import RefuelingModal from '@/components/vehicles/RefuelingModal';

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: string;
  fuel_type: string;
  current_km: number;
  photo_url?: string;
  driver_id?: number;
  oil_change_interval_km?: number;
  last_oil_change_km?: number;
  oil_alert_threshold_km?: number;
  last_oil_alert_km?: number;
  last_oil_alert_date?: string;
  notify_whatsapp_oil?: boolean;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();
  
  const [isOilModalOpen, setIsOilModalOpen] = useState(false);
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | undefined>();

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelVehicle, setFuelVehicle] = useState<Vehicle | undefined>();

  // Custom dialogs
  const [waDialog, setWaDialog] = useState<{isOpen: boolean, vehicle: Vehicle | null, loading: boolean}>({isOpen: false, vehicle: null, loading: false});
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [alertDetails, setAlertDetails] = useState<{isOpen: boolean, vehicle: Vehicle | null}>({isOpen: false, vehicle: null});

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const [vehRes, drvRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      setVehicles(vehRes.data);
      setDrivers(drvRes.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
      try {
        await api.delete(`/vehicles/${id}`);
        fetchVehicles();
      } catch (error: any) {
        if (error.response?.status === 400 && error.response?.data?.detail?.includes('histórico')) {
          if (window.confirm('Atenção: Este veículo possui histórico de abastecimentos, movimentos ou trocas de óleo vinculados a ele.\n\nDeseja realmente excluir o veículo E APAGAR TODO O SEU HISTÓRICO permanentemente?')) {
            try {
              await api.delete(`/vehicles/${id}?force=true`);
              fetchVehicles();
            } catch (forceError: any) {
              console.error('Error force deleting vehicle:', forceError);
              alert(forceError.response?.data?.detail || 'Erro ao excluir veículo permanentemente');
            }
          }
        } else {
          console.error('Error deleting vehicle:', error);
          alert(error.response?.data?.detail || 'Erro ao excluir veículo');
        }
      }
    }
  };

  const handleSendWhatsApp = (vehicle: Vehicle) => {
    setWaDialog({ isOpen: true, vehicle, loading: false });
  };

  const confirmSendWhatsApp = async () => {
    if (!waDialog.vehicle) return;
    setWaDialog(prev => ({ ...prev, loading: true }));
    try {
      await api.post(`/vehicles/${waDialog.vehicle.id}/notify-oil`);
      setToast({ show: true, message: 'Alerta enviado com sucesso (Evolution)!', type: 'success' });
      fetchVehicles();
    } catch (err: any) {
      setToast({ show: true, message: err.response?.data?.detail || 'Erro ao enviar alerta via WhatsApp', type: 'error' });
    } finally {
      setWaDialog({ isOpen: false, vehicle: null, loading: false });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    }
  };

  const { user } = useAuthStore();
  const hideExternalCars = user?.permissions?.includes('hide_external_cars');

  const filteredVehicles = vehicles
    .filter(v => {
      if (hideExternalCars && v.driver_id != null) return false;
      return true;
    })
    .filter(v => 
      v.plate.toLowerCase().includes(search.toLowerCase()) || 
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase())
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filteredVehicles.length]);

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full h-full pb-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Frota de Veículos</h1>
          <p className="text-slate-500 mt-1">Gerencie todos os veículos cadastrados na plataforma</p>
        </div>
        <button 
          onClick={() => { setEditingVehicle(undefined); setIsModalOpen(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-medium flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm shadow-lg shadow-slate-900/20 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Novo Veículo
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar placa, modelo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-2 sm:py-2.5 pl-9 sm:pl-10 pr-4 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-slate-300 rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">
              <tr className="divide-x border-b border-slate-900 divide-slate-600">
                <th className="py-2 px-2">Veículo</th>
                <th className="py-2 px-2">Placa</th>
                <th className="py-2 px-2 hidden sm:table-cell">Ano</th>
                <th className="py-2 px-2 hidden lg:table-cell">Combustível</th>
                <th className="py-2 px-2">Hodômetro</th>
                <th className="py-2 px-2">Motorista Fixo</th>
                <th className="py-2 px-2 hidden md:table-cell">Manutenção</th>
                <th className="py-2 px-2 text-center">Status</th>
                <th className="py-2 px-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-300 text-slate-700 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    Carregando veículos...
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors group divide-x-2 divide-slate-300">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 overflow-hidden shrink-0">
                          {vehicle.photo_url ? (
                            <img src={getAssetUrl(vehicle.photo_url)} alt={vehicle.plate} className="w-full h-full object-cover" />
                          ) : (
                            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">{vehicle.model}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500">{vehicle.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 font-mono font-medium text-slate-700 text-xs sm:text-sm">{vehicle.plate}</td>
                    <td className="py-2 px-2 text-slate-600 text-xs sm:text-sm hidden sm:table-cell">{vehicle.year}</td>
                    <td className="py-2 px-2 text-slate-600 text-[10px] sm:text-xs hidden lg:table-cell">{vehicle.fuel_type}</td>
                    <td className="py-2 px-2 text-slate-600 text-[10px] sm:text-xs whitespace-nowrap">{vehicle.current_km.toLocaleString()} km</td>
                    <td className="py-2 px-2 text-slate-600">
                      {vehicle.driver_id ? (() => {
                        const linkedDriver = drivers.find(d => d.id === vehicle.driver_id);
                        let isExpired = false;
                        if (linkedDriver && linkedDriver.cnh_expiration) {
                          const expDate = new Date(linkedDriver.cnh_expiration);
                          expDate.setHours(23, 59, 59, 999);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          isExpired = expDate < today;
                        }
                        
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isExpired ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                                {linkedDriver?.name?.charAt(0) || '-'}
                              </div>
                              <span className={isExpired ? "text-red-600 font-semibold" : ""}>
                                {linkedDriver?.name?.split(' ')[0] || 'Desconhecido'}
                              </span>
                            </span>
                            {isExpired && (
                              <span className="text-[10px] font-bold text-red-500 uppercase ml-8 leading-none">CNH Vencida</span>
                            )}
                          </div>
                        );
                      })() : (
                        <span className="text-slate-400 italic text-sm">Disponível</span>
                      )}
                    </td>
                    <td className="py-2 px-2 hidden md:table-cell">
                      {!vehicle.oil_change_interval_km ? (
                        <span className="text-slate-400 text-[11px] italic">Sem config.</span>
                      ) : (
                        (() => {
                          const targetKm = (vehicle.last_oil_change_km || 0) + vehicle.oil_change_interval_km;
                          const threshold = vehicle.oil_alert_threshold_km ?? 1000;
                          
                          const isUrgent = vehicle.current_km >= targetKm;
                          const isNear = !isUrgent && vehicle.current_km >= (targetKm - threshold);
                          
                          const wasNotified = vehicle.last_oil_alert_km != null && vehicle.last_oil_alert_km >= (vehicle.last_oil_change_km || 0);
                          
                          return (
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                isUrgent ? "bg-red-100 text-red-700 border border-red-200" :
                                isNear ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              }`}>
                                {isUrgent ? "Troca Vencida" : isNear ? "Troca Próxima" : "Óleo em Dia"}
                              </span>
                              
                              {(isUrgent || isNear || wasNotified) && (
                                wasNotified ? (
                                  <button
                                    onClick={() => setAlertDetails({isOpen: true, vehicle})}
                                    className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1 hover:text-blue-800 transition-colors p-1 -ml-1 rounded hover:bg-blue-50"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    {vehicle.last_oil_alert_date ? new Date(vehicle.last_oil_alert_date + (vehicle.last_oil_alert_date.endsWith('Z') ? '' : 'Z')).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : 'Notificado'}
                                  </button>
                                ) : (isUrgent && vehicle.notify_whatsapp_oil) ? (
                                  <span className="text-[9px] font-bold text-amber-600 uppercase flex items-center gap-1" title="Aguarde até 5 minutos para o robô processar">
                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Aguardando Robô...
                                  </span>
                                ) : null
                              )}
                            </div>
                          );
                        })()
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        vehicle.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                        vehicle.status === 'Manutenção' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap bg-slate-50">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleSendWhatsApp(vehicle)}
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Enviar Alerta via WhatsApp (Manual)"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setFuelVehicle(vehicle); setIsFuelModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Registrar Abastecimento"
                        >
                          <Fuel className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setHistoryVehicle(vehicle); setIsOilModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Histórico de Troca de Óleo"
                        >
                          <Droplet className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingVehicle(vehicle); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(vehicle.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between rounded-b-xl">
            <p className="text-xs sm:text-sm text-slate-500">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> até{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredVehicles.length)}
              </span>{' '}
              de <span className="font-medium">{filteredVehicles.length}</span> resultados
            </p>
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 sm:p-1.5 rounded bg-white border border-slate-300 text-slate-500 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 sm:p-1.5 rounded bg-white border border-slate-300 text-slate-500 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
      
      {isModalOpen && (
        <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={editingVehicle}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchVehicles();
        }}
      />
      )}

      {isOilModalOpen && (
        <OilHistoryModal
          isOpen={isOilModalOpen}
          onClose={() => setIsOilModalOpen(false)}
          vehicle={historyVehicle}
          onHistoryUpdated={fetchVehicles}
        />
      )}

      {isFuelModalOpen && (
        <RefuelingModal
          isOpen={isFuelModalOpen}
          onClose={() => setIsFuelModalOpen(false)}
          vehicle={fuelVehicle}
          drivers={drivers}
          onHistoryUpdated={fetchVehicles}
        />
      )}

      {/* WhatsApp Confirm Dialog */}
      <AnimatePresence>
        {waDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Enviar Alerta via WhatsApp</h3>
              <p className="text-sm text-slate-500 mb-6">
                Deseja disparar um alerta via WhatsApp para o motorista vinculado ao veículo <strong className="text-slate-700">{waDialog.vehicle?.plate}</strong>?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setWaDialog({ isOpen: false, vehicle: null, loading: false })}
                  disabled={waDialog.loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSendWhatsApp}
                  disabled={waDialog.loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {waDialog.loading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Details Modal */}
      <AnimatePresence>
        {alertDetails.isOpen && alertDetails.vehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Detalhes do Alerta</h3>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Veículo</p>
                  <p className="text-sm font-bold text-slate-800">{alertDetails.vehicle.model} - {alertDetails.vehicle.plate}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Data da Notificação</p>
                  <p className="text-sm font-bold text-slate-800">
                    {alertDetails.vehicle.last_oil_alert_date 
                      ? new Date(alertDetails.vehicle.last_oil_alert_date + (alertDetails.vehicle.last_oil_alert_date.endsWith('Z') ? '' : 'Z')).toLocaleString('pt-BR')
                      : 'Data desconhecida'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">KM Informada</p>
                  <p className="text-sm font-bold text-slate-800">
                    {alertDetails.vehicle.last_oil_alert_km?.toLocaleString()} km
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setAlertDetails({ isOpen: false, vehicle: null })}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Toast/Alert */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-200/50' : 'bg-red-200/50'}`}>
              <MessageCircle className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
