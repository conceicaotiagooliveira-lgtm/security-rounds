import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import Popup
content = content.replace("CircleMarker, Marker } from 'react-leaflet';", "CircleMarker, Marker, Popup } from 'react-leaflet';")

# 2. Modify map render
old_render = """                {refuelingsWithPos.map((r, idx) => {
                  const pos = [r.latitude, r.longitude] as [number, number];
                  if (idx === refuelingsWithPos.length - 1) {
                    return <Marker key={`marker-${idx}`} position={pos} icon={getVehicleIcon(selectedVehicle?.photo_url)} eventHandlers={{ click: () => setSelectedRefueling(r) }} />;
                  }
                  return <CircleMarker key={`circle-${idx}`} center={pos} radius={8} fillColor="#8b5cf6" color="#ffffff" weight={2} fillOpacity={1} eventHandlers={{ click: () => setSelectedRefueling(r) }} />;
                })}"""

new_render = """                {refuelingsWithPos.map((r, idx) => {
                  const pos = [r.latitude, r.longitude] as [number, number];
                  
                  // Group refuelings that happened at this exact location
                  const localRefs = [...refuelings].filter(ref => ref.latitude === pos[0] && ref.longitude === pos[1]).reverse();
                  
                  const popupContent = (
                    <Popup className="rounded-xl">
                      <div className="flex flex-col gap-2 min-w-[180px] max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1">Registros neste local ({localRefs.length}):</h3>
                        {localRefs.map(ref => (
                          <div key={ref.id} className="bg-slate-50 p-2 rounded-lg border border-slate-100 mb-1 cursor-pointer hover:border-purple-300 transition-colors" onClick={() => setSelectedRefueling(ref)}>
                            <p className="text-[10px] font-bold text-purple-600 mb-0.5">{new Date(ref.created_at).toLocaleDateString('pt-BR')} às {new Date(ref.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-bold text-slate-700">R$ {ref.total_cost.toFixed(2)}</p>
                              <p className="text-[10px] text-slate-500">{ref.liters} L</p>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-medium">KM: {ref.current_km.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </Popup>
                  );

                  if (idx === refuelingsWithPos.length - 1) {
                    return (
                      <Marker key={`marker-${idx}`} position={pos} icon={getVehicleIcon(selectedVehicle?.photo_url)}>
                        {popupContent}
                      </Marker>
                    );
                  }
                  return (
                    <CircleMarker key={`circle-${idx}`} center={pos} radius={8} fillColor="#8b5cf6" color="#ffffff" weight={2} fillOpacity={1}>
                      {popupContent}
                    </CircleMarker>
                  );
                })}"""

content = content.replace(old_render, new_render)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

