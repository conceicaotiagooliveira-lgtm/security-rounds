import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Car, 
  Key, 
  Users, 
  ShieldCheck, 
  Download, 
  Search, 
  Calendar,
  Filter,
  Fuel
} from 'lucide-react';
import api from '@/services/api';
import clsx from 'clsx';

type ReportTab = 'vehicles' | 'keys' | 'third_parties' | 'patrols' | 'refuelings';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('vehicles');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const [startDate, setStartDate] = useState(d.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterPlate, setFilterPlate] = useState('');
  const [filterDriver, setFilterDriver] = useState('');

  const [data, setData] = useState({
    vehicles: [],
    keys: [],
    thirdParties: [],
    patrols: [],
    refuelings: []
  });

  useEffect(() => {
    fetchData();
    setFilterPlate('');
    setFilterDriver('');
  }, [activeTab]); // Refetch when tab changes if needed, but we can also fetch all or fetch specifically

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vehicles') {
        const res = await api.get('/movements');
        setData(prev => ({ ...prev, vehicles: res.data }));
      } else if (activeTab === 'keys') {
        const res = await api.get('/keys/history');
        setData(prev => ({ ...prev, keys: res.data }));
      } else if (activeTab === 'third_parties') {
        const res = await api.get('/terceiros/entries');
        setData(prev => ({ ...prev, thirdParties: res.data }));
      } else if (activeTab === 'patrols') {
        const res = await api.get('/patrols');
        setData(prev => ({ ...prev, patrols: res.data }));
      } else if (activeTab === 'refuelings') {
        const res = await api.get('/vehicles/refuelings/all');
        setData(prev => ({ ...prev, refuelings: res.data }));
      }
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const date = new Date(dateStr);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    } catch (e) {
      return false;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(',', '');
  };

  const { uniquePlates, uniqueDrivers } = useMemo(() => {
    const plates = new Set<string>();
    const drivers = new Set<string>();
    
    if (activeTab === 'vehicles') {
      data.vehicles.forEach((v: any) => {
        if (v.vehicle_plate) plates.add(v.vehicle_plate);
        if (v.driver_name) drivers.add(v.driver_name);
      });
    } else if (activeTab === 'refuelings') {
      data.refuelings.forEach((r: any) => {
        if (r.vehicle_plate) plates.add(r.vehicle_plate);
        if (r.driver_name) drivers.add(r.driver_name);
      });
    }
    
    return {
      uniquePlates: Array.from(plates).sort(),
      uniqueDrivers: Array.from(drivers).sort()
    };
  }, [data.vehicles, data.refuelings, activeTab]);

  const filteredVehicles = useMemo(() => {
    return data.vehicles.filter((m: any) => {
      const matchDate = isDateInRange(m.departure_time);
      const matchSearch = (m.vehicle_plate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.driver_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.destination || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlate = filterPlate ? m.vehicle_plate === filterPlate : true;
      const matchDriver = filterDriver ? m.driver_name === filterDriver : true;
      return matchDate && matchSearch && matchPlate && matchDriver;
    }).sort((a: any, b: any) => new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime());
  }, [data.vehicles, startDate, endDate, searchQuery, filterPlate, filterDriver]);

  const filteredKeys = useMemo(() => {
    return data.keys.filter((k: any) => {
      const matchDate = isDateInRange(k.borrowedAt);
      const matchSearch = (k.keyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (k.borrower || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (k.department || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchSearch;
    }).sort((a: any, b: any) => new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime());
  }, [data.keys, startDate, endDate, searchQuery]);

  const filteredThirdParties = useMemo(() => {
    return data.thirdParties.filter((t: any) => {
      const matchDate = isDateInRange(t.checkInTime);
      const matchSearch = (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.document || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchSearch;
    }).sort((a: any, b: any) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
  }, [data.thirdParties, startDate, endDate, searchQuery]);

  const filteredPatrols = useMemo(() => {
    return data.patrols.filter((p: any) => {
      const matchDate = isDateInRange(p.start_time);
      const matchSearch = (p.guard_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.route_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchSearch;
    }).sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }, [data.patrols, startDate, endDate, searchQuery]);

  const filteredRefuelings = useMemo(() => {
    return data.refuelings.filter((r: any) => {
      // Fix UTC to avoid wrong day filtering
      const safeDateStr = r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z';
      const matchDate = isDateInRange(safeDateStr);
      const matchSearch = (r.vehicle_plate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.driver_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlate = filterPlate ? r.vehicle_plate === filterPlate : true;
      const matchDriver = filterDriver ? r.driver_name === filterDriver : true;
      return matchDate && matchSearch && matchPlate && matchDriver;
    });
  }, [data.refuelings, startDate, endDate, searchQuery, filterPlate, filterDriver]);

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Includes BOM for Excel UTF-8 support
    
    if (activeTab === 'vehicles') {
      csvContent += "Placa,Motorista,Destino,Saída,Retorno,Km Saída,Km Retorno,Responsável Autorização\n";
      filteredVehicles.forEach((m: any) => {
        csvContent += `"${m.vehicle_plate}","${m.driver_name}","${m.destination}","${m.departure_time ? formatDate(m.departure_time) : ''}","${m.arrival_time ? formatDate(m.arrival_time) : 'Em Aberto'}","${m.departure_km}","${m.arrival_km || ''}","${m.authorized_by || ''}"\n`;
      });
    } else if (activeTab === 'keys') {
      csvContent += "Chave,Retirado por,Setor,Data Retirada,Data Devolução,Recebido Por (Vigia),Status\n";
      filteredKeys.forEach((k: any) => {
        csvContent += `"${k.keyName}","${k.borrower}","${k.department}","${k.borrowedAt ? formatDate(k.borrowedAt) : ''}","${k.returnedAt ? formatDate(k.returnedAt) : 'Em Aberto'}","${k.returnedBy || ''}","${k.status}"\n`;
      });
    } else if (activeTab === 'third_parties') {
      csvContent += "Nome,Empresa,Documento,Motivo,Autorizador,Entrada,Saída,Status\n";
      filteredThirdParties.forEach((t: any) => {
        csvContent += `"${t.name}","${t.company}","${t.document}","${t.reason}","${t.authorizedBy}","${t.checkInTime ? formatDate(t.checkInTime) : ''}","${t.checkOutTime ? formatDate(t.checkOutTime) : 'Em Aberto'}","${t.status}"\n`;
      });
    } else if (activeTab === 'patrols') {
      csvContent += "Vigia,Rota,Início,Fim,Status,Pontos Lidos/Total,Alertas\n";
      filteredPatrols.forEach((p: any) => {
        const totalChecked = p.checkpoints ? p.checkpoints.filter((c: any) => c.checked_at).length : 0;
        const total = p.checkpoints ? p.checkpoints.length : 0;
        csvContent += `"${p.guard_name}","${p.route_name}","${p.start_time ? formatDate(p.start_time) : ''}","${p.end_time ? formatDate(p.end_time) : 'Em Andamento'}","${p.status}","${totalChecked}/${total}","${p.alerts ? p.alerts.length : 0}"\n`;
      });
    } else if (activeTab === 'refuelings') {
      csvContent += "Data e Hora,Placa,Motorista,Odômetro (KM),Litros,Valor Total (R$),Preço por Litro (R$)\n";
      filteredRefuelings.forEach((r: any) => {
        const safeDateStr = r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z';
        const pricePerLiter = r.liters > 0 ? (r.total_cost / r.liters).toFixed(2) : '0.00';
        csvContent += `"${formatDate(safeDateStr)}","${r.vehicle_plate}","${r.driver_name}","${r.current_km}","${r.liters}","${r.total_cost}","${pricePerLiter}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const today = new Date().toISOString().split('T')[0].split('-').reverse().join('-');
    link.setAttribute("download", `relatorio_${activeTab}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'vehicles', label: 'Veículos', icon: Car },
    { id: 'keys', label: 'Chaves', icon: Key },
    { id: 'third_parties', label: 'Terceiros', icon: Users },
    { id: 'patrols', label: 'Rondas', icon: ShieldCheck },
    { id: 'refuelings', label: 'Abastecimentos', icon: Fuel }
  ] as const;

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 before:absolute before:content-[''] before:w-full before:bg-white before:h-4 before:-top-4 md:before:h-6 md:before:-top-6 lg:before:h-8 lg:before:-top-8 before:left-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Central de Relatórios</h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Extraia e exporte dados de todos os módulos</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors',
                  activeTab === tab.id 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="text-sm text-slate-600 outline-none bg-transparent"
              />
              <span className="text-slate-300">até</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="text-sm text-slate-600 outline-none bg-transparent"
              />
            </div>
            
            {(activeTab === 'vehicles' || activeTab === 'refuelings') && (
              <>
                <select 
                  value={filterPlate}
                  onChange={e => setFilterPlate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none shadow-sm min-w-[120px]"
                >
                  <option value="">Todas as Placas</option>
                  {uniquePlates.map(plate => (
                    <option key={plate} value={plate}>{plate}</option>
                  ))}
                </select>

                <select 
                  value={filterDriver}
                  onChange={e => setFilterDriver(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none shadow-sm min-w-[150px]"
                >
                  <option value="">Todos os Motoristas</option>
                  {uniqueDrivers.map(driver => (
                    <option key={driver} value={driver}>{driver}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-x-auto">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-w-[800px]">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-medium text-sm">Carregando relatório...</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider">
                  {activeTab === 'vehicles' && (
                    <>
                      <th className="py-3 px-4">Veículo</th>
                      <th className="py-3 px-4">Motorista / Autorizador</th>
                      <th className="py-3 px-4">Destino</th>
                      <th className="py-3 px-4">Saída / Retorno</th>
                      <th className="py-3 px-4">Quilometragem</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </>
                  )}
                  {activeTab === 'keys' && (
                    <>
                      <th className="py-3 px-4">Chave</th>
                      <th className="py-3 px-4">Retirada Por / Setor</th>
                      <th className="py-3 px-4">Retirada / Devolução</th>
                      <th className="py-3 px-4">Recebido Por</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </>
                  )}
                  {activeTab === 'third_parties' && (
                    <>
                      <th className="py-3 px-4">Terceiro / Empresa</th>
                      <th className="py-3 px-4">Motivo / Autorizador</th>
                      <th className="py-3 px-4">Entrada / Saída</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </>
                  )}
                  {activeTab === 'patrols' && (
                    <>
                      <th className="py-3 px-4">Rota</th>
                      <th className="py-3 px-4">Vigia</th>
                      <th className="py-3 px-4">Início / Fim</th>
                      <th className="py-3 px-4 text-center">Progresso</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </>
                  )}
                  {activeTab === 'refuelings' && (
                    <>
                      <th className="py-3 px-4">Data e Hora</th>
                      <th className="py-3 px-4">Placa / Motorista</th>
                      <th className="py-3 px-4 text-right">Odômetro (KM)</th>
                      <th className="py-3 px-4 text-right">Litros</th>
                      <th className="py-3 px-4 text-right">Preço / Litro</th>
                      <th className="py-3 px-4 text-right">Valor Total</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {/* VEHICLES */}
                {activeTab === 'vehicles' && filteredVehicles.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{m.vehicle_plate}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700">{m.driver_name}</div>
                      <div className="text-[11px] text-slate-500">Aut: {m.authorized_by}</div>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={m.destination}>{m.destination}</td>
                    <td className="py-3 px-4">
                      <div className="text-emerald-600">{m.departure_time ? formatDate(m.departure_time) : '-'}</div>
                      <div className="text-blue-600">{m.arrival_time ? formatDate(m.arrival_time) : 'Em Aberto'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[12px]">Saída: <span className="font-medium text-slate-700">{m.departure_km} km</span></div>
                      <div className="text-[12px]">Ret: <span className="font-medium text-slate-700">{m.arrival_km || '-'} km</span></div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={clsx(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        m.arrival_time ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      )}>
                        {m.arrival_time ? 'Concluído' : 'Em Uso'}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* KEYS */}
                {activeTab === 'keys' && filteredKeys.map((k: any) => (
                  <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{k.keyName}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700">{k.borrower}</div>
                      <div className="text-[11px] text-slate-500">{k.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-orange-600">{k.borrowedAt ? formatDate(k.borrowedAt) : '-'}</div>
                      <div className="text-emerald-600">{k.returnedAt ? formatDate(k.returnedAt) : 'Em Aberto'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {k.returnedBy || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={clsx(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        k.status === 'Devolvida' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      )}>
                        {k.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* THIRD PARTIES */}
                {activeTab === 'third_parties' && filteredThirdParties.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{t.name}</div>
                      <div className="text-[11px] text-slate-500">{t.company} - {t.document}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700 max-w-[150px] truncate" title={t.reason}>{t.reason}</div>
                      <div className="text-[11px] text-slate-500">Aut: {t.authorizedBy}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-emerald-600">{t.checkInTime ? formatDate(t.checkInTime) : '-'}</div>
                      <div className="text-slate-500">{t.checkOutTime ? formatDate(t.checkOutTime) : 'No Local'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={clsx(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        t.status === 'Concluído' ? 'bg-slate-200 text-slate-600' :
                        t.status === 'Bloqueado' ? 'bg-red-100 text-red-600' :
                        'bg-emerald-100 text-emerald-700'
                      )}>
                        {t.status === 'Ativo' ? 'No Local' : t.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* PATROLS */}
                {activeTab === 'patrols' && filteredPatrols.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{p.route_name}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{p.guard_name}</td>
                    <td className="py-3 px-4">
                      <div className="text-blue-600">{p.start_time ? formatDate(p.start_time) : '-'}</div>
                      <div className="text-slate-500">{p.end_time ? formatDate(p.end_time) : 'Em Andamento'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-700 text-xs">
                        {p.checkpoints ? p.checkpoints.filter((c: any) => c.checked_at).length : 0} / {p.checkpoints ? p.checkpoints.length : 0} 
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={clsx(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        p.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      )}>
                        {p.status === 'completed' ? 'Concluída' : p.status === 'active' ? 'Em Andamento' : p.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* REFUELINGS */}
                {activeTab === 'refuelings' && filteredRefuelings.map((r: any) => {
                  const safeDateStr = r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z';
                  const dateObj = new Date(safeDateStr);
                  
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{dateObj.toLocaleDateString('pt-BR')}</div>
                        <div className="text-[11px] text-slate-500">{dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{r.vehicle_plate}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{r.driver_name}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {r.current_km.toLocaleString()} <span className="text-xs text-slate-400">km</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {r.liters} <span className="text-xs text-slate-400">L</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-500">
                        R$ {r.liters > 0 ? (r.total_cost / r.liters).toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">R$ {r.total_cost.toFixed(2)}</span>
                      </td>
                    </tr>
                  );
                })}

                {/* EMPTY STATES */}
                {activeTab === 'vehicles' && filteredVehicles.length === 0 && !loading && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">Nenhuma movimentação de veículo encontrada neste período.</td></tr>
                )}
                {activeTab === 'keys' && filteredKeys.length === 0 && !loading && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-500 text-sm">Nenhum histórico de chaves encontrado neste período.</td></tr>
                )}
                {activeTab === 'third_parties' && filteredThirdParties.length === 0 && !loading && (
                  <tr><td colSpan={4} className="text-center py-12 text-slate-500 text-sm">Nenhuma entrada/saída de terceiros encontrada neste período.</td></tr>
                )}
                {activeTab === 'patrols' && filteredPatrols.length === 0 && !loading && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-500 text-sm">Nenhuma ronda encontrada neste período.</td></tr>
                )}
                {activeTab === 'refuelings' && filteredRefuelings.length === 0 && !loading && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">Nenhum abastecimento encontrado para este filtro.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
