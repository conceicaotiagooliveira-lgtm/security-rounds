import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Car, User, MapPin, ChevronDown, Navigation, Route } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

// Fix for default Leaflet icon in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DepartureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: any[];
  drivers: any[];
  guards?: any[];
  preSelectedVehicleId?: string;
  activeMovements?: any[];
}

// Coordenadas base da empresa (Lajeado - RS)
const BASE_COORDS = { lat: -29.4671, lon: -51.9613 };

function MapEventsHandler({ onLocationSelected }: { onLocationSelected: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function DepartureModal({ isOpen, onClose, onSuccess, vehicles, drivers, guards = [], preSelectedVehicleId, activeMovements = [] }: DepartureModalProps) {
  const [vehicleId, setVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [departureKm, setDepartureKm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [guardPassword, setGuardPassword] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  
  const { user } = useAuthStore();
  const hideExternalDrivers = user?.permissions?.includes('hide_external_drivers');
  const filteredVehicles = vehicles.filter(v => v.driver_id == null);

  // Destination & Geocoding State
  const [destinationQuery, setDestinationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [mapPickerCenter, setMapPickerCenter] = useState<{lat: number, lon: number} | null>(null);

  const handleMapLocationSelected = async (lat: number, lon: number) => {
    setIsSearchingAddress(true);
    try {
      setMapPickerCenter({lat, lon});
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      const data = await res.json();
      
      if (data && data.display_name) {
        setDestinationQuery(data.display_name);
        setSelectedDestination(data);
        setSuggestions([]);
        calculateRoute(lat, lon);
        setIsMapPickerOpen(false); // Fecha o mapa após a seleção
      }
    } catch (err) {
      console.error("Erro no reverse geocoding", err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const filteredDrivers = drivers
    .filter(d => hideExternalDrivers ? d.vehicle_id == null : true)
    .filter(d => 
      d.name.toLowerCase().includes(driverSearchTerm.toLowerCase())
    );

  useEffect(() => {
    if (vehicleId) {
      const v = vehicles.find((v) => v.id === parseInt(vehicleId));
      if (v) {
        setDepartureKm(v.current_km.toString());
      }
    } else {
      setDepartureKm('');
    }
  }, [vehicleId, vehicles]);

  // Cleanup on close or initialize on open
  useEffect(() => {
    if (isOpen) {
      if (preSelectedVehicleId) {
        setVehicleId(preSelectedVehicleId);
      }
    } else {
      setDestinationQuery('');
      setSuggestions([]);
      setSelectedDestination(null);
      setEstimatedDistance(null);
      setDriverName('');
      setVehicleId('');
      setGuardPassword('');
      setAuthorizedBy('');
      setError('');
    }
  }, [isOpen, preSelectedVehicleId]);

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      setIsSearchingAddress(true);
      // Utilizando viewbox para priorizar o estado do Rio Grande do Sul e Lajeado
      const RS_VIEWBOX = "-58.0,-27.0,-49.0,-34.0";
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=br&viewbox=${RS_VIEWBOX}&email=contato@frota.com`);
      const data = await res.json();
      
      setSuggestions(data);
    } catch (err) {
      console.error("Erro ao buscar endereço", err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDestinationQuery(val);
    setSelectedDestination(null);
    setEstimatedDistance(null);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(val);
    }, 600);
  };

  const calculateRoute = async (destLat: number, destLon: number) => {
    try {
      setIsSearchingAddress(true);
      // OSRM expects lon,lat
      const url = `https://router.project-osrm.org/route/v1/driving/${BASE_COORDS.lon},${BASE_COORDS.lat};${destLon},${destLat}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.routes && data.routes.length > 0) {
        // Distance is in meters. We want km. And we multiply by 2 for round-trip (Ida e Volta).
        const distanceKm = (data.routes[0].distance / 1000) * 2;
        setEstimatedDistance(parseFloat(distanceKm.toFixed(1)));
      }
    } catch (err) {
      console.error("Erro ao calcular rota", err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectAddress = (addr: any) => {
    setSelectedDestination(addr);
    setDestinationQuery(addr.display_name);
    setSuggestions([]);
    calculateRoute(parseFloat(addr.lat), parseFloat(addr.lon));
  };

  if (!isOpen && !isMapPickerOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !driverName || !departureKm || !guardPassword) {
      setError('Preencha os campos obrigatórios (incluindo a senha do vigia)');
      return;
    }

    if (!authorizedBy) {
      setError('Senha do vigia inválida ou não encontrada');
      return;
    }

    // Validate driver CNH expiration
    const selectedDriver = drivers.find(d => d.name === driverName);
    if (selectedDriver && selectedDriver.cnh_expiration) {
      const expDate = new Date(selectedDriver.cnh_expiration);
      expDate.setHours(23, 59, 59, 999);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expDate < today) {
        setError('Este motorista está com a CNH vencida e não pode assumir o veículo.');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/movements/departure', {
        vehicle_id: parseInt(vehicleId),
        driver_name: driverName,
        destination: destinationQuery,
        departure_km: parseFloat(departureKm),
        estimated_distance_km: estimatedDistance,
        authorized_by: authorizedBy
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao registrar saída');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MAIN MODAL */}
      <AnimatePresence>
        {isOpen && !isMapPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Liberar Veículo (Saída)</h2>
                  <p className="text-sm text-slate-500">Registre quem está pegando a chave</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Veículo</label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        value={vehicleId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const isNaRua = activeMovements.some(m => m.vehicle_id === parseInt(val));
                            if (isNaRua) {
                              setError('Este veículo já está na rua (em uso) e não pode ser liberado.');
                              setVehicleId('');
                              return;
                            }
                            
                            const selectedV = vehicles.find(v => v.id === parseInt(val));
                            if (selectedV) {
                              const isOilUrgent = selectedV.oil_change_interval_km 
                                ? (100 - ((selectedV.current_km - (selectedV.last_oil_change_km || 0)) / selectedV.oil_change_interval_km) * 100) <= 10 
                                : false;
                              if (isOilUrgent) {
                                setError('Este veículo está com a troca de óleo vencida e não pode ser liberado.');
                                setVehicleId('');
                                return;
                              }
                              if (selectedV.status !== 'Ativo') {
                                setError(`Este veículo está com status "${selectedV.status}" e não pode ser liberado.`);
                                setVehicleId('');
                                return;
                              }
                            }
                          }
                          setError('');
                          setVehicleId(val);
                        }}
                        disabled={!!preSelectedVehicleId}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all appearance-none ${
                          preSelectedVehicleId ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                      >
                        <option value="">Selecione...</option>
                        {filteredVehicles.map((v) => (
                          <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">KM de Saída</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={departureKm}
                        readOnly
                        className="w-full pl-4 pr-8 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">km</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Condutor</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                    <div 
                      className="relative w-full bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all flex items-center"
                      onClick={(e) => {
                        setIsDriverDropdownOpen(true);
                        const input = e.currentTarget.querySelector('input');
                        if (input) input.focus();
                      }}
                    >
                      <input
                        type="text"
                        value={isDriverDropdownOpen ? driverSearchTerm : driverName}
                        onChange={(e) => {
                          setDriverSearchTerm(e.target.value);
                          setDriverName(e.target.value);
                          setIsDriverDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setIsDriverDropdownOpen(true);
                          setDriverSearchTerm(driverName);
                        }}
                        onBlur={() => setTimeout(() => setIsDriverDropdownOpen(false), 200)}
                        placeholder="Selecione ou pesquise o condutor..."
                        className="w-full pl-10 pr-10 py-2.5 bg-transparent border-none outline-none"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isDriverDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto"
                        >
                          {filteredDrivers.length > 0 ? (
                            filteredDrivers.map((d) => (
                              <div
                                key={d.id}
                                onClick={() => {
                                  if (d.cnh_expiration) {
                                    const expDate = new Date(d.cnh_expiration);
                                    expDate.setHours(23, 59, 59, 999);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (expDate < today) {
                                      setError(`A CNH de ${d.name} está vencida. Ele não pode conduzir veículos.`);
                                      return;
                                    }
                                  }
                                  setDriverName(d.name);
                                  setDriverSearchTerm('');
                                  setIsDriverDropdownOpen(false);
                                  setError('');
                                }}
                                className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                              >
                                {d.name}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-slate-500 text-sm text-center">
                              Nenhum motorista encontrado
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Destino (Pesquisa ou Mapa)</label>
                  <div className="relative">
                    <MapPin 
                      className="absolute left-3 top-3 w-5 h-5 text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors z-10" 
                      onClick={() => setIsMapPickerOpen(true)}
                      title="Abrir mapa para selecionar"
                    />
                    <input
                      type="text"
                      value={destinationQuery}
                      onChange={handleDestinationChange}
                      placeholder="Ex: Avenida Paulista, 1000, São Paulo"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    
                    {isSearchingAddress && (
                      <div className="absolute right-3 top-3">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {suggestions.length > 0 && (
                    <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto z-50 relative">
                      {suggestions.map((addr, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleSelectAddress(addr)}
                          className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0"
                        >
                          <p className="text-sm text-slate-700 truncate" title={addr.display_name}>
                            {addr.display_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {estimatedDistance !== null && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-indigo-700">
                          <Route className="w-5 h-5" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider">Percurso Estimado (Ida e Volta)</p>
                            <p className="text-sm">Rota calculada a partir da base</p>
                          </div>
                        </div>
                        <div className="text-xl font-black text-indigo-800">
                          ~{estimatedDistance} <span className="text-sm font-semibold">km</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Autorização da Portaria</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha do Vigia</label>
                      <input
                        type="password"
                        value={guardPassword}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGuardPassword(val);
                          const matched = guards.find(g => g.auth_password && g.auth_password === val);
                          if (matched) {
                            setAuthorizedBy(matched.name);
                            setError('');
                          } else {
                            setAuthorizedBy('');
                          }
                        }}
                        placeholder="••••••"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vigia Identificado</label>
                      <input
                        type="text"
                        readOnly
                        value={authorizedBy || 'Aguardando senha...'}
                        className={`w-full px-4 py-2.5 rounded-xl border outline-none font-semibold ${
                          authorizedBy 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Registrando...' : 'Confirmar Saída'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAP PICKER MODAL */}
      <AnimatePresence>
        {isMapPickerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapPickerOpen(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl h-[90vh] bg-white z-[70] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Selecione no Mapa</h3>
                  <p className="text-sm text-slate-500">Pesquise e clique no local exato do destino</p>
                </div>
                
                <div className="flex-1 max-w-lg mx-8 relative">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar local no mapa..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 shadow-sm"
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (val.length < 3) return;
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=1&countrycodes=br&viewbox=-58.0,-27.0,-49.0,-34.0&email=contato@frota.com`);
                          const data = await res.json();
                          if (data && data.length > 0) {
                            setMapPickerCenter({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
                          }
                        } catch(err){}
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(false)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 relative bg-slate-100">
                <MapContainer 
                  center={mapPickerCenter ? [mapPickerCenter.lat, mapPickerCenter.lon] : [BASE_COORDS.lat, BASE_COORDS.lon]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <MapEventsHandler onLocationSelected={handleMapLocationSelected} />
                  {mapPickerCenter && <MapUpdater center={[mapPickerCenter.lat, mapPickerCenter.lon]} />}
                  {mapPickerCenter && (
                    <Marker position={[mapPickerCenter.lat, mapPickerCenter.lon]} />
                  )}
                </MapContainer>
                
                {isSearchingAddress && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur px-5 py-2.5 rounded-full shadow-lg flex items-center gap-3 text-sm font-semibold text-indigo-600 border border-indigo-100">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    Processando Localização...
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
