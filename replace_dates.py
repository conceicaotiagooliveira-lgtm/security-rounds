import re

path = '/Server_vite/FrotaPatrimonial/frontend/src/pages/Dashboard.tsx'
with open(path, 'r') as f:
    content = f.read()

# find all new Date(X.created_at)
new_content = re.sub(r'new Date\(([a-zA-Z0-9_\[\]\.\-]+)\.created_at\)', 
                     r"new Date(\1.created_at.endsWith('Z') ? \1.created_at : \1.created_at + 'Z')", 
                     content)

with open(path, 'w') as f:
    f.write(new_content)
