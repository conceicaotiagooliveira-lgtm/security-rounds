import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace historico modal list
old_historico_list = """                      [...refuelings].reverse().map((r, idx) => (
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
                      ))"""

new_historico_list = """                      [...refuelings].reverse().map((r, idx) => (
                        <div key={r.id} className="flex flex-col py-2 px-3 bg-slate-50 rounded-xl shadow-sm border border-slate-100 hover:border-purple-200 transition-colors cursor-pointer" onClick={() => setSelectedRefueling(r)}>
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Calendar className="w-3 h-3 text-purple-500" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(r.created_at).toLocaleDateString('pt-BR')} às {new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 shadow-sm">R$ {r.total_cost.toFixed(2)}</span>
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
                      ))"""

content = content.replace(old_historico_list, new_historico_list)

# Replace media modal list
old_media_list = """                    {displayHistory.map((r, idx) => (
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
                    ))}"""

new_media_list = """                    {displayHistory.map((r, idx) => (
                      <div key={r.id} className="flex flex-col py-2 px-3 bg-slate-50 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors" onClick={() => setSelectedRefueling(r)}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3 h-3 text-purple-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(r.created_at).toLocaleDateString('pt-BR')} às {new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
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
                    ))}"""

content = content.replace(old_media_list, new_media_list)

# Also let's tighten the space between rows in space-y-4 -> space-y-2
content = content.replace('className="flex-1 overflow-y-auto p-6 space-y-4 pb-12"', 'className="flex-1 overflow-y-auto p-6 space-y-2 pb-12"')

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
