import pymysql
import uuid
from datetime import datetime

try:
    conn = pymysql.connect(
        host='192.168.0.53',
        user='root',
        password='qff77eti',
        database='fleet_control',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM third_party_profiles")
        profiles = cursor.fetchall()
        
        now_str = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        inserted = 0
        
        for p in profiles:
            entry_id = uuid.uuid4().hex
            sql = """
                INSERT INTO third_party_entries 
                (id, name, company, document, vehicle_plate, reason, destination, authorized_by, check_in_time, status,
                 aso_date, sesmt_training_date, sesmt_date, custom_reqs, photo_url, photo_date, is_admin_service, enable_control_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                entry_id,
                p['name'],
                p['company'],
                p['document'],
                p.get('vehicle_plate'),
                'Importação de Cadastro Base',
                'Geral',
                'Sistema',
                now_str,
                'Bloqueado',
                p.get('aso_date'),
                p.get('sesmt_training_date'),
                p.get('sesmt_date'),
                p.get('custom_reqs'),
                p.get('photo_url'),
                p.get('photo_date'),
                p.get('is_admin_service', False),
                p.get('enable_control_id', False)
            ))
            inserted += 1
            
        conn.commit()
        print(f"Inseridos {inserted} registros de entrada (status Bloqueado).")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
