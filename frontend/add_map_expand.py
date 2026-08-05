import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { Battery, Activity, Calendar, MapPin, Box, TrendingUp, Share2, Truck, Wallet, Droplets, X, Fuel } from 'lucide-react';",
    "import { Battery, Activity, Calendar, MapPin, Box, TrendingUp, Share2, Truck, Wallet, Droplets, X, Fuel, Maximize2, Minimize2 } from 'lucide-react';"
)

# 2. State
content = content.replace(
    "const [selectedRefueling, setSelectedRefueling] = useState<any | null>(null);",
    "const [selectedRefueling, setSelectedRefueling] = useState<any | null>(null);\n  const [isMapExpanded, setIsMapExpanded] = useState(false);"
)

# 3. Map container class and key
old_container = """          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-2 shadow-md flex-1 min-h-[300px] relative overflow-hidden z-0">
            <div className="absolute inset-0 rounded-2xl overflow-hidden z-0">
              <MapContainer key={`map-${selectedVehicle?.id}-${routePositions.length}`}"""

new_container = """          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={isMapExpanded ? "fixed inset-2 md:inset-6 z-[100] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-2 shadow-2xl flex flex-col transition-all duration-300" : "bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-2 shadow-md flex-1 min-h-[300px] relative overflow-hidden z-0 transition-all duration-300"}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden z-0">
              <MapContainer key={`map-${selectedVehicle?.id}-${routePositions.length}-${isMapExpanded ? 'expanded' : 'normal'}`}"""

content = content.replace(old_container, new_container)

# 4. Add expand button
# Looking for:
#                 })}
#               </MapContainer>
#             </div>
#             <div className="absolute bottom-4 left-4 z-10 pointer-events-none">

old_button_insert = """                })}
              </MapContainer>
            </div>
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">"""

new_button_insert = """                })}
              </MapContainer>
            </div>
            
            <button 
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg border border-slate-200 text-slate-600 hover:text-purple-600 hover:bg-white transition-all focus:outline-none"
              title={isMapExpanded ? "Minimizar Mapa" : "Expandir Mapa"}
            >
              {isMapExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">"""

content = content.replace(old_button_insert, new_button_insert)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
