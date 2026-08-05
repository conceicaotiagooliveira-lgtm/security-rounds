import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_route = """  const routePositions: [number, number][] = refuelings
    .filter(r => r.latitude && r.longitude)
    .map(r => [r.latitude, r.longitude] as [number, number]);"""

new_route = """  const refuelingsWithPos = refuelings.filter(r => r.latitude && r.longitude);
  const routePositions: [number, number][] = refuelingsWithPos.map(r => [r.latitude, r.longitude] as [number, number]);"""

content = content.replace(old_route, new_route)

old_map_render = """                {routePositions.map((pos, idx) => {
                  if (idx === routePositions.length - 1) {
                    return <Marker key={`marker-${idx}`} position={pos} icon={getVehicleIcon(selectedVehicle?.photo_url)} />;
                  }
                  return <CircleMarker key={`circle-${idx}`} center={pos} radius={5} fillColor="#8b5cf6" color="#ffffff" weight={2} fillOpacity={1} />;
                })}"""

new_map_render = """                {refuelingsWithPos.map((r, idx) => {
                  const pos = [r.latitude, r.longitude] as [number, number];
                  if (idx === refuelingsWithPos.length - 1) {
                    return <Marker key={`marker-${idx}`} position={pos} icon={getVehicleIcon(selectedVehicle?.photo_url)} eventHandlers={{ click: () => setSelectedRefueling(r) }} />;
                  }
                  return <CircleMarker key={`circle-${idx}`} center={pos} radius={8} fillColor="#8b5cf6" color="#ffffff" weight={2} fillOpacity={1} eventHandlers={{ click: () => setSelectedRefueling(r) }} />;
                })}"""

# Also I changed CircleMarker radius to 8 so it's easier to click
content = content.replace(old_map_render, new_map_render)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

