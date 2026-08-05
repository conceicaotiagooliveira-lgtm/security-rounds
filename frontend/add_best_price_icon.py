import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Fuel import
content = content.replace(
    "import { Battery, Activity, Calendar, MapPin, Box, TrendingUp, Share2, Truck, Wallet, Droplets, X } from 'lucide-react';",
    "import { Battery, Activity, Calendar, MapPin, Box, TrendingUp, Share2, Truck, Wallet, Droplets, X, Fuel } from 'lucide-react';"
)

# 2. Add bestPriceRefuelingId logic
old_logic = """  const mapCenter: [number, number] = routePositions.length > 0 
    ? routePositions[routePositions.length - 1] 
    : [ -23.5505, -46.6333 ];"""

new_logic = """  let bestPriceRefuelingId: number | null = null;
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
    : [ -23.5505, -46.6333 ];"""

content = content.replace(old_logic, new_logic)

# 3. Update the Marker rendering
old_marker = """                  return (
                    <CircleMarker key={`circle-${idx}`} center={pos} radius={8} fillColor="#8b5cf6" color="#ffffff" weight={2} fillOpacity={1}>
                      {popupContent}
                    </CircleMarker>
                  );"""

new_marker = """                  if (r.id === bestPriceRefuelingId) {
                    const fuelIcon = new L.DivIcon({
                      html: `<div style="background-color: #f59e0b; border: 2px solid white; border-radius: 50%; padding: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; color: white;">
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"></line><line x1="4" y1="9" x2="14" y2="9"></line><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path></svg>
                             </div>`,
                      className: 'custom-fuel-icon',
                      iconSize: [30, 30],
                      iconAnchor: [15, 15],
                    });
                    return (
                      <Marker key={`marker-best-${idx}`} position={pos} icon={fuelIcon} zIndexOffset={100}>
                        {popupContent}
                      </Marker>
                    );
                  }

                  return (
                    <CircleMarker key={`circle-${idx}`} center={pos} radius={8} fillColor="#8b5cf6" color="#ffffff" weight={2} fillOpacity={1}>
                      {popupContent}
                    </CircleMarker>
                  );"""

content = content.replace(old_marker, new_marker)

# 4. Add the legend
old_legend = """            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
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
            </div>"""

new_legend = old_legend + """\n            {bestPriceRefuelingId && (
              <div className="absolute bottom-4 right-4 z-10 pointer-events-none flex items-center gap-2 bg-amber-500/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg">
                <Fuel className="w-4 h-4" />
                <span>Melhor Preço/L</span>
              </div>
            )}"""

content = content.replace(old_legend, new_legend)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
