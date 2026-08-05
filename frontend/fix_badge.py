with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'className="absolute inset-x-4 top-4 flex justify-between z-10"',
    'className="absolute bottom-4 left-4 z-10 pointer-events-none"'
)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
