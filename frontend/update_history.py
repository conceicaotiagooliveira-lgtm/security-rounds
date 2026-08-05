import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the "Histórico de Abastecimentos" section
old_history_section = """          {/* Histórico de Abastecimentos */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Histórico de Abastecimentos</h3>
              <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"><Share2 className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {refuelings.length === 0 ? (
                <div className="text-center text-slate-400 py-4 text-sm">Nenhum registro encontrado</div>
              ) : (
                [...refuelings].reverse().slice(0, 4).map((r, idx) => (
                  <div key={idx} onClick={() => setSelectedRefueling(r)} className="bg-slate-50 rounded-xl p-3 border border-slate-100 cursor-pointer hover:border-purple-300 transition-all active:scale-[0.98]">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         <p className="text-xs font-semibold text-slate-700">
                           {new Date(r.created_at).toLocaleDateString('pt-BR')} às {new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                         </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">Detalhes</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {refuelings.length > 4 && (
              <div className="text-center mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-purple-600 font-medium cursor-pointer hover:underline">Ver todos ({refuelings.length})</p>
              </div>
            )}
          </motion.div>"""

new_history_section = """          {/* Histórico de Abastecimentos Button */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} 
            onClick={() => setExpandedCard('historico')}
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm flex-none cursor-pointer active:scale-[0.98] transition-all hover:border-purple-200 group">
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
          </motion.div>"""

content = content.replace(old_history_section, new_history_section)

# Change Map Thumbnail to take the remaining flex space
content = content.replace(
    'className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-2 shadow-sm h-48 lg:h-64 relative overflow-hidden flex-none mt-4"',
    'className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-2 shadow-sm flex-1 min-h-[300px] relative overflow-hidden z-0"'
)

# Insert the modal for 'historico'
modal_historico = """
              {expandedCard === 'historico' && (
                <>
                  <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Histórico Completo</h2>
                      <p className="text-sm text-slate-500">Todos os registros do veículo</p>
                    </div>
                    <button onClick={() => setExpandedCard(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-12">
                    {refuelings.length === 0 ? (
                      <div className="text-center py-10">
                        <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhum registro encontrado.</p>
                      </div>
                    ) : (
                      [...refuelings].reverse().map((r, idx) => (
                        <div key={r.id} className="flex flex-col py-4 px-5 bg-slate-50 rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 transition-colors">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Calendar className="w-4 h-4 text-purple-500" />
                              <span className="text-xs font-bold uppercase tracking-wider">{new Date(r.created_at).toLocaleDateString('pt-BR')} às {new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <span className="text-sm font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200 shadow-sm">R$ {r.total_cost.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Odômetro</span>
                                <span className="font-bold text-slate-800 text-sm sm:text-base">{r.current_km.toLocaleString()} km</span>
                              </div>
                              <div className="flex flex-col text-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Preço/L</span>
                                <span className="font-bold text-slate-800 text-sm sm:text-base">R$ {r.liters > 0 ? (r.total_cost / r.liters).toFixed(2) : '0.00'}</span>
                              </div>
                              <div className="flex flex-col text-right">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Abastecido</span>
                                <span className="font-bold text-slate-800 text-sm sm:text-base">{r.liters} L</span>
                              </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
"""

content = content.replace("{expandedCard === 'media' && (", modal_historico + "\n              {expandedCard === 'media' && (")

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

