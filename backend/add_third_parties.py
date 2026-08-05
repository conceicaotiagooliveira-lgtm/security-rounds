import pymysql
import uuid
import json

try:
    conn = pymysql.connect(
        host='192.168.0.53',
        user='root',
        password='qff77eti',
        database='fleet_control',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    profiles = [
        {
            "id": uuid.uuid4().hex,
            "name": "ANDERSON LUIZ DA ROSA",
            "company": "NÃO INFORMADA",
            "document": "S/D 1",
            "aso_date": "2026-07-31",
            "sesmt_date": "2026-08-12",
            "custom_reqs": "{}",
            "document_history": "[]",
            "is_banned": 0,
            "is_admin_service": 0,
            "enable_control_id": 0
        },
        {
            "id": uuid.uuid4().hex,
            "name": "BACILIO CHACON PAEZ",
            "company": "NÃO INFORMADA",
            "document": "S/D 2",
            "aso_date": "2026-07-31",
            "sesmt_date": "2026-08-12",
            "custom_reqs": "{}",
            "document_history": "[]",
            "is_banned": 0,
            "is_admin_service": 0,
            "enable_control_id": 0
        }
    ]
    
    with conn.cursor() as cursor:
        for p in profiles:
            sql = """
                INSERT INTO third_party_profiles 
                (id, name, company, document, aso_date, sesmt_date, custom_reqs, document_history, is_banned, is_admin_service, enable_control_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                p["id"], p["name"], p["company"], p["document"], 
                p["aso_date"], p["sesmt_date"], p["custom_reqs"], p["document_history"],
                p["is_banned"], p["is_admin_service"], p["enable_control_id"]
            ))
            print(f"Inserido: {p['name']}")
    
    conn.commit()
    conn.close()
    print("Sucesso!")
except Exception as e:
    print(f"Error: {e}")
