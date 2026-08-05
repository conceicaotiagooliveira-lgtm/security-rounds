import { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, User as UserIcon, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { getAssetUrl } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import DriverModal from '@/components/drivers/DriverModal';
import clsx from 'clsx';

export default function Drivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [activeMovements, setActiveMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any | undefined>();

  const fetchDrivers = async () => {
    try {
      const [driversRes, movRes, vehRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/movements/active'),
        api.get('/vehicles')
      ]);
      setDrivers(driversRes.data);
      setActiveMovements(movRes.data);
      setVehicles(vehRes.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este motorista?')) {
      try {
        await api.delete(`/drivers/${id}`);
        fetchDrivers();
      } catch (error) {
        console.error('Error deleting driver:', error);
        alert('Erro ao excluir motorista');
      }
    }
  };

  const openEditModal = (driver: any) => {
    setEditingDriver(driver);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingDriver(undefined);
    setIsModalOpen(true);
  };

  const { user } = useAuthStore();
  const hideExternalDrivers = user?.permissions?.includes('hide_external_drivers');

  const filteredDrivers = drivers
    .filter(d => {
      if (hideExternalDrivers && d.vehicle_id != null) return false;
      return true;
    })
    .filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.cpf.includes(search) ||
      d.cnh.includes(search)
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortConfig, filteredDrivers.length]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === 'veiculo') {
      const getVehicleStr = (driver: any) => {
        const mov = activeMovements.find(m => m.driver_name === driver.name);
        if (mov) return '1_Na_Rua';
        if (driver.vehicle) return '2_Fixo_' + driver.vehicle.plate;
        return '3_Sem_veiculo';
      };
      aVal = getVehicleStr(a);
      bVal = getVehicleStr(b);
    } else if (sortConfig.key === 'contato') {
      aVal = a.phone || a.email || '';
      bVal = b.phone || b.email || '';
    } else {
      aVal = aVal || '';
      bVal = bVal || '';
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedDrivers.length / itemsPerPage);
  const paginatedDrivers = sortedDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SortableHeader = ({ label, sortKey, className = "" }: { label: string, sortKey: string, className?: string }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th 
        className={`py-1.5 sm:py-2 px-1.5 sm:px-3 cursor-pointer hover:bg-slate-700 transition-colors select-none text-[10px] sm:text-[11px] ${className}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1.5">
          {label}
          {isActive ? (
            sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-300" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-300" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por nome, CPF ou CNH..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-full py-2 sm:py-2.5 pl-9 sm:pl-10 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full font-medium text-[11px] sm:text-sm shadow-sm hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Filtrar</span>
          </button>
          
          <button 
            onClick={openNewModal}
            className="flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 text-white rounded-full font-medium text-[11px] sm:text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Novo Motorista</span>
          </button>
        </div>
      </div>

      {/* Drivers List */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-900 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider divide-x divide-slate-700">
                  <SortableHeader label="Motorista" sortKey="name" className="px-3" />
                  <SortableHeader label="Veículo Atual" sortKey="veiculo" className="px-2" />
                  <SortableHeader label="CPF" sortKey="cpf" className="px-2 hidden md:table-cell" />
                  <SortableHeader label="CNH" sortKey="cnh" className="px-2 hidden lg:table-cell" />
                  <SortableHeader label="Contato" sortKey="contato" className="px-2" />
                  <SortableHeader label="Status" sortKey="status" className="px-2" />
                  <th className="py-2 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDrivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors group divide-x divide-slate-200">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {driver.photo_url ? (
                            <img src={getAssetUrl(driver.photo_url)} alt={driver.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs sm:text-sm">{driver.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500">{driver.user_id ? 'App Habilitado' : 'Sem Acesso App'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      {(() => {
                        const currentMovement = activeMovements.find(m => m.driver_name === driver.name);
                        const currentVehicleId = currentMovement?.vehicle_id;
                        const currentVehicle = currentVehicleId ? vehicles.find(v => v.id === currentVehicleId) : null;
                        
                        if (currentMovement) {
                          return (
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-bold text-blue-600">Na Rua (Em Uso)</span>
                              <span className="text-[10px] sm:text-xs text-slate-500">
                                {currentVehicle ? `${currentVehicle.plate} - ${currentVehicle.model}` : 'Veículo Desconhecido'}
                              </span>
                            </div>
                          );
                        } else if (driver.vehicle) {
                          return (
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-bold text-emerald-600">Carro Fixo</span>
                              <span className="text-[10px] sm:text-xs text-slate-500">
                                {driver.vehicle.plate} - {driver.vehicle.model}
                              </span>
                            </div>
                          );
                        } else {
                          return <span className="text-xs sm:text-sm text-slate-400">Sem veículo</span>;
                        }
                      })()}
                    </td>
                    <td className="py-2 px-2 text-slate-600 hidden md:table-cell text-xs sm:text-sm">{driver.cpf}</td>
                    <td className="py-2 px-2 hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="text-slate-600 text-xs sm:text-sm">{driver.cnh}</span>
                        {(() => {
                          const expDate = new Date(driver.cnh_expiration);
                          expDate.setHours(23, 59, 59, 999);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isExpired = expDate < today;
                          return (
                            <span className={clsx("text-xs font-semibold", isExpired ? "text-red-500" : "text-slate-400")}>
                              {isExpired ? 'Vencida: ' : 'Val: '}
                              {expDate.toLocaleDateString()}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-slate-600">
                      <div className="flex flex-col text-xs sm:text-sm">
                        <span>{driver.phone || '-'}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400">{driver.email || '-'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <span className={clsx(
                        "px-3 py-1 text-xs font-bold rounded-full",
                        driver.status === 'Disponível' ? "bg-emerald-100 text-emerald-700" : 
                        driver.status === 'Em Rota' ? "bg-blue-100 text-blue-700" : 
                        driver.status === 'Férias' ? "bg-amber-100 text-amber-700" : 
                        "bg-slate-100 text-slate-700"
                      )}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2 transition-opacity">
                        <button 
                          onClick={() => openEditModal(driver)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(driver.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredDrivers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Nenhum motorista encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-500">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> até{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, sortedDrivers.length)}
              </span>{' '}
              de <span className="font-medium">{sortedDrivers.length}</span> resultados
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
      </div>

      <DriverModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchDrivers();
        }}
        driver={editingDriver}
      />
    </div>
  );
}
