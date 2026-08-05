with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_battery_block = """              <div className="bg-white/50 backdrop-blur border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
                <Battery className="w-5 h-5 text-slate-400 mb-2" />
                <p className="text-xs text-slate-400">Battery</p>
                <p className="font-bold text-slate-700">100%</p>
              </div>"""

new_oil_block = """              <div className="bg-white/50 backdrop-blur border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
                {(() => {
                  let oilLife = 100;
                  let colorClass = "text-emerald-500";
                  
                  if (selectedVehicle?.oil_change_interval_km > 0) {
                    const kmSinceChange = selectedVehicle.current_km - (selectedVehicle.last_oil_change_km || 0);
                    oilLife = Math.max(0, 100 - (kmSinceChange / selectedVehicle.oil_change_interval_km) * 100);
                  }

                  if (oilLife <= 10) colorClass = "text-red-500";
                  else if (oilLife <= 30) colorClass = "text-amber-500";

                  return (
                    <>
                      <Droplets className={`w-5 h-5 mb-2 ${colorClass}`} />
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Óleo</p>
                      <p className="font-bold text-slate-700">{oilLife.toFixed(0)}%</p>
                    </>
                  );
                })()}
              </div>"""

content = content.replace(old_battery_block, new_oil_block)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
