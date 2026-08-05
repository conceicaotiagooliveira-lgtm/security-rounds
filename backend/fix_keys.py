import pymysql
import json

key_map = {
    "NR10": "nr10",
    "NR12": "nr12",
    "NR18": "nr18",
    "NR33": "nr33",
    "NR35": "nr35",
    "NR11": "nr11",
    "PEMT – PTA": "pemtpta"
}

try:
    conn = pymysql.connect(
        host='192.168.0.53',
        user='root',
        password='qff77eti',
        database='fleet_control',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, custom_reqs FROM third_party_profiles")
        rows = cursor.fetchall()
        
        updated = 0
        for row in rows:
            reqs = row['custom_reqs']
            if not reqs: continue
            
            if isinstance(reqs, str):
                try:
                    reqs = json.loads(reqs)
                except:
                    continue
            
            if isinstance(reqs, dict):
                new_reqs = {}
                for k, v in reqs.items():
                    # Map the key if it exists in map, else lowercase it and remove spaces
                    if k in key_map:
                        new_k = key_map[k]
                    else:
                        new_k = k.lower().replace(" ", "")
                    new_reqs[new_k] = v
                
                cursor.execute(
                    "UPDATE third_party_profiles SET custom_reqs = %s WHERE id = %s",
                    (json.dumps(new_reqs), row['id'])
                )
                updated += 1
                
    conn.commit()
    conn.close()
    print(f"Fixed {updated} records.")
except Exception as e:
    print(f"Error: {e}")
