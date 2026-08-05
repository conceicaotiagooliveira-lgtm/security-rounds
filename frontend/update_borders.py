with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace border-white/40 with border-slate-200 and shadow-sm with shadow-md
# Only for those that have bg-white/70 or bg-white/50
content = content.replace("border-white/40 rounded-3xl p-6 shadow-sm", "border-slate-200 rounded-3xl p-6 shadow-md")
content = content.replace("border-white/40 rounded-3xl p-2 shadow-sm", "border-slate-200 rounded-3xl p-2 shadow-md")
content = content.replace("border-white/40 p-2", "border-slate-200 p-2 shadow-md")

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

