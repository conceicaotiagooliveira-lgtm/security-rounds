import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { getAssetUrl } from '@/services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '@/services/api';
import { AlertTriangle, Calendar, Fuel, DollarSign, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
// Dynamic icon creator based on vehicle photo with count badge
const createVehicleIcon = (photoUrl: string | undefined, count: number = 1) => {
  const bgImage = photoUrl ? getAssetUrl(photoUrl) : '/truck-render.png';
  const badgeHtml = count > 1 ? `<div style="position: absolute; top: -5px; right: -5px; background-color: #ef4444; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${count}</div>` : '';
  
  return L.divIcon({
    className: 'custom-vehicle-icon',
    html: `
      <div style="position: relative;">
        <div style="
          background-color: #8b5cf6; 
          background-image: url('${bgImage}');
          background-size: cover;
          background-position: center;
          width: 44px; 
          height: 44px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        "></div>
        ${badgeHtml}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

// Component to recenter map
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

export default function DriverRoutes() {
  const [refuelings, setRefuelings] = useState<any[]>([]);
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [refResponse, driverResponse] = await Promise.all([
          api.get('/driver/refuelings'),
          api.get('/driver/me')
        ]);
        setRefuelings(refResponse.data);
        if (driverResponse.data.vehicle) {
          setVehicle(driverResponse.data.vehicle);
        }
        
        // Set initial map center
        const validRefs = refResponse.data.filter((r: any) => r.latitude !== null && r.longitude !== null);
        if (validRefs.length > 0) {
          setMapCenter([validRefs[0].latitude, validRefs[0].longitude]);
        } else {
          setMapCenter([-23.5505, -46.6333]); // SP
        }
      } catch (error) {
        console.error("Erro ao buscar dados", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validRefuelings = refuelings.filter(r => r.latitude !== null && r.longitude !== null);
  
  // Group refuelings by exact location
  const groupedRefuelings = validRefuelings.reduce((acc: any, r: any) => {
    const key = `${r.latitude.toFixed(5)},${r.longitude.toFixed(5)}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(r);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-slate-800">Mapa de Abastecimentos</h2>
      </div>

      {validRefuelings.length === 0 ? (
        <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
           <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
           <h3 className="text-lg font-bold text-slate-800">Nenhum registro no mapa</h3>
           <p className="text-slate-500 text-sm mt-2">Os seus abastecimentos ainda não possuem dados de localização (GPS).</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[400px] rounded-3xl overflow-hidden shadow-md border border-slate-200 relative z-0">
          {mapCenter && (
            <MapContainer center={mapCenter} zoom={13} className="h-full w-full z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={mapCenter} />
              
              {Object.values(groupedRefuelings).map((group: any, index) => (
              <Marker 
                key={`group-${index}`} 
                position={[group[0].latitude, group[0].longitude]} 
                icon={createVehicleIcon(vehicle?.photo_url, group.length)}
              >
                <Popup className="rounded-xl">
                  <div className="p-1 max-h-64 overflow-y-auto pr-1">
                    <div className="font-bold text-slate-800 mb-2 border-b pb-2 flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-purple-600" />
                          Local de Abastecimento
                        </span>
                        {vehicle?.plate && (
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest ml-6 mt-1 flex items-center">
                            <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{vehicle.plate}</span>
                          </span>
                        )}
                      </div>
                      {group.length > 1 && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{group.length} registros</span>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {group.map((r: any, i: number) => (
                        <div key={r.id} className={i > 0 ? "border-t pt-3" : ""}>
                          <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.created_at).toLocaleString('pt-BR')}
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between text-slate-600">
                              <span className="font-medium text-xs text-slate-400 uppercase">Odômetro</span> 
                              <span className="font-bold">{r.current_km.toLocaleString()} km</span>
                            </p>
                            <p className="flex justify-between text-slate-600">
                              <span className="font-medium text-xs text-slate-400 uppercase flex items-center gap-1"><Fuel className="w-3 h-3"/> Litros</span> 
                              <span className="font-bold">{r.liters} L</span>
                            </p>
                            <p className="flex justify-between text-slate-600">
                              <span className="font-medium text-xs text-slate-400 uppercase flex items-center gap-1"><DollarSign className="w-3 h-3"/> Valor</span> 
                              <span className="font-bold text-emerald-600">R$ {r.total_cost.toFixed(2)}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          )}
        </motion.div>
      )}
      
      {/* List summary */}
      {refuelings.length > 0 && (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">Últimos Registros</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {refuelings.slice(0, 5).map(r => (
              <div 
                key={r.id} 
                onClick={() => {
                  if (r.latitude && r.longitude) {
                    setMapCenter([r.latitude, r.longitude]);
                    // Scroll to top to see the map on mobile
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`flex justify-between items-center py-2 px-3 rounded-lg transition-all ${r.latitude && r.longitude ? 'bg-slate-50 hover:bg-purple-50 cursor-pointer active:scale-[0.98] border border-transparent hover:border-purple-100' : 'bg-slate-50 opacity-70'}`}
              >
                <div className="flex items-center gap-2">
                  {r.latitude && r.longitude ? (
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{r.liters}L <span className="text-slate-400 font-normal text-xs">({r.current_km} km)</span></p>
                    <p className="text-[10px] text-slate-500 leading-tight">{new Date(r.created_at).toLocaleDateString('pt-BR')} às {new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 text-sm">R$ {r.total_cost.toFixed(2)}</p>
                  {(!r.latitude || !r.longitude) && <span className="text-[9px] text-amber-500 font-medium block leading-none mt-0.5">Sem GPS</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
