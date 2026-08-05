import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Activity, Calendar, MapPin, Box, TrendingUp, Share2, Truck, Wallet, Droplets, X, Fuel, Maximize2, Minimize2, User } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line, Bar, CartesianGrid, Legend } from 'recharts';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import api from '@/services/api';


import { getAssetUrl } from '@/services/api';

const getVehicleIcon = (photoUrl?: string, recentRefuelingsCount: number = 0, isUrgent: boolean = false, isNear: boolean = false) => {
  const content = photoUrl
    ? `<img src="${getAssetUrl(photoUrl)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`;
  
  let badges = '';
  if (isUrgent) {
    badges += `<div style="width: 14px; height: 14px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; position: absolute; top: -2px; right: -2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`;
  } else if (isNear) {
    badges += `<div style="width: 14px; height: 14px; background-color: #f59e0b; border-radius: 50%; border: 2px solid white; position: absolute; top: -2px; right: -2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`;
  }
  
  if (recentRefuelingsCount > 0) {
    badges += `<div style="background-color: #3b82f6; color: white; font-size: 10px; font-weight: bold; min-width: 16px; height: 16px; padding: 0 2px; border-radius: 50%; border: 2px solid white; position: absolute; top: ${isUrgent || isNear ? '10px' : '-2px'}; right: -6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${recentRefuelingsCount}</div>`;
  }
  
  return new L.DivIcon({
    html: `<div style="position: relative; width: 36px; height: 36px;">
             <div style="background-color: ${photoUrl ? 'white' : '#10b981'}; border: 2px solid white; border-radius: 50%; padding: ${photoUrl ? '2px' : '4px'}; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; overflow: hidden;">${content}</div>
             ${badges}
           </div>`,
    className: 'custom-vehicle-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [refuelings, setRefuelings] = useState<any[]>([]);
  const [averageKml, setAverageKml] = useState<string>('--');
  const [loading, setLoading] = useState(true);
  const [selectorMode, setSelectorMode] = useState<'vehicles' | 'drivers'>('vehicles');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedRefueling, setSelectedRefueling] = useState<any>(null);
  const [isEditingRefueling, setIsEditingRefueling] = useState(false);
  const [editForm, setEditForm] = useState({ total_cost: 0, liters: 0, current_km: 0 });
  
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editRowForm, setEditRowForm] = useState({ total_cost: 0, liters: 0, current_km: 0 });
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Dynamically scale the entire dashboard to fit the screen height
  useEffect(() => {
    const calculateZoom = () => {
      if (window.innerWidth < 1024) {
        setZoomLevel(1);
        return;
      }
      // Sidebar layout — no topbar. Main padding ~32px top+bottom.
      const availableHeight = window.innerHeight - 64;
      const designHeight = 920;
      const zoom = Math.min(1, availableHeight / designHeight);
      setZoomLevel(Math.max(0.55, zoom)); // never go below 55%
    };
    calculateZoom();
    window.addEventListener('resize', calculateZoom);
    return () => window.removeEventListener('resize', calculateZoom);
  }, []);

  const toggleCard = (card: string) => setExpandedCard(prev => prev === card ? null : card);

  useEffect(() => {
    if (selectedRefueling) {
      setIsEditingRefueling(false);
      setEditForm({ total_cost: selectedRefueling.total_cost, liters: selectedRefueling.liters, current_km: selectedRefueling.current_km });
    }
  }, [selectedRefueling]);

  const handleSaveRefueling = async () => {
    if (!selectedRefueling) return;
    try {
      await api.put(`/vehicles/refuelings/${selectedRefueling.id}`, {
        ...selectedRefueling,
        total_cost: Number(editForm.total_cost),
        liters: Number(editForm.liters),
        current_km: Number(editForm.current_km)
      });
      alert('Abastecimento atualizado com sucesso!');
      const response = await api.get(`/vehicles/${selectedVehicle.id}/refuelings`);
      setRefuelings(response.data);
      setSelectedRefueling(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar');
    }
  };

  const handleDeleteRefueling = async () => {
    if (!selectedRefueling) return;
    if (confirm('Tem certeza que deseja excluir este abastecimento?')) {
      try {
        await api.delete(`/vehicles/refuelings/${selectedRefueling.id}`);
        alert('Abastecimento excluído!');
        const response = await api.get(`/vehicles/${selectedVehicle.id}/refuelings`);
        setRefuelings(response.data);
        setSelectedRefueling(null);
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir');
      }
    }
  };

  const handleSaveRow = async (r: any) => {
    try {
      await api.put(`/vehicles/refuelings/${r.id}`, {
        ...r,
        total_cost: Number(editRowForm.total_cost),
        liters: Number(editRowForm.liters),
        current_km: Number(editRowForm.current_km)
      });
      setEditingRowId(null);
      const response = await api.get(`/vehicles/${selectedVehicle.id}/refuelings`);
      setRefuelings(response.data);
    } catch (err) {
      alert('Erro ao salvar');
    }
  };

  const handleDeleteRow = async (r: any) => {
    if (confirm('Tem certeza que deseja excluir este abastecimento?')) {
      try {
        await api.delete(`/vehicles/refuelings/${r.id}`);
        const response = await api.get(`/vehicles/${selectedVehicle.id}/refuelings`);
        setRefuelings(response.data);
      } catch (err) {
        alert('Erro ao excluir');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, driversRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/drivers')
        ]);
        setVehicles(vehiclesRes.data);
        setDrivers(driversRes.data);
        if (vehiclesRes.data.length > 0) {
          setSelectedVehicle(vehiclesRes.data[0]);
        }
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedVehicle) return;
    
    const fetchRefuelings = async () => {
      try {
        const response = await api.get(`/vehicles/${selectedVehicle.id}/refuelings`);
        const data = response.data;
        setRefuelings(data);
        
        let totalKm = 0;
        let totalLiters = 0;
        
        if (data.length > 1) {
          for (let i = 1; i < data.length; i++) {
            const current = data[i];
            const prev = data[i-1];
            const diffKm = current.current_km - prev.current_km;
            if (diffKm > 0 && current.liters > 0) {
               totalKm += diffKm;
               totalLiters += current.liters;
            }
          }
        }
        
        if (totalLiters > 0 && totalKm > 0) {
          setAverageKml((totalKm / totalLiters).toFixed(1));
        } else {
          setAverageKml('--');
        }
        
      } catch (error) {
        console.error('Failed to load refuelings', error);
      }
    };
    fetchRefuelings();
  }, [selectedVehicle]);

  const refuelingsWithPos = refuelings.filter(r => r.latitude && r.longitude);
  const routePositions: [number, number][] = refuelingsWithPos.map(r => [r.latitude, r.longitude] as [number, number]);

  let bestPriceRefuelingId: number | null = null;
  let minPrice = Infinity;
  refuelingsWithPos.forEach(r => {
    if (r.liters > 0) {
      const price = r.total_cost / r.liters;
      if (price < minPrice) {
        minPrice = price;
        bestPriceRefuelingId = r.id;
      }
    }
  });

  const mapCenter: [number, number] = routePositions.length > 0 
    ? routePositions[routePositions.length - 1] 
    : [ -23.5505, -46.6333 ];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Carregando telemetria...</p>
      </div>
    );
  }

  if (!selectedVehicle) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Truck className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Nenhum Veículo Encontrado</h2>
        <p className="mb-6">Cadastre veículos na aba Frota para visualizar o painel interativo.</p>
        <button onClick={() => window.location.href='/vehicles'} className="bg-slate-900 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:bg-slate-800 transition-colors">
          Ir para Frota
        </button>
      </div>
    );
  }

  const assignedDriver = drivers.find((d: any) => d.id === selectedVehicle.driver_id || d.vehicle_id === selectedVehicle.id);

  const totalSpent = refuelings.reduce((sum, r) => sum + r.total_cost, 0);
  const totalLiters = refuelings.reduce((sum, r) => sum + r.liters, 0);
  const averagePricePerLiter = totalLiters > 0 ? (totalSpent / totalLiters) : 0;

  // Prepare data for the modals
  const dailyBreakdown: Record<string, any[]> = {};
  refuelings.forEach(r => {
    const dayKey = new Date(r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z').toLocaleDateString('pt-BR');
    if (!dailyBreakdown[dayKey]) dailyBreakdown[dayKey] = [];
    dailyBreakdown[dayKey].push(r);
  });

  const sorted = [...refuelings].sort((a, b) => new Date(a.created_at.endsWith('Z') ? a.created_at : a.created_at + 'Z').getTime() - new Date(b.created_at.endsWith('Z') ? b.created_at : b.created_at + 'Z').getTime());
  const historyWithKml = sorted.map((r, i) => {
    let segmentKml = '--';
    if (i > 0) {
      const dist = r.current_km - sorted[i-1].current_km;
      if (dist > 0 && r.liters > 0) segmentKml = (dist / r.liters).toFixed(1);
    }
    return { ...r, segmentKml, isFirst: i === 0 };
  });
  const displayHistory = [...historyWithKml].reverse();
  const chartData = historyWithKml
    .filter(r => !r.isFirst && r.segmentKml !== '--')
    .map(r => {
      const pricePerLiter = r.liters > 0 ? (r.total_cost / r.liters) : 0;
      const kml = parseFloat(r.segmentKml);
      const costPerKm = kml > 0 ? (pricePerLiter / kml) : 0;
      return {
        date: `${new Date(r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z').toLocaleDateString('pt-BR')} às ${new Date(r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z').toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
        kml: kml,
        pricePerLiter: parseFloat(pricePerLiter.toFixed(2)),
        costPerKm: parseFloat(costPerKm.toFixed(2))
      };
    });

  const averageCostPerKm = averageKml !== '--' && averagePricePerLiter > 0 
    ? (averagePricePerLiter / parseFloat(averageKml)).toFixed(2) 
    : '--';

  let statusColors = { 
    costLabel: 'text-amber-500', costValue: 'text-amber-600', costUnit: 'text-amber-500/70',
    effLabel: 'text-slate-400', effValue: 'text-slate-800', effUnit: 'text-slate-400' 
  };

  if (averageKml !== '--' && selectedVehicle?.expected_kml > 0) {
    const ratio = parseFloat(averageKml) / selectedVehicle.expected_kml;
    if (ratio >= 0.95) {
      statusColors = {
        costLabel: 'text-emerald-500', costValue: 'text-emerald-600', costUnit: 'text-emerald-500/70',
        effLabel: 'text-emerald-500', effValue: 'text-emerald-600', effUnit: 'text-emerald-500/70'
      };
    } else if (ratio >= 0.80) {
      statusColors = {
        costLabel: 'text-amber-500', costValue: 'text-amber-600', costUnit: 'text-amber-500/70',
        effLabel: 'text-amber-500', effValue: 'text-amber-600', effUnit: 'text-amber-500/70'
      };
    } else {
      statusColors = {
        costLabel: 'text-rose-500', costValue: 'text-rose-600', costUnit: 'text-rose-500/70',
        effLabel: 'text-rose-500', effValue: 'text-rose-600', effUnit: 'text-rose-500/70'
      };
    }
  }


  return (
    <div className="w-full pb-8 origin-top-left" style={{ zoom: zoomLevel } as any}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[800px]">
        
        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Status Operacional */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/70 backdrop-blur-xl border border-slate-400 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Status Operacional</h3>
              <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"><Share2 className="w-4 h-4" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-400 mb-1">Placa</p>
                <p className="font-semibold text-slate-800">{selectedVehicle.plate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Motorista</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                    <img 
                      src={assignedDriver?.photo_url ? getAssetUrl(assignedDriver.photo_url) : `https://ui-avatars.com/api/?name=${assignedDriver?.name || selectedVehicle.brand}&background=random`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{assignedDriver ? assignedDriver.name : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(() => {
                if (!selectedVehicle?.oil_change_interval_km) {
                  return (
                    <div className="bg-slate-50 border-slate-200 backdrop-blur border rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
                      <Droplets className="w-5 h-5 mb-2 text-slate-400" />
                      <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5 text-slate-500">Óleo</p>
                      <p className="font-bold text-slate-400">N/A</p>
                    </div>
                  );
                }

                let oilLife = 100;
                let bgClass = "bg-emerald-50 border-emerald-100";
                let textClass = "text-emerald-500";
                let labelClass = "text-emerald-600/70";
                let percentClass = "text-emerald-700";
                
                const kmSinceChange = selectedVehicle.current_km - (selectedVehicle.last_oil_change_km || 0);
                const kmRemaining = selectedVehicle.oil_change_interval_km - kmSinceChange;
                const isOverdue = kmRemaining < 0;
                oilLife = Math.max(0, 100 - (kmSinceChange / selectedVehicle.oil_change_interval_km) * 100);

                if (isOverdue) {
                  bgClass = "border-red-600 animate-alert";
                  textClass = "text-white";
                  labelClass = "text-white/90";
                  percentClass = "text-white";
                } else if (oilLife <= 10) {
                  bgClass = "bg-red-50 border-red-200 shadow-red-100";
                  textClass = "text-red-500";
                  labelClass = "text-red-600/70";
                  percentClass = "text-red-700";
                } else if (oilLife <= 30) {
                  bgClass = "bg-amber-50 border-amber-200 shadow-amber-100";
                  textClass = "text-amber-500";
                  labelClass = "text-amber-600/70";
                  percentClass = "text-amber-700";
                } else {
                  bgClass = "bg-emerald-50 border-emerald-200 shadow-emerald-100";
                }

                return (
                  <div className={`${bgClass} backdrop-blur border rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm transition-colors`}>
                    <Droplets className={`w-5 h-5 mb-2 ${textClass}`} />
                    <p className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${labelClass}`}>
                      {isOverdue ? 'Vencido' : 'Restam'}
                    </p>
                    <p className={`font-bold text-sm ${percentClass}`}>
                      {isOverdue ? '+' : ''}{Math.abs(kmRemaining).toLocaleString()} km
                    </p>
                  </div>
                );
              })()}
              <div className="flex flex-col items-center p-3 bg-emerald-50 rounded-2xl">
                <Activity className="w-5 h-5 text-emerald-500 mb-2" />
                <p className="text-xs text-emerald-600">Status</p>
                <p className={`font-bold text-[10px] uppercase ${selectedVehicle.status === 'Ativo' ? 'text-emerald-700' : 'text-orange-600'}`}>{selectedVehicle.status}</p>
              </div>
              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl">
                <Calendar className="w-5 h-5 text-slate-400 mb-2" />
                <p className="text-xs text-slate-400">Ano</p>
                <p className="font-bold text-slate-800 text-xs">{selectedVehicle.year}</p>
              </div>
            </div>
          </motion.div>

          {/* Histórico de Abastecimentos Button */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} 
            onClick={() => setExpandedCard('historico')}
            className="bg-white/70 backdrop-blur-xl border border-slate-400 rounded-2xl p-4 shadow-sm flex-none cursor-pointer active:scale-[0.98] transition-all hover:border-purple-400 group">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Histórico de Abastecimentos</h3>
                  <p className="text-xs text-slate-500 font-medium">{refuelings.length} registros salvos</p>
                </div>
              </div>
              <div className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest group-hover:bg-purple-600 group-hover:text-white transition-colors">
                Ver
              </div>
            </div>
          </motion.div>

          {/* Map Thumbnail */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={isMapExpanded ? "fixed inset-2 md:inset-6 z-[100] bg-white/95 backdrop-blur-xl border border-slate-400 rounded-2xl p-2 shadow-2xl flex flex-col transition-all duration-300" : "bg-white/70 backdrop-blur-xl border border-slate-400 rounded-2xl p-2 shadow-sm flex-1 min-h-[250px] relative overflow-hidden z-0 transition-all duration-300"}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden z-0">
              <MapContainer key={`map-${selectedVehicle?.id}-${routePositions.length}-${isMapExpanded ? 'expanded' : 'normal'}`} center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={true} scrollWheelZoom={true} attributionControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {routePositions.length > 1 && (
                  <Polyline positions={routePositions} color="#8b5cf6" weight={4} opacity={0.8} />
                )}
                {refuelingsWithPos.map((r, idx) => {
                  const pos = [r.latitude, r.longitude] as [number, number];
                  
                  // Group refuelings that happened at this exact location
                  const localRefs = [...refuelings].filter(ref => ref.latitude === pos[0] && ref.longitude === pos[1]).reverse();
                  
                  const isFuelMarker = r.id === bestPriceRefuelingId;
                  const displayRefs = isFuelMarker ? [r] : localRefs;
                  const popupTitle = isFuelMarker ? "Melhor Preço Registrado:" : `Registros neste local (${localRefs.length}):`;
                  
                  const popupContent = (
                    <Popup className="rounded-xl">
                      <div className="flex flex-col gap-2 min-w-[180px] max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1">{popupTitle}</h3>
                        {displayRefs.map(ref => {
                          const isBest = ref.id === bestPriceRefuelingId;
                          const pricePerLiter = ref.liters > 0 ? (ref.total_cost / ref.liters).toFixed(2) : '0.00';
                          return (
                            <div key={ref.id} className={`${isBest ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-100'} p-2 rounded-lg border mb-1 cursor-pointer hover:border-purple-400 transition-colors`} onClick={() => setSelectedRefueling(ref)}>
                              <p className={`text-[10px] font-bold ${isBest ? 'text-amber-700' : 'text-purple-600'} mb-0.5`}>
                                {new Date(ref.created_at.endsWith('Z') ? ref.created_at : ref.created_at + 'Z').toLocaleDateString('pt-BR')} às {new Date(ref.created_at.endsWith('Z') ? ref.created_at : ref.created_at + 'Z').toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </p>
                              <div className="flex justify-between items-center">
                                <p className={`text-xs font-bold ${isBest ? 'text-amber-900' : 'text-slate-700'}`}>R$ {ref.total_cost.toFixed(2)}</p>
                                <p className={`text-[10px] ${isBest ? 'text-amber-700' : 'text-slate-500'}`}>{ref.liters} L</p>
                              </div>
                              <div className="flex justify-between items-center mt-0.5">
                                <p className={`text-[9px] uppercase tracking-wider font-medium ${isBest ? 'text-amber-600/80' : 'text-slate-400'}`}>KM: {ref.current_km.toLocaleString()}</p>
                                <p className={`text-[10px] font-bold ${isBest ? 'text-amber-600 bg-amber-100 px-1 rounded' : 'text-slate-500'}`}>
                                  R$ {pricePerLiter}/L
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Popup>
                  );

                  const markersToRender = [];

                  if (r.id === bestPriceRefuelingId) {
                    const fuelIcon = new L.DivIcon({
                      html: `<div style="background-color: #f59e0b; border: 2px solid white; border-radius: 50%; padding: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; color: white; margin-left: 20px; margin-top: -20px;">
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"></line><line x1="4" y1="9" x2="14" y2="9"></line><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path></svg>
                             </div>`,
                      className: 'custom-fuel-icon',
                      iconSize: [30, 30],
                      iconAnchor: [15, 15],
                    });
                    markersToRender.push(
                      <Marker key={`marker-best-${idx}`} position={pos} icon={fuelIcon} zIndexOffset={90}>
                        {popupContent}
                      </Marker>
                    );
                  }

                  if (idx === refuelingsWithPos.length - 1) {
                    const targetKm = (selectedVehicle?.last_oil_change_km || 0) + (selectedVehicle?.oil_change_interval_km || 0);
                    const threshold = selectedVehicle?.oil_alert_threshold_km ?? 1000;
                    const isUrgent = selectedVehicle?.oil_change_interval_km && selectedVehicle?.current_km >= targetKm;
                    const isNear = selectedVehicle?.oil_change_interval_km && !isUrgent && selectedVehicle?.current_km >= (targetKm - threshold);
                    const recentCount = selectedVehicle?.recent_refuelings_count || 0;
                    
                    markersToRender.push(
                      <Marker key={`marker-vehicle-${idx}`} position={pos} icon={getVehicleIcon(selectedVehicle?.photo_url, recentCount, isUrgent, isNear)} zIndexOffset={100}>
                        {popupContent}
                      </Marker>
                    );
                  }

                  if (idx !== refuelingsWithPos.length - 1 && r.id !== bestPriceRefuelingId) {
                    markersToRender.push(
                      <CircleMarker key={`circle-${idx}`} center={pos} radius={8} fillColor="#8b5cf6" color="#ffffff" weight={2} fillOpacity={1}>
                        {popupContent}
                      </CircleMarker>
                    );
                  }

                  return <Fragment key={`fragment-${idx}`}>{markersToRender}</Fragment>;
                })}
              </MapContainer>
            </div>
            
            <button 
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg border border-slate-200 text-slate-600 hover:text-purple-600 hover:bg-white transition-all focus:outline-none"
              title={isMapExpanded ? "Minimizar Mapa" : "Expandir Mapa"}
            >
              {isMapExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
               {refuelings.length > 0 ? (
                 <div className="bg-purple-600/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg">
                   Último Registro:<br/>
                   {new Date(refuelings[refuelings.length - 1].created_at).toLocaleDateString('pt-BR')} às {new Date(refuelings[refuelings.length - 1].created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                 </div>
               ) : (
                 <div className="bg-slate-600/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg">
                   Sem histórico
                 </div>
               )}
            </div>
            {bestPriceRefuelingId && (
              <div className="absolute bottom-4 right-4 z-10 pointer-events-none flex items-center gap-2 bg-amber-500/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg">
                <Fuel className="w-4 h-4" />
                <span>Melhor Preço/L</span>
              </div>
            )}
          </motion.div>

        </div>
        
        {/* Center / Main Area */}
        <div className="lg:col-span-8 flex flex-col h-full">
          
          {/* Top KPIs */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:items-center lg:justify-between gap-6 px-4 lg:px-10 py-4 mb-4">
            <div className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => toggleCard('historico')}>
              <p className="text-[10px] md:text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Gasto Total (R$)</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                {refuelings.reduce((sum, r) => sum + r.total_cost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] md:text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Distância Percorrida</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                {refuelings.length > 0 ? refuelings[refuelings.length - 1].current_km.toLocaleString() : selectedVehicle.current_km.toLocaleString()} <span className="text-xs md:text-sm text-slate-400">km</span>
              </p>
            </div>
            <div className="text-center col-span-2 md:col-span-1 lg:col-span-auto">
              <p className="text-[10px] md:text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Veículo Atual</p>
              <p className="text-2xl md:text-3xl font-light text-slate-800 tracking-tight uppercase">{selectedVehicle.plate}</p>
            </div>
            <div className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => toggleCard('custo-beneficio')}>
              <p className={`text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1 ${statusColors.costLabel}`}>Custo/km (Média)</p>
              <p className={`text-xl md:text-2xl font-bold ${statusColors.costValue}`}>{averageCostPerKm !== '--' ? `R$ ${averageCostPerKm}` : '--'} <span className={`text-xs md:text-sm ${statusColors.costUnit}`}>/km</span></p>
            </div>
            <div className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => toggleCard('media')}>
              <p className={`text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1 ${statusColors.effLabel}`}>Eficiência (Média)</p>
              <p className={`text-xl md:text-2xl font-bold ${statusColors.effValue}`}>{averageKml} <span className={`text-xs md:text-sm ${statusColors.effUnit}`}>km/L</span></p>
            </div>
            <div className="text-center">
              <p className="text-[10px] md:text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Cap. Tanque</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{selectedVehicle.tank_capacity} <span className="text-xs md:text-sm text-slate-400">L</span></p>
            </div>
          </motion.div>
           
          {/* Truck Image Visualization */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 relative flex flex-col items-center justify-center min-h-[350px] py-4">
            <div className="relative w-full flex items-center justify-center">
              {selectedVehicle.photo_url && (
                <img 
                  src={getAssetUrl(selectedVehicle.photo_url)} 
                  alt="Fleet Truck" 
                  className="w-full max-h-[400px] object-contain drop-shadow-2xl z-10" 
                />
              )}
              
              {/* Badges on main image */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                {(() => {
                  if (!selectedVehicle.oil_change_interval_km) return null;
                  const targetKm = (selectedVehicle.last_oil_change_km || 0) + selectedVehicle.oil_change_interval_km;
                  const threshold = selectedVehicle.oil_alert_threshold_km ?? 1000;
                  const isUrgent = selectedVehicle.current_km >= targetKm;
                  const isNear = !isUrgent && selectedVehicle.current_km >= (targetKm - threshold);
                  
                  if (isUrgent) {
                    return <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-white flex items-center gap-2 animate-pulse"><Droplets className="w-4 h-4"/> Óleo Vencido</div>;
                  } else if (isNear) {
                    return <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-white flex items-center gap-2"><Droplets className="w-4 h-4"/> Troca de Óleo Próxima</div>;
                  }
                  return null;
                })()}
                
                {selectedVehicle.recent_refuelings_count > 0 && (
                  <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-white flex items-center gap-2">
                    <Fuel className="w-4 h-4"/>
                    {selectedVehicle.recent_refuelings_count} Abastecimento{selectedVehicle.recent_refuelings_count > 1 ? 's' : ''} Hoje
                  </div>
                )}
              </div>
            </div>
             
             {/* Floor Shadow / Track */}
             <div className="w-2/3 h-2 bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-4 rounded-full"></div>
          </motion.div>
           
          {/* Bottom Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            
            {/* Gasto Financeiro (Total) */}
            <motion.div onClick={() => toggleCard('gasto')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl border border-slate-400 rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.97] transition-all hover:border-emerald-300">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Gasto Financeiro (Total)</h3>
                <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"><Share2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Gasto Total</p>
                  <p className="font-bold text-lg text-emerald-600">R$ {totalSpent.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Preço Médio/Litro</p>
                  <p className="font-semibold text-slate-800">R$ {averagePricePerLiter.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Último Gasto</p>
                  <p className="font-semibold text-slate-800">
                    {refuelings.length > 0 ? `R$ ${refuelings[refuelings.length - 1].total_cost.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Desempenho Energético Dinâmico */}
            {(() => {
              let cardColors = "bg-white/70 backdrop-blur-xl border border-slate-200 hover:border-purple-200";
              let iconBg = "bg-slate-100";
              let iconText = "text-slate-500";
              let valueText = "text-purple-600";
              let labelText = "text-slate-800";
              let secondaryText = "text-slate-500";
              
              if (averageKml !== '--' && selectedVehicle.expected_kml > 0) {
                const avg = parseFloat(averageKml);
                const target = selectedVehicle.expected_kml;
                
                if (avg >= target * 1.05) { // Ótimo (Azul)
                  cardColors = "bg-blue-100/90 backdrop-blur-xl border border-blue-500 hover:border-blue-500 shadow-blue-200";
                  iconBg = "bg-blue-200";
                  iconText = "text-blue-700";
                  valueText = "text-blue-700";
                  labelText = "text-blue-900";
                  secondaryText = "text-blue-600/80";
                } else if (avg >= target) { // Bom (Verde)
                  cardColors = "bg-emerald-100/90 backdrop-blur-xl border border-emerald-500 hover:border-emerald-500 shadow-emerald-200";
                  iconBg = "bg-emerald-200";
                  iconText = "text-emerald-700";
                  valueText = "text-emerald-700";
                  labelText = "text-emerald-900";
                  secondaryText = "text-emerald-600/80";
                } else { // Ruim (Vermelho)
                  cardColors = "bg-red-100/90 backdrop-blur-xl border border-red-500 hover:border-red-500 shadow-red-200";
                  iconBg = "bg-red-200";
                  iconText = "text-red-700";
                  valueText = "text-red-700";
                  labelText = "text-red-900";
                  secondaryText = "text-red-600/80";
                }
              }

              return (
                <motion.div onClick={() => toggleCard('media')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${cardColors} rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.97] transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className={`text-lg font-semibold ${labelText}`}>Desempenho Geral</h3>
                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${iconBg} ${iconText} hover:opacity-80`}><Share2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                      <p className={`text-xs mb-1 font-medium ${secondaryText}`}>Média do Veículo</p>
                      <p className={`font-bold text-lg ${valueText}`}>
                        {averageKml !== '--' ? `${averageKml} km/L` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 font-medium ${secondaryText}`}>Especificação (Fábrica)</p>
                      <p className={`font-semibold ${labelText}`}>
                        {selectedVehicle.expected_kml > 0 ? `${selectedVehicle.expected_kml} km/L` : 'N/A'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className={`text-xs mb-1 font-medium ${secondaryText}`}>Desvio da Meta</p>
                      {(() => {
                        if (averageKml === '--' || !selectedVehicle.expected_kml) {
                          return <div className="text-sm font-medium opacity-60">N/A</div>;
                        }
                        const avg = parseFloat(averageKml);
                        const diff = ((avg - selectedVehicle.expected_kml) / selectedVehicle.expected_kml) * 100;
                        if (diff >= 0) {
                          return <div className="inline-flex items-center gap-1 bg-white/70 text-emerald-700 border border-emerald-200/50 px-3 py-1 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm"><TrendingUp className="w-4 h-4" /> +{diff.toFixed(1)}% Econômico</div>;
                        } else {
                          return <div className="inline-flex items-center gap-1 bg-white/70 text-red-700 border border-red-200/50 px-3 py-1 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm"><TrendingUp className="w-4 h-4 rotate-180" /> {Math.abs(diff).toFixed(1)}% Gasto a mais</div>;
                        }
                      })()}
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Volume de Combustível */}
            <motion.div onClick={() => toggleCard('litros')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/70 backdrop-blur-xl border border-slate-400 rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.97] transition-all hover:border-blue-300">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Volume de Combustível (Total)</h3>
                <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"><Share2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Litros Abastecidos</p>
                  <p className="font-bold text-lg text-blue-600">{totalLiters.toFixed(1)} L</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Abastecimentos</p>
                  <p className="font-semibold text-slate-800">{refuelings.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Odômetro Atual</p>
                  <p className="font-semibold text-slate-800">
                    {refuelings.length > 0 ? refuelings[refuelings.length - 1].current_km.toLocaleString() : selectedVehicle.current_km.toLocaleString()} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Capacidade (Tanque)</p>
                  <p className="font-semibold text-slate-800">{selectedVehicle.tank_capacity} L</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Selector Column */}
        <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center h-full pb-32 relative gap-4">
           <div className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-full p-1.5 shadow-sm flex flex-col items-center justify-center gap-2">
             <button 
               onClick={() => setSelectorMode('vehicles')} 
               className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectorMode === 'vehicles' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
               title="Ver Veículos"
             >
               <Truck className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setSelectorMode('drivers')} 
               className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectorMode === 'drivers' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
               title="Ver Motoristas"
             >
               <User className="w-5 h-5" />
             </button>
           </div>

           <motion.div 
             initial={{ opacity: 0, x: 20 }} 
             animate={{ opacity: 1, x: 0 }} 
             className="bg-white/50 backdrop-blur-md border border-slate-200 p-3 shadow-md flex flex-col gap-3 rounded-[40px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
             style={{ maxHeight: '70vh' }}
           >
             {selectorMode === 'vehicles' ? (
               [...vehicles].sort((a, b) => {
                 const aRef = a.recent_refuelings_count || 0;
                 const bRef = b.recent_refuelings_count || 0;
                 const diff = bRef - aRef;
                 return diff !== 0 ? diff : (a.plate || '').localeCompare(b.plate || '');
               }).map((vehicle) => (
                 <div key={`v-${vehicle.id}`} className="relative cursor-pointer group" onClick={() => setSelectedVehicle(vehicle)} title={vehicle.plate}>
                   <div 
                     className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center transition-all ${selectedVehicle?.id === vehicle.id ? 'bg-white shadow-md border-2 border-purple-500' : 'bg-transparent group-hover:bg-white/80'} overflow-hidden`}
                   >
                     {vehicle.photo_url ? (
                       <img src={getAssetUrl(vehicle.photo_url)} alt={vehicle.plate} className="w-full h-full object-cover" />
                     ) : (
                       <Truck className="w-8 h-8 text-slate-400" />
                     )}
                   </div>
                   
                   <div className="absolute top-0 right-0 flex flex-col gap-1 z-10 items-end pointer-events-none">
                      {/* Oil Status Badge */}
                      {(() => {
                        if (!vehicle.oil_change_interval_km) return null;
                        const targetKm = (vehicle.last_oil_change_km || 0) + vehicle.oil_change_interval_km;
                        const threshold = vehicle.oil_alert_threshold_km ?? 1000;
                        const isUrgent = vehicle.current_km >= targetKm;
                        const isNear = !isUrgent && vehicle.current_km >= (targetKm - threshold);
                        
                        if (isUrgent) {
                          return <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm" title="Óleo Vencido!"></div>;
                        } else if (isNear) {
                          return <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-sm" title="Troca de óleo próxima"></div>;
                        }
                        return null;
                      })()}
                      
                      {/* Refueling Badge */}
                      {vehicle.recent_refuelings_count > 0 && (
                        <div className="bg-blue-500 text-white text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm" title={`${vehicle.recent_refuelings_count} abastecimento(s) nas últimas 24h`}>
                          {vehicle.recent_refuelings_count}
                        </div>
                      )}
                   </div>
                 </div>
               ))
             ) : (
               drivers.map((driver) => {
                 const linkedVehicle = vehicles.find(v => v.driver_id === driver.id || driver.vehicle_id === v.id);
                 if (!linkedVehicle) return null;
                 return (
                   <div 
                     key={`d-${driver.id}`} 
                     onClick={() => setSelectedVehicle(linkedVehicle)}
                     className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-all ${selectedVehicle?.id === linkedVehicle.id ? 'bg-white shadow-md border-2 border-indigo-500' : 'bg-transparent hover:bg-white/80'} overflow-hidden`}
                     title={`${driver.name} (${linkedVehicle.plate})`}
                   >
                     {driver.photo_url ? (
                       <img src={getAssetUrl(driver.photo_url)} alt={driver.name} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                         <span className="text-indigo-800 font-bold text-xl uppercase">{driver.name.charAt(0)}</span>
                       </div>
                     )}
                   </div>
                 );
               })
             )}
           </motion.div>
        </div>

      {/* History Popup Modals */}
      <AnimatePresence>
        {(expandedCard || selectedRefueling) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { setExpandedCard(null); setSelectedRefueling(null); }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-2 md:inset-10 bg-white rounded-3xl z-50 flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Handle bar */}
              <div className="w-full flex justify-center pt-3 pb-2" onClick={() => { setExpandedCard(null); setSelectedRefueling(null); }}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              </div>

              
              {expandedCard === 'historico' && (
                <>
                  <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Histórico Completo</h2>
                      <p className="text-sm text-slate-500">Todos os registros do veículo</p>
                    </div>
                    <button onClick={() => setExpandedCard(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  
                  {/* Filtros de Data */}
                  <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">De</label>
                      <input type="date" value={historyStartDate} onChange={e => setHistoryStartDate(e.target.value)} className="w-full text-xs p-2 bg-white rounded-lg border border-slate-200 outline-none focus:border-purple-400 font-medium" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Até</label>
                      <input type="date" value={historyEndDate} onChange={e => setHistoryEndDate(e.target.value)} className="w-full text-xs p-2 bg-white rounded-lg border border-slate-200 outline-none focus:border-purple-400 font-medium" />
                    </div>
                    {(historyStartDate || historyEndDate) && (
                      <button onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); }} className="mt-4 text-xs font-bold text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                        Limpar
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-auto bg-slate-50 relative">
                     <table className="w-full text-left border-collapse min-w-[900px]">
                       <thead className="sticky top-0 bg-white shadow-sm z-10">
                         <tr>
                           <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Data e Hora</th>
                           <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 text-right">Odômetro (KM)</th>
                           <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 text-right">Litros</th>
                           <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 text-right">Preço / Litro</th>
                           <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 text-right">Valor Total</th>
                           <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 text-center">Ações</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200">
                         {(() => {
                           const filteredRefuelings = refuelings.filter(r => {
                             if (!historyStartDate && !historyEndDate) return true;
                             const safeDateStr = r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z';
                             const localDate = new Date(safeDateStr);
                             const rDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                             if (historyStartDate && rDate < historyStartDate) return false;
                             if (historyEndDate && rDate > historyEndDate) return false;
                             return true;
                           });

                           if (filteredRefuelings.length === 0) {
                             return (
                               <tr>
                                 <td colSpan={6} className="py-12 text-center bg-white">
                                   <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                   <p className="text-slate-500 font-medium">Nenhum registro encontrado para este filtro.</p>
                                 </td>
                               </tr>
                             );
                           }

                           return [...filteredRefuelings].reverse().map((r, idx) => {
                             const isEditing = editingRowId === r.id;
                             
                             return (
                               <tr key={r.id} className="bg-white hover:bg-purple-50/30 transition-colors group">
                                 <td className="py-4 px-6">
                                   <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                                       <Calendar className="w-4 h-4 text-purple-600" />
                                     </div>
                                     <div className="flex flex-col">
                                       <span className="font-bold text-slate-800 text-sm">{new Date(r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z').toLocaleDateString('pt-BR')}</span>
                                       <span className="text-[11px] text-slate-400 font-medium">{new Date(r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z').toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                     </div>
                                   </div>
                                 </td>
                                 <td className="py-4 px-6 text-right">
                                   {isEditing ? (
                                     <input type="number" value={editRowForm.current_km} onChange={e => setEditRowForm({...editRowForm, current_km: parseInt(e.target.value) || 0})} className="w-24 text-right p-1.5 bg-slate-50 border border-slate-300 rounded focus:border-purple-500 outline-none text-sm font-bold shadow-inner" />
                                   ) : (
                                     <span className="font-semibold text-slate-700">{r.current_km.toLocaleString()} <span className="text-xs text-slate-400 font-normal">km</span></span>
                                   )}
                                 </td>
                                 <td className="py-4 px-6 text-right">
                                   {isEditing ? (
                                     <input type="number" step="0.1" value={editRowForm.liters} onChange={e => setEditRowForm({...editRowForm, liters: parseFloat(e.target.value) || 0})} className="w-20 text-right p-1.5 bg-slate-50 border border-slate-300 rounded focus:border-purple-500 outline-none text-sm font-bold shadow-inner" />
                                   ) : (
                                     <span className="font-semibold text-slate-700">{r.liters} <span className="text-xs text-slate-400 font-normal">L</span></span>
                                   )}
                                 </td>
                                 <td className="py-4 px-6 text-right font-medium text-slate-500">
                                   R$ {r.liters > 0 ? (r.total_cost / r.liters).toFixed(2) : '0.00'}
                                 </td>
                                 <td className="py-4 px-6 text-right">
                                   {isEditing ? (
                                     <input type="number" step="0.01" value={editRowForm.total_cost} onChange={e => setEditRowForm({...editRowForm, total_cost: parseFloat(e.target.value) || 0})} className="w-24 text-right p-1.5 bg-slate-50 border border-slate-300 rounded focus:border-purple-500 outline-none text-sm font-bold shadow-inner" />
                                   ) : (
                                     <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">R$ {r.total_cost.toFixed(2)}</span>
                                   )}
                                 </td>
                                 <td className="py-4 px-6 text-center">
                                   <div className="flex items-center justify-center gap-2">
                                     {isEditing ? (
                                       <>
                                         <button onClick={() => setEditingRowId(null)} className="px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-wider">Cancelar</button>
                                         <button onClick={() => handleSaveRow(r)} className="px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow uppercase tracking-wider">Salvar</button>
                                       </>
                                     ) : (
                                       <>
                                         <button 
                                           onClick={(e) => { e.stopPropagation(); setEditingRowId(r.id); setEditRowForm({ total_cost: r.total_cost, liters: r.liters, current_km: r.current_km }); }} 
                                           className="px-3 py-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wider opacity-0 group-hover:opacity-100 focus:opacity-100"
                                         >
                                           Editar
                                         </button>
                                         <button 
                                           onClick={(e) => { e.stopPropagation(); handleDeleteRow(r); }} 
                                           className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors uppercase tracking-wider opacity-0 group-hover:opacity-100 focus:opacity-100"
                                         >
                                           Excluir
                                         </button>
                                       </>
                                     )}
                                   </div>
                                 </td>
                               </tr>
                             );
                           });
                         })()}
                       </tbody>
                     </table>
                   </div>
                </>
              )}
              {expandedCard === 'custo-beneficio' && (
                <>
                  <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Custo-Benefício</h2>
                      <p className="text-sm text-slate-500">Relação entre Preço do Combustível e Eficiência (km/L)</p>
                    </div>
                    <button onClick={() => { setExpandedCard(null); setSelectedRefueling(null); }} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-2 pb-12">
                    
                    {chartData.length > 0 && (
                      <div className="bg-amber-50/50 rounded-2xl p-4 pt-5 mb-6 border border-amber-100 relative">
                        <h3 className="text-[10px] text-amber-600 font-bold uppercase tracking-widest absolute top-3 left-4">Evolução do Custo</h3>
                        <div className="h-64 w-full -ml-3 mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" hide />
                              
                              <YAxis yAxisId="left" domain={['auto', 'auto']} hide />
                              <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} hide />
                              
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fffbeb' }}
                                labelStyle={{ fontWeight: 'bold', color: '#b45309', fontSize: '10px', textTransform: 'uppercase' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '14px' }}
                                formatter={(value: any, name: any) => {
                                  if (name === 'kml') return [`${Number(value).toFixed(1)} km/L`, 'Eficiência'];
                                  if (name === 'pricePerLiter') return [`R$ ${Number(value).toFixed(2)}/L`, 'Preço Combustível'];
                                  if (name === 'costPerKm') return [`R$ ${Number(value).toFixed(2)}/km`, 'Custo Real'];
                                  return [value, name];
                                }}
                              />
                              
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                              
                              <Bar yAxisId="right" dataKey="pricePerLiter" name="Preço Combustível (R$/L)" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={20} />
                              <Line yAxisId="left" type="monotone" dataKey="kml" name="Eficiência (km/L)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                              
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 mb-2">Entendendo a Análise</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Este gráfico cruza o <strong>Preço do Combustível</strong> pago (barras amarelas) com a <strong>Eficiência</strong> do veículo (linha azul). 
                        Observe que às vezes, mesmo pagando mais barato pelo litro, a eficiência (km/L) pode cair drasticamente dependendo da qualidade do combustível, 
                        o que resulta em um <strong>Custo Real por KM</strong> maior. No painel principal, você vê a média exata desse custo em reais.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {expandedCard === 'media' && (
                <>
                  <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Histórico de Consumo</h2>
                      <p className="text-sm text-slate-500">Evolução do veículo</p>
                    </div>
                    <button onClick={() => { setExpandedCard(null); setSelectedRefueling(null); }} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-2 pb-12">
                    
                    {chartData.length > 0 && (
                      <div className="bg-purple-50/50 rounded-2xl p-4 pt-5 mb-6 border border-purple-100 relative">
                        <h3 className="text-[10px] text-purple-600 font-bold uppercase tracking-widest absolute top-3 left-4">Evolução do Consumo</h3>
                        <div className="h-48 w-full -ml-3 mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorKmlStroke" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" />
                                  <stop offset="50%" stopColor="#22c55e" />
                                  <stop offset="100%" stopColor="#ef4444" />
                                </linearGradient>
                                <linearGradient id="colorKmlFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                  <stop offset="50%" stopColor="#22c55e" stopOpacity={0.2}/>
                                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" hide />
                              <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}
                                itemStyle={{ color: '#334155', fontWeight: 'bold', fontSize: '14px' }}
                                formatter={(value) => [`${Number(value).toFixed(1)} km/L`, 'Média']}
                              />
                              {selectedVehicle?.expected_kml > 0 && (
                                <ReferenceLine 
                                  y={selectedVehicle.expected_kml} 
                                  stroke="#10b981" 
                                  strokeDasharray="4 4" 
                                  label={{ position: 'top', value: `Fábrica: ${selectedVehicle.expected_kml} km/L`, fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} 
                                />
                              )}
                              <Area 
                                type="monotone" 
                                dataKey="kml" 
                                stroke="url(#colorKmlStroke)" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorKmlFill)" 
                                dot={{ fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 2, r: 3.5 }}
                                activeDot={{ r: 6, fill: '#334155', stroke: '#ffffff', strokeWidth: 2 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {displayHistory.map((r, idx) => (
                      <div key={r.id} className="flex flex-col py-2 px-3 bg-slate-50 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors" onClick={() => setSelectedRefueling(r)}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3 h-3 text-purple-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z').toLocaleDateString('pt-BR')} às {new Date(r.created_at.endsWith('Z') ? r.created_at : r.created_at + 'Z').toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          {!r.isFirst ? (
                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 shadow-sm">{r.segmentKml} km/L</span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md uppercase tracking-widest shadow-sm">Marco Inicial</span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-200/60">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Odômetro</span>
                              <span className="font-bold text-slate-800 text-xs">{r.current_km.toLocaleString()} km</span>
                            </div>
                            <div className="flex flex-col text-center">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Preço/L</span>
                              <span className="font-bold text-slate-800 text-xs">R$ {r.liters > 0 ? (r.total_cost / r.liters).toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Abastecido</span>
                              <span className="font-bold text-slate-800 text-xs">{r.liters} L</span>
                            </div>
                        </div>
                      </div>
                    ))}
                    {displayHistory.length === 0 && (
                      <div className="text-center py-10">
                        <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhum registro de consumo.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {expandedCard === 'gasto' && (
                <>
                  <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Gastos Diários</h2>
                      <p className="text-sm text-slate-500">Visão consolidada</p>
                    </div>
                    <button onClick={() => { setExpandedCard(null); setSelectedRefueling(null); }} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-12">
                    {Object.keys(dailyBreakdown).length === 0 ? (
                      <div className="text-center py-10">
                        <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhum gasto registrado.</p>
                      </div>
                    ) : (
                      Object.entries(dailyBreakdown).reverse().map(([day, entries]) => {
                        const dayTotal = entries.reduce((s, e) => s + e.total_cost, 0);
                        return (
                          <div key={day} className="flex justify-between items-center py-3 px-4 bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-emerald-700" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{day}</p>
                                {entries.length > 1 && <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">{entries.length} abastecimentos</span>}
                              </div>
                            </div>
                            <span className="text-lg font-bold text-emerald-700">R$ {dayTotal.toFixed(2)}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {expandedCard === 'litros' && (
                <>
                  <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Litros por Dia</h2>
                      <p className="text-sm text-slate-500">Visão consolidada</p>
                    </div>
                    <button onClick={() => { setExpandedCard(null); setSelectedRefueling(null); }} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-12">
                    {Object.keys(dailyBreakdown).length === 0 ? (
                      <div className="text-center py-10">
                        <Droplets className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhum abastecimento registrado.</p>
                      </div>
                    ) : (
                      Object.entries(dailyBreakdown).reverse().map(([day, entries]) => {
                        const dayLiters = entries.reduce((s, e) => s + e.liters, 0);
                        return (
                          <div key={day} className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-2xl shadow-sm border border-blue-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-700" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{day}</p>
                                {entries.length > 1 && <span className="text-[10px] font-bold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{entries.length} abastecimentos</span>}
                              </div>
                            </div>
                            <span className="text-lg font-bold text-blue-700">{dayLiters.toFixed(1)} L</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {selectedRefueling && (
                <>
                  <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Detalhes do Abastecimento</h2>
                      <p className="text-sm text-slate-500">
                        {new Date(selectedRefueling.created_at.endsWith('Z') ? selectedRefueling.created_at : selectedRefueling.created_at + 'Z').toLocaleDateString('pt-BR')} às {new Date(selectedRefueling.created_at.endsWith('Z') ? selectedRefueling.created_at : selectedRefueling.created_at + 'Z').toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditingRefueling && (
                        <>
                          <button onClick={() => setIsEditingRefueling(true)} className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">Editar</button>
                          <button onClick={handleDeleteRefueling} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Excluir</button>
                        </>
                      )}
                      <button onClick={() => setSelectedRefueling(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-12">
                    {isEditingRefueling ? (
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col gap-4 shadow-inner">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Total (R$)</label>
                            <input type="number" step="0.01" value={editForm.total_cost} onChange={e => setEditForm({...editForm, total_cost: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-white rounded-lg border border-slate-200 outline-none focus:border-purple-400 font-bold" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Litros (L)</label>
                            <input type="number" step="0.1" value={editForm.liters} onChange={e => setEditForm({...editForm, liters: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-white rounded-lg border border-slate-200 outline-none focus:border-purple-400 font-bold" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Odômetro (KM)</label>
                            <input type="number" value={editForm.current_km} onChange={e => setEditForm({...editForm, current_km: parseInt(e.target.value) || 0})} className="w-full p-2 bg-white rounded-lg border border-slate-200 outline-none focus:border-purple-400 font-bold" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setIsEditingRefueling(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                          <button onClick={handleSaveRefueling} className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg transition-colors">Salvar Alterações</button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Valor Total</p>
                          <p className="text-2xl font-bold text-emerald-700">R$ {selectedRefueling.total_cost.toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">Litros</p>
                          <p className="text-2xl font-bold text-blue-700">{selectedRefueling.liters} L</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Preço / Litro</p>
                          <p className="text-xl font-bold text-slate-800">R$ {selectedRefueling.liters > 0 ? (selectedRefueling.total_cost / selectedRefueling.liters).toFixed(2) : '0.00'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Odômetro</p>
                          <p className="text-xl font-bold text-slate-800">{selectedRefueling.current_km.toLocaleString()} km</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-3 shadow-sm">
                       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                         <MapPin className="w-5 h-5 text-slate-400" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-800">Localização GPS</p>
                         <p className="text-sm font-medium text-slate-500">{selectedRefueling.latitude && selectedRefueling.longitude ? `${selectedRefueling.latitude.toFixed(5)}, ${selectedRefueling.longitude.toFixed(5)}` : 'Não registrada no momento'}</p>
                       </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

        
      </div>
    </div>
  );
}
