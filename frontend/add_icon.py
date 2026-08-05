import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Marker import
content = content.replace("CircleMarker } from 'react-leaflet';", "CircleMarker, Marker } from 'react-leaflet';\nimport L from 'leaflet';")

# 2. Add vehicleIcon definition
icon_def = """
const vehicleIcon = new L.DivIcon({
  html: `<div style="background-color: #10b981; border: 2px solid white; border-radius: 50%; padding: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`,
  className: 'custom-vehicle-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
"""

# Find a good place to insert icon_def, maybe after imports
content = content.replace("import 'leaflet/dist/leaflet.css';", "import 'leaflet/dist/leaflet.css';\n" + icon_def)

# 3. Update map rendering
# From:
#                 {routePositions.map((pos, idx) => (
#                   <CircleMarker key={idx} center={pos} radius={idx === routePositions.length - 1 ? 8 : 5} fillColor={idx === routePositions.length - 1 ? "#10b981" : "#8b5cf6"} color="#ffffff" weight={2} fillOpacity={1} />
#                 ))}
# To:
old_map_render = """                {routePositions.map((pos, idx) => (
                  <CircleMarker key={idx} center={pos} radius={idx === routePositions.length - 1 ? 8 : 5} fillColor={idx === routePositions.length - 1 ? "#10b981" : "#8b5cf6"} color="#ffffff" weight={2} fillOpacity={1} />
                ))}"""

new_map_render = """                {routePositions.map((pos, idx) => {
                  if (idx === routePositions.length - 1) {
                    return <Marker key={`marker-${idx}`} position={pos} icon={vehicleIcon} />;
                  }
                  return <CircleMarker key={`circle-${idx}`} center={pos} radius={5} fillColor="#8b5cf6" color="#ffffff" weight={2} fillOpacity={1} />;
                })}"""

content = content.replace(old_map_render, new_map_render)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

