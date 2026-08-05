import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_block = """            {/* Desempenho Energético */}
            <motion.div onClick={() => toggleCard('media')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-md cursor-pointer active:scale-[0.97] transition-all hover:border-purple-200">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Desempenho Geral</h3>
                <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"><Share2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Média do Veículo</p>
                  <p className="font-bold text-lg text-purple-600">
                    {averageKml !== '--' ? `${averageKml} km/L` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Especificação (Fábrica)</p>
                  <p className="font-semibold text-slate-800">
                    {selectedVehicle.expected_kml > 0 ? `${selectedVehicle.expected_kml} km/L` : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-1">Desvio da Meta</p>
                  {(() => {
                    if (averageKml === '--' || !selectedVehicle.expected_kml) {
                      return <div className="text-sm text-slate-500 font-medium">N/A</div>;
                    }
                    const avg = parseFloat(averageKml);
                    const diff = ((avg - selectedVehicle.expected_kml) / selectedVehicle.expected_kml) * 100;
                    if (diff >= 0) {
                      return <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-semibold"><TrendingUp className="w-4 h-4" /> +{diff.toFixed(1)}% Econômico</div>;
                    } else {
                      return <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-semibold"><TrendingUp className="w-4 h-4 rotate-180" /> {Math.abs(diff).toFixed(1)}% Gasto a mais</div>;
                    }
                  })()}
                </div>
              </div>
            </motion.div>"""

new_block = """            {/* Desempenho Energético Dinâmico */}
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
                  cardColors = "bg-blue-50/90 backdrop-blur-xl border border-blue-200 hover:border-blue-400 shadow-blue-100";
                  iconBg = "bg-blue-200";
                  iconText = "text-blue-700";
                  valueText = "text-blue-700";
                  labelText = "text-blue-900";
                  secondaryText = "text-blue-600/80";
                } else if (avg >= target) { // Bom (Verde)
                  cardColors = "bg-emerald-50/90 backdrop-blur-xl border border-emerald-200 hover:border-emerald-400 shadow-emerald-100";
                  iconBg = "bg-emerald-200";
                  iconText = "text-emerald-700";
                  valueText = "text-emerald-700";
                  labelText = "text-emerald-900";
                  secondaryText = "text-emerald-600/80";
                } else { // Ruim (Vermelho)
                  cardColors = "bg-red-50/90 backdrop-blur-xl border border-red-200 hover:border-red-400 shadow-red-100";
                  iconBg = "bg-red-200";
                  iconText = "text-red-700";
                  valueText = "text-red-700";
                  labelText = "text-red-900";
                  secondaryText = "text-red-600/80";
                }
              }

              return (
                <motion.div onClick={() => toggleCard('media')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${cardColors} rounded-3xl p-6 shadow-md cursor-pointer active:scale-[0.97] transition-all`}>
                  <div className="flex justify-between items-start mb-6">
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
            })()}"""

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    print("WARNING: Could not find old block")

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
