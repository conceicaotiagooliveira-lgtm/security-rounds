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
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
