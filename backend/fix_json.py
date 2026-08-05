import pymysql
import json

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
            if isinstance(reqs, str):
                try:
                    # Parse the string into a python dict
                    parsed = json.loads(reqs)
                    # For PyMySQL, you can pass dict to a JSON column? No, PyMySQL requires a string or you use json.dumps, but wait!
                    # If I used json.dumps before and it stored as string containing JSON, it's because my json.dumps was stringified.
                    # Wait, if `type(row['custom_reqs'])` was `str`, it might be because PyMySQL fetches JSON as str.
                    pass
                except:
                    continue
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
