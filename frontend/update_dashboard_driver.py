import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add drivers state
content = content.replace(
    'const [vehicles, setVehicles] = useState<any[]>([]);',
    'const [vehicles, setVehicles] = useState<any[]>([]);\n  const [drivers, setDrivers] = useState<any[]>([]);'
)

# 2. Update fetch logic
old_fetch = """  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get('/vehicles');
        setVehicles(response.data);
        if (response.data.length > 0) {
          setSelectedVehicle(response.data[0]);
        }
      } catch (error) {
        console.error('Failed to load vehicles', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);"""

new_fetch = """  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, driversRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/drivers')
        ]);
        setVehicles(vehiclesRes.data);
        setDrivers(driversRes.data);
        if (vehiclesRes.data.length > 0) {
          setSelectedVehicle(vehiclesRes.data[0]);
        }
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);"""

content = content.replace(old_fetch, new_fetch)

# 3. Add derived state for assignedDriver
content = content.replace(
    'if (!selectedVehicle) return null;',
    'if (!selectedVehicle) return null;\n\n  const assignedDriver = drivers.find(d => d.vehicle_id === selectedVehicle.id);'
)

# 4. Update the UI rendering of the driver
old_ui = """              <div>
                <p className="text-xs text-slate-400 mb-1">Driver</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden"><img src={`https://ui-avatars.com/api/?name=${selectedVehicle.brand}&background=random`} alt="Avatar" /></div>
                  <p className="font-semibold text-slate-800 text-sm">N/A</p>
                </div>
              </div>"""

new_ui = """              <div>
                <p className="text-xs text-slate-400 mb-1">Motorista</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                    <img 
                      src={assignedDriver?.photo_url ? `http://localhost:8081${assignedDriver.photo_url}` : `https://ui-avatars.com/api/?name=${assignedDriver?.name || selectedVehicle.brand}&background=random`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{assignedDriver ? assignedDriver.name : 'N/A'}</p>
                </div>
              </div>"""

content = content.replace(old_ui, new_ui)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
