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
        cursor.execute("SELECT custom_reqs FROM third_party_profiles WHERE custom_reqs != '{}' AND custom_reqs != '\"{}\"' LIMIT 1")
        row = cursor.fetchone()
        if row:
            print(f"Value: {row['custom_reqs']}")
            print(f"Type: {type(row['custom_reqs'])}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
