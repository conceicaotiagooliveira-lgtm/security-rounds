with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace h-32 with h-48 for the chart container
content = content.replace(
    '<div className="h-32 w-full -ml-3 mt-4">',
    '<div className="h-48 w-full -ml-3 mt-4">'
)

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
