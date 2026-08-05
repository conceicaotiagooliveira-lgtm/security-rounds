import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. State
content = content.replace("  const [expandedCard, setExpandedCard] = useState<string | null>(null);", "  const [expandedCard, setExpandedCard] = useState<string | null>(null);\n  const [selectedRefueling, setSelectedRefueling] = useState<any>(null);")

# 2. Render List Items
old_list_item = """                [...refuelings].reverse().slice(0, 4).map((r, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-semibold text-slate-700">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')} às {new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="text-xs font-bold text-purple-600">
                        R$ {r.total_cost.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-400">Volume</p>
                        <p className="text-sm font-semibold text-slate-800">{r.liters} L</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {r.latitude && r.longitude ? 'Localização salva' : 'Sem GPS'}
                      </div>
                    </div>
                  </div>
                ))"""

new_list_item = """                [...refuelings].reverse().slice(0, 4).map((r, idx) => (
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
                ))"""

content = content.replace(old_list_item, new_list_item)

# 3. Fix AnimatePresence wrapping logic
content = content.replace("{expandedCard && (", "{(expandedCard || selectedRefueling) && (")
content = content.replace("onClick={() => setExpandedCard(null)}", "onClick={() => { setExpandedCard(null); setSelectedRefueling(null); }}")

# 4. Insert selectedRefueling modal details
refueling_modal = """
              {selectedRefueling && (
                <>
                  <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Detalhes do Abastecimento</h2>
                      <p className="text-sm text-slate-500">
                        {new Date(selectedRefueling.created_at).toLocaleDateString('pt-BR')} às {new Date(selectedRefueling.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <button onClick={() => setSelectedRefueling(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-12">
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
                        <p className="text-xl font-bold text-slate-800">R$ {(selectedRefueling.total_cost / selectedRefueling.liters).toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Odômetro</p>
                        <p className="text-xl font-bold text-slate-800">{selectedRefueling.current_km.toLocaleString()} km</p>
                      </div>
                    </div>
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
"""

content = content.replace("            </motion.div>\n          </>\n        )}\n      </AnimatePresence>", refueling_modal + "            </motion.div>\n          </>\n        )}\n      </AnimatePresence>")

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

