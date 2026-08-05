with open("src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("</motio          {/* Map Thumbnail */}", "</motion.div>\n\n          {/* Map Thumbnail */}")
content = content.replace("            </div>  </div>", "            </div>")

with open("src/pages/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
