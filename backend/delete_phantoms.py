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
        cursor.execute("DELETE FROM third_party_entries WHERE status = 'Bloqueado'")
        print(f"Deleted {cursor.rowcount} phantom entries.")
            
    conn.commit()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
