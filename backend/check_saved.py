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
        cursor.execute("SELECT name, document, company, aso_date, custom_reqs FROM third_party_profiles WHERE document = '81074743091'")
        row = cursor.fetchone()
        if row:
            print(f"ENCONTRADO: {row}")
        else:
            print("Não encontrado o CPF 81074743091.")
            
        cursor.execute("SELECT name, document, company FROM third_party_profiles WHERE document NOT LIKE 'IMP_%' AND document NOT LIKE 'S/D%' LIMIT 5")
        rows = cursor.fetchall()
        if rows:
            print("\nOutros CPFs reais encontrados:")
            for r in rows:
                print(r)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
