import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api, { getAssetUrl } from '@/services/api';
import { Fuel, AlertTriangle, CheckCircle, ChevronDown, Calendar, Droplets, Wallet, TrendingUp, X } from 'lucide-react';
import RefuelingModal from '../../components/driver/RefuelingModal';

export default function DriverDashboard() {
  const [driverData, setDriverData] = useState<any>(null);
  const [refuelings, setRefuelings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefuelingOpen, setIsRefuelingOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (card: string) => setExpandedCard(prev => prev === card ? null : card);

  const fetchDriverData = async () => {
    try {
      const [driverRes, refRes] = await Promise.all([
        api.get('/driver/me'),
        api.get('/driver/refuelings')
      ]);
      setDriverData(driverRes.data);
      setRefuelings(refRes.data);
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();

    const handleOpenRefueling = () => setIsRefuelingOpen(true);
    window.addEventListener('open-refueling', handleOpenRefueling);
    return () => window.removeEventListener('open-refueling', handleOpenRefueling);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!driverData?.vehicle) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhum Veículo</h2>
        <p className="text-slate-500">Você não possui um veículo alocado. Entre em contato com o gestor da frota.</p>
      </div>
    );
  }

  const vehicle = driverData.vehicle;

  // Calculate Statistics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter refuelings for the current month
  const monthlyRefuelings = refuelings.filter(r => {
    const d = new Date(r.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlySpent = monthlyRefuelings.reduce((sum, r) => sum + r.total_cost, 0);
  const monthlyLiters = monthlyRefuelings.reduce((sum, r) => sum + r.liters, 0);

  // Group monthly refuelings by day for the detail breakdown
  const dailyBreakdown: Record<string, any[]> = {};
  monthlyRefuelings.forEach(r => {
    const dayKey = new Date(r.created_at).toLocaleDateString('pt-BR');
    if (!dailyBreakdown[dayKey]) dailyBreakdown[dayKey] = [];
    dailyBreakdown[dayKey].push(r);
  });

  // Calculate overall KM/L
  // Requires at least 2 refuelings to calculate a realistic distance
  let averageKml = '--';
  const sorted = [...refuelings].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  const historyWithKml = sorted.map((r, i) => {
    let segmentKml = '--';
    if (i > 0) {
      const dist = r.current_km - sorted[i-1].current_km;
      if (dist > 0 && r.liters > 0) segmentKml = (dist / r.liters).toFixed(1);
    }
    return { ...r, segmentKml, isFirst: i === 0 };
  });
  
  const displayHistory = [...historyWithKml].reverse();
  
  // Prepare data for the chart (chronological, skipping the first item)
  const chartData = historyWithKml
    .filter(r => !r.isFirst && r.segmentKml !== '--')
    .map(r => ({
      date: `${new Date(r.created_at).toLocaleDateString('pt-BR')} às ${new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
      kml: parseFloat(r.segmentKml)
    }));

  if (refuelings.length >= 2) {
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    
    const distance = newest.current_km - oldest.current_km;
    // We sum all liters except the FIRST one (which was used to fill the tank initially for the first distance)
    const consumedLiters = sorted.slice(1).reduce((sum, r) => sum + r.liters, 0);
    
    if (distance > 0 && consumedLiters > 0) {
      averageKml = (distance / consumedLiters).toFixed(1);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Vehicle Info Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{vehicle.model}</h2>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{vehicle.plate}</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {vehicle.status}
          </div>
        </div>

          <div className="w-16 h-16 rounded-full bg-slate-200 border-4 border-white shadow-md overflow-hidden flex-shrink-0 z-10 relative">
            <img 
              src={vehicle.photo_url ? getAssetUrl(vehicle.photo_url) : "/truck-render.png"} 
              alt={vehicle.plate} 
              className="w-full h-full object-cover"
            />
          </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Odômetro</p>
            </div>
            <p className="text-lg font-bold text-slate-800">{vehicle.current_km.toLocaleString()} <span className="text-xs font-normal text-slate-400">km</span></p>
          </div>
          {(() => {
            let cardColors = "bg-purple-50 border-purple-100 hover:border-purple-300";
            let iconBg = "bg-purple-200";
            let iconText = "text-purple-600";
            let valueText = "text-purple-900";
            let unitText = "text-purple-400";
            let actionText = "text-purple-500";
            let badgeColors = "bg-purple-100 text-purple-700";
            let statusLabel = "";

            if (vehicle?.expected_kml > 0 && averageKml !== '--') {
              const avg = parseFloat(averageKml);
              const target = vehicle.expected_kml;
              
              if (avg >= target * 1.05) { // 5% better than factory -> Ótimo
                cardColors = "bg-blue-50 border-blue-100 hover:border-blue-300";
                iconBg = "bg-blue-200";
                iconText = "text-blue-600";
                valueText = "text-blue-900";
                unitText = "text-blue-400";
                actionText = "text-blue-500";
                badgeColors = "bg-blue-100 text-blue-700";
                statusLabel = "Ótimo";
              } else if (avg >= target) { // Met target -> Bom
                cardColors = "bg-emerald-50 border-emerald-100 hover:border-emerald-300";
                iconBg = "bg-emerald-200";
                iconText = "text-emerald-600";
                valueText = "text-emerald-900";
                unitText = "text-emerald-400";
                actionText = "text-emerald-500";
                badgeColors = "bg-emerald-100 text-emerald-700";
                statusLabel = "Bom";
              } else { // Below target -> Ruim
                cardColors = "bg-red-50 border-red-100 hover:border-red-300";
                iconBg = "bg-red-200";
                iconText = "text-red-600";
                valueText = "text-red-900";
                unitText = "text-red-400";
                actionText = "text-red-500";
                badgeColors = "bg-red-100 text-red-700";
                statusLabel = "Abaixo da Média";
              }
            }

            return (
              <div 
                onClick={() => toggleCard('media')}
                className={`rounded-2xl p-4 flex flex-col justify-center border cursor-pointer active:scale-[0.97] transition-all ${cardColors}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${iconBg}`}>
                      <TrendingUp className={`w-3 h-3 ${iconText}`} />
                    </div>
                    <p className={`text-xs font-medium uppercase tracking-wider ${iconText}`}>Média (Geral)</p>
                  </div>
                </div>
                
                <div className="flex items-end justify-between">
                  <p className={`text-lg font-bold ${valueText}`}>{averageKml} <span className={`text-xs font-normal ${unitText}`}>km/L</span></p>
                  
                  {statusLabel && (
                    <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badgeColors}`}>
                      {statusLabel}
                    </div>
                  )}
                </div>
                
                <p className={`text-[10px] mt-1 flex items-center gap-1 opacity-80 ${actionText}`}>Ver Histórico <ChevronDown className="w-3 h-3 -rotate-90" /></p>
              </div>
            );
          })()}
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div 
            onClick={() => toggleCard('gasto')}
            className="bg-slate-50 rounded-2xl p-3 px-4 border border-slate-100 cursor-pointer active:scale-[0.97] transition-all hover:border-emerald-200"
          >
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Gasto (Mês)
              </p>
            </div>
            <p className="text-base font-bold text-emerald-600">R$ {monthlySpent.toFixed(2)}</p>
            <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 opacity-80">Ver Detalhes <ChevronDown className="w-3 h-3 -rotate-90" /></p>
          </div>
          <div 
            onClick={() => toggleCard('litros')}
            className="bg-slate-50 rounded-2xl p-3 px-4 border border-slate-100 cursor-pointer active:scale-[0.97] transition-all hover:border-blue-200"
          >
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest flex items-center gap-1">
                <Droplets className="w-3 h-3" /> Litros (Mês)
              </p>
            </div>
            <p className="text-base font-bold text-slate-800">{monthlyLiters.toFixed(1)} <span className="text-xs font-normal text-slate-400">L</span></p>
            <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 opacity-80">Ver Detalhes <ChevronDown className="w-3 h-3 -rotate-90" /></p>
          </div>
        </div>


      </motion.div>

      {/* Main Action Button */}
      <motion.button 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: 0.1 }}
        onClick={() => setIsRefuelingOpen(true)}
        className="w-full bg-slate-900 text-white rounded-3xl p-6 flex items-center justify-between shadow-xl shadow-slate-900/20 active:scale-95 transition-transform mb-24"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
            <Fuel className="w-7 h-7 text-purple-300" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold">Abastecimento</h3>
            <p className="text-slate-300 text-sm">Registrar litros e valor</p>
          </div>
        </div>
      </motion.button>

      {/* Refueling Modal */}
      <RefuelingModal 
        isOpen={isRefuelingOpen} 
        onClose={() => setIsRefuelingOpen(false)} 
        onSuccess={() => {
          setIsRefuelingOpen(false);
          fetchDriverData(); // Refresh to get new KM
        }} 
        currentKm={vehicle.current_km}
      />

      {/* History Popup Modals */}
      <AnimatePresence>
        {expandedCard && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setExpandedCard(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, y: '100%' }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl z-[100] flex flex-col shadow-2xl pb-safe"
            >
              {/* Handle bar */}
              <div className="w-full flex justify-center pt-3 pb-2" onClick={() => setExpandedCard(null)}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              </div>

              {expandedCard === 'media' && (
                <>
                  <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Histórico de Consumo</h2>
                      <p className="text-sm text-slate-500">Do mais recente ao mais antigo</p>
                    </div>
                    <button onClick={() => setExpandedCard(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-12">
                    
                    {chartData.length > 0 && (
                      <div className="bg-purple-50/50 rounded-2xl p-4 pt-5 mb-6 border border-purple-100 relative">
                        <h3 className="text-[10px] text-purple-600 font-bold uppercase tracking-widest absolute top-3 left-4">Evolução do Consumo</h3>
                        <div className="h-32 w-full -ml-3 mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorKmlStroke" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" /> {/* Azul = Ótimo */}
                                  <stop offset="50%" stopColor="#22c55e" /> {/* Verde = Bom */}
                                  <stop offset="100%" stopColor="#ef4444" /> {/* Vermelho = Ruim */}
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
                                formatter={(value: number) => [`${value.toFixed(1)} km/L`, 'Média']}
                              />
                              {vehicle?.expected_kml > 0 && (
                                <ReferenceLine 
                                  y={vehicle.expected_kml} 
                                  stroke="#10b981" 
                                  strokeDasharray="4 4" 
                                  label={{ position: 'top', value: `Fábrica: ${vehicle.expected_kml} km/L`, fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} 
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
                      <div key={r.id} className="flex flex-col py-3 px-4 bg-slate-50 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">{new Date(r.created_at).toLocaleDateString('pt-BR')} às {new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          {!r.isFirst ? (
                            <span className="text-sm font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200 shadow-sm">{r.segmentKml} km/L</span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">Marco Inicial</span>
                          )}
                        </div>
                        <div className="flex justify-between items-end pt-3 border-t border-slate-200/60">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Odômetro</span>
                              <span className="font-bold text-slate-800 text-base">{r.current_km.toLocaleString()} km</span>
                            </div>
                            <div className="flex flex-col text-center">
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Preço/L</span>
                              <span className="font-bold text-slate-800 text-base">R$ {r.liters > 0 ? (r.total_cost / r.liters).toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Abastecido</span>
                              <span className="font-bold text-slate-800 text-base">{r.liters} L</span>
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
                      <p className="text-sm text-slate-500">Mês atual</p>
                    </div>
                    <button onClick={() => setExpandedCard(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-12">
                    {Object.keys(dailyBreakdown).length === 0 ? (
                      <div className="text-center py-10">
                        <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhum gasto neste mês.</p>
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
                      <p className="text-sm text-slate-500">Mês atual</p>
                    </div>
                    <button onClick={() => setExpandedCard(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-12">
                    {Object.keys(dailyBreakdown).length === 0 ? (
                      <div className="text-center py-10">
                        <Droplets className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhum abastecimento neste mês.</p>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
