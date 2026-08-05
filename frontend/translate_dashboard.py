with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    'Operational Status': 'Status Operacional',
    'Vehicle ID': 'Placa',
    'Year': 'Ano',
    'Distance Covered': 'Distância Percorrida',
    'Fuel Efficiency': 'Eficiência (Média)',
    'Load Capacity': 'Capacidade de Carga',
    'L (Tank)': 'L (Tanque)',
}

for eng, pt in replacements.items():
    content = content.replace(eng, pt)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
