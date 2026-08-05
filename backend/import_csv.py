import pymysql
import uuid
import json
import csv
import io
from datetime import datetime

csv_data = """FUNCIONÁRIO;Validade SESMT;NR10;NR12;NR18;NR33;NR35;NR11;PEMT – PTA;ASO
ANDERSON LUIZ DA ROSA;12/08/2026;;;;;;;;31/07/2026
BACILIO CHACON PAEZ;12/08/2026;;;;;;;;31/07/2026"""

def convert_date(d_str):
    if not d_str: return ""
    try:
        # DD/MM/YYYY to YYYY-MM-DD
        return datetime.strptime(d_str.strip(), "%d/%m/%Y").strftime("%Y-%m-%d")
    except:
        return ""

try:
    conn = pymysql.connect(
        host='192.168.0.53',
        user='root',
        password='qff77eti',
        database='fleet_control',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    f = io.StringIO(csv_data)
    reader = csv.DictReader(f, delimiter=';')
    
    inserted = 0
    with conn.cursor() as cursor:
        for i, row in enumerate(reader):
            name = row.get("FUNCIONÁRIO", "").strip()
            if not name: continue
            
            sesmt_date = convert_date(row.get("Validade SESMT", ""))
            aso_date = convert_date(row.get("ASO", ""))
            
            custom_reqs = {}
            for nr in ["NR10", "NR12", "NR18", "NR33", "NR35", "NR11", "PEMT – PTA"]:
                d = convert_date(row.get(nr, ""))
                if d:
                    custom_reqs[nr] = d
            
            # Since no CPF, we generate one to bypass UNIQUE constraint
            doc = f"IMP_{i+1}_{int(datetime.now().timestamp())}"
            company = "NÃO INFORMADA"
            
            # Check if name already exists to avoid pure duplicates in this test
            cursor.execute("SELECT id FROM third_party_profiles WHERE name = %s", (name,))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing
                cursor.execute("""
                    UPDATE third_party_profiles 
                    SET sesmt_date=%s, aso_date=%s, custom_reqs=%s
                    WHERE id=%s
                """, (sesmt_date, aso_date, json.dumps(custom_reqs), existing['id']))
            else:
                cursor.execute("""
                    INSERT INTO third_party_profiles 
                    (id, name, company, document, aso_date, sesmt_date, custom_reqs, document_history, is_banned, is_admin_service, enable_control_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, '[]', 0, 0, 0)
                """, (uuid.uuid4().hex, name, company, doc, aso_date, sesmt_date, json.dumps(custom_reqs)))
            inserted += 1
            
    conn.commit()
    conn.close()
    print(f"Sucesso! {inserted} processados.")
except Exception as e:
    print(f"Error: {e}")
