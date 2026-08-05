import pymysql

try:
    conn = pymysql.connect(
        host='192.168.0.53',
        user='root',
        password='qff77eti',
        database='fleet_control',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as total FROM third_party_entries")
        row = cursor.fetchone()
        print(f"Total Entries: {row['total']}")
        
        cursor.execute("SELECT name, status, reason FROM third_party_entries LIMIT 5")
        rows = cursor.fetchall()
        for i, r in enumerate(rows):
            print(f"{i} - {r['name']} - {r['status']} - {r['reason']}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
