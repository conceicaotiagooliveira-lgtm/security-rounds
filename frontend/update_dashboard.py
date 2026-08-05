import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Imports for ComposedChart, Line, CartesianGrid, Legend, Bar
old_imports = "import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';"
new_imports = "import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line, Bar, CartesianGrid, Legend } from 'recharts';"
content = content.replace(old_imports, new_imports)

# 2. Update chartData & averageCostPerKm
old_chartData = """  const displayHistory = [...historyWithKml].reverse();
  const chartData = historyWithKml
    .filter(r => !r.isFirst && r.segmentKml !== '--')
    .map(r => ({
      date: `${new Date(r.created_at).toLocaleDateString('pt-BR')} às ${new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
      kml: parseFloat(r.segmentKml)
    }));"""

new_chartData = """  const displayHistory = [...historyWithKml].reverse();
  const chartData = historyWithKml
    .filter(r => !r.isFirst && r.segmentKml !== '--')
    .map(r => {
      const pricePerLiter = r.liters > 0 ? (r.total_cost / r.liters) : 0;
      const kml = parseFloat(r.segmentKml);
      const costPerKm = kml > 0 ? (pricePerLiter / kml) : 0;
      return {
        date: `${new Date(r.created_at).toLocaleDateString('pt-BR')} às ${new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
        kml: kml,
        pricePerLiter: parseFloat(pricePerLiter.toFixed(2)),
        costPerKm: parseFloat(costPerKm.toFixed(2))
      };
    });

  const averageCostPerKm = averageKml !== '--' && averagePricePerLiter > 0 
    ? (averagePricePerLiter / parseFloat(averageKml)).toFixed(2) 
    : '--';"""

content = content.replace(old_chartData, new_chartData)

# 3. Add the KPI Card for Custo/km
# Find the exact KPI block
old_kpi_block = """            <div className="text-center">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Veículo Atual</p>
              <p className="text-3xl font-light text-slate-800 tracking-tight uppercase">{selectedVehicle.plate}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Eficiência (Média)</p>
              <p className="text-2xl font-bold text-slate-800">{averageKml} <span className="text-sm text-slate-400">km/L</span></p>
            </div>"""

new_kpi_block = """            <div className="text-center">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Veículo Atual</p>
              <p className="text-3xl font-light text-slate-800 tracking-tight uppercase">{selectedVehicle.plate}</p>
            </div>
            <div className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => toggleCard('custo-beneficio')}>
              <p className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-1">Custo/km (Média)</p>
              <p className="text-2xl font-bold text-amber-600">{averageCostPerKm !== '--' ? `R$ ${averageCostPerKm}` : '--'} <span className="text-sm text-amber-500/70">/km</span></p>
            </div>
            <div className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => toggleCard('media')}>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Eficiência (Média)</p>
              <p className="text-2xl font-bold text-slate-800">{averageKml} <span className="text-sm text-slate-400">km/L</span></p>
            </div>"""

content = content.replace(old_kpi_block, new_kpi_block)

# Also make the Gasto Total clickable to 'historico' and add hover effect
content = content.replace(
    '<div className="text-center">\n              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Gasto Total (R$)</p>',
    '<div className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => toggleCard(\'historico\')}>\n              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Gasto Total (R$)</p>'
)

# 4. Add the expandedCard === 'custo-beneficio' modal logic
# I will insert it after the 'media' modal ends.
# Searching for:
#                 </>
#               )}
# 
#             </motion.div>
#           </>
#         )}
#       </AnimatePresence>

new_modal = """                </>
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
                              
                              {/* Left Axis for km/L */}
                              <YAxis yAxisId="left" domain={['auto', 'auto']} hide />
                              
                              {/* Right Axis for R$/L */}
                              <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} hide />
                              
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fffbeb' }}
                                labelStyle={{ fontWeight: 'bold', color: '#b45309', fontSize: '10px', textTransform: 'uppercase' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '14px' }}
                                formatter={(value, name) => {
                                  if (name === 'kml') return [`${Number(value).toFixed(1)} km/L`, 'Eficiência'];
                                  if (name === 'pricePerLiter') return [`R$ ${Number(value).toFixed(2)}/L`, 'Preço Combustível'];
                                  if (name === 'costPerKm') return [`R$ ${Number(value).toFixed(2)}/km`, 'Custo Real'];
                                  return [value, name];
                                }}
                              />
                              
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                              
                              {/* Price per Liter - Bar chart matching axis right */}
                              <Bar yAxisId="right" dataKey="pricePerLiter" name="Preço Combustível (R$/L)" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={20} />
                              
                              {/* km/L - Line chart matching axis left */}
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

            </motion.div>
          </>
        )}
      </AnimatePresence>"""

# Using regex or exact split to insert safely
content = content.replace("                </>\n              )}\n\n            </motion.div>\n          </>\n        )}\n      </AnimatePresence>", new_modal)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
