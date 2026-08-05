with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'cardColors = "bg-blue-50/90 backdrop-blur-xl border border-blue-200 hover:border-blue-400 shadow-blue-100";',
    'cardColors = "bg-blue-100/90 backdrop-blur-xl border border-blue-300 hover:border-blue-400 shadow-blue-200";'
)

content = content.replace(
    'cardColors = "bg-emerald-50/90 backdrop-blur-xl border border-emerald-200 hover:border-emerald-400 shadow-emerald-100";',
    'cardColors = "bg-emerald-100/90 backdrop-blur-xl border border-emerald-300 hover:border-emerald-400 shadow-emerald-200";'
)

content = content.replace(
    'cardColors = "bg-red-50/90 backdrop-blur-xl border border-red-200 hover:border-red-400 shadow-red-100";',
    'cardColors = "bg-red-100/90 backdrop-blur-xl border border-red-300 hover:border-red-400 shadow-red-200";'
)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
