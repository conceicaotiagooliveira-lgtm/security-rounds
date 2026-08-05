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
        cursor.execute("SELECT name, document, company, aso_date, sesmt_date FROM third_party_profiles LIMIT 10")
        rows = cursor.fetchall()
        for i, row in enumerate(rows):
            print(f"{i+1} | {row['name']} | {row['document']} | {row['company']} | {row['aso_date']} | {row['sesmt_date']}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
