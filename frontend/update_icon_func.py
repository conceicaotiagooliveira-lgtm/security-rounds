import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the static vehicleIcon
icon_def_pattern = r"const vehicleIcon = new L\.DivIcon\({\n.*?}\);\n"
content = re.sub(icon_def_pattern, "", content, flags=re.DOTALL)

# Add getVehicleIcon function inside or outside
get_icon_func = """
const getVehicleIcon = (photoUrl?: string) => {
  const content = photoUrl
    ? `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`;
  
  return new L.DivIcon({
    html: `<div style="background-color: ${photoUrl ? 'white' : '#10b981'}; border: 2px solid white; border-radius: 50%; padding: ${photoUrl ? '2px' : '4px'}; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; overflow: hidden;">${content}</div>`,
    className: 'custom-vehicle-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};
"""

content = content.replace("export default function Dashboard() {", get_icon_func + "\nexport default function Dashboard() {")

# Update map render
content = content.replace("<Marker key={`marker-${idx}`} position={pos} icon={vehicleIcon} />", "<Marker key={`marker-${idx}`} position={pos} icon={getVehicleIcon(selectedVehicle?.photo_url)} />")

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

