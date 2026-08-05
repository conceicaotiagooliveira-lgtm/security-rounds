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
        cursor.execute("SHOW CREATE TABLE visit_profiles")
        print(cursor.fetchone()['Create Table'])
    conn.close()
except Exception as e:
    print(f"Error: {e}")
