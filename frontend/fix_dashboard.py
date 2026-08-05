import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix Imports
content = content.replace("import { motion } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';")
content = content.replace("import { Battery, Activity, Calendar, MapPin, Box, TrendingUp, Share2, Truck } from 'lucide-react';", "import { Battery, Activity, Calendar, MapPin, Box, TrendingUp, Share2, Truck, Wallet, Droplets, X } from 'lucide-react';\nimport { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';")

# 2. Fix States
state_insert = """  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (card: string) => setExpandedCard(prev => prev === card ? null : card);"""
content = content.replace("  const [loading, setLoading] = useState(true);", state_insert)

# 3. Fix Data Prep
data_prep = """  const averagePricePerLiter = totalLiters > 0 ? (totalSpent / totalLiters) : 0;

  // Prepare data for the modals
  const dailyBreakdown: Record<string, any[]> = {};
  refuelings.forEach(r => {
    const dayKey = new Date(r.created_at).toLocaleDateString('pt-BR');
    if (!dailyBreakdown[dayKey]) dailyBreakdown[dayKey] = [];
    dailyBreakdown[dayKey].push(r);
  });

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
  const chartData = historyWithKml
    .filter(r => !r.isFirst && r.segmentKml !== '--')
    .map(r => ({
      date: `${new Date(r.created_at).toLocaleDateString('pt-BR')} às ${new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
      kml: parseFloat(r.segmentKml)
    }));
"""
content = content.replace("  const averagePricePerLiter = totalLiters > 0 ? (totalSpent / totalLiters) : 0;", data_prep)

# 4. Make Cards Clickable
content = content.replace(
    """            {/* Gasto Financeiro (Total) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm">""",
    """            {/* Gasto Financeiro (Total) */}
            <motion.div onClick={() => toggleCard('gasto')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm cursor-pointer active:scale-[0.97] transition-all hover:border-emerald-200">"""
)

content = content.replace(
    """            {/* Desempenho Energético */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm">""",
    """            {/* Desempenho Energético */}
            <motion.div onClick={() => toggleCard('media')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm cursor-pointer active:scale-[0.97] transition-all hover:border-purple-200">"""
)

content = content.replace(
    """            {/* Volume de Combustível */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm">""",
    """            {/* Volume de Combustível */}
            <motion.div onClick={() => toggleCard('litros')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm cursor-pointer active:scale-[0.97] transition-all hover:border-blue-200">"""
)

# 5. Insert Modal
modal_code = """
      {/* History Popup Modals */}
      <AnimatePresence>
        {expandedCard && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setExpandedCard(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, y: '100%' }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl z-50 flex flex-col shadow-2xl"
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
                      <p className="text-sm text-slate-500">Evolução do veículo</p>
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
                                formatter={(value) => [`${float(value).toFixed(1)} km/L`, 'Média']}
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
                      <p className="text-sm text-slate-500">Visão consolidada</p>
                    </div>
                    <button onClick={() => setExpandedCard(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
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
                    <button onClick={() => setExpandedCard(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
"""

content = content.replace(
    """        </div>
        
      </div>
    </div>
  );
}""",
    modal_code + """
        </div>
        
      </div>
    </div>
  );
}"""
)

# Small fix for float() inside TSX tooltip formatter since it's JS, should be Number()
content = content.replace("float(value)", "Number(value)")

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Modifications applied successfully.")
