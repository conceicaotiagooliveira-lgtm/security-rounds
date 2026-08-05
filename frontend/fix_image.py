import re

with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix image url in getVehicleIcon
old_icon_func = '    ? `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`'
new_icon_func = '    ? `<img src="http://localhost:8081${photoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`'

content = content.replace(old_icon_func, new_icon_func)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
