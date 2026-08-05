import pymysql
import uuid
import json
import csv
import re
from datetime import datetime

file_path = '/Server_vite/FrotaPatrimonial/terceiros.csv'

# Month mappings for formats like "novembro-27"
months = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
}

def extract_date(d_str):
    if not d_str: return ""
    d_str = str(d_str).strip().lower()
    
    # Try finding DD/MM/YYYY or DD/MM/YY
    match = re.search(r'(\d{2})[-/](\d{2})[-/](\d{2,4})', d_str)
    if match:
        day, month, year = match.groups()
        if len(year) == 2:
            year = "20" + year
        try:
            # Validate
            datetime(int(year), int(month), int(day))
            return f"{year}-{month}-{day}"
        except:
            pass
            
    # Try finding "mes-ano" like "novembro-27"
    for m_name, m_num in months.items():
        if m_name in d_str:
            match = re.search(r'(\d{2,4})', d_str)
            if match:
                year = match.group(1)
                if len(year) == 2:
                    year = "20" + year
                return f"{year}-{m_num}-01"  # Default to 1st of month
                
    return ""

try:
    conn = pymysql.connect(
        host='192.168.0.53',
        user='root',
        password='qff77eti',
        database='fleet_control',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    inserted = 0
    updated = 0
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        with conn.cursor() as cursor:
            for i, row in enumerate(reader):
                name = row.get("FUNCIONÁRIO", "").strip()
                if not name: continue
                
                sesmt_date = extract_date(row.get("Validade SESMT", ""))
                aso_date = extract_date(row.get("ASO", ""))
                
                custom_reqs = {}
                for nr in ["NR10", "NR12", "NR18", "NR33", "NR35", "NR11", "PEMT – PTA"]:
                    d = extract_date(row.get(nr, ""))
                    if d:
                        custom_reqs[nr] = d
                
                doc = f"IMP_{i+1}_{int(datetime.now().timestamp())}"
                company = "NÃO INFORMADA"
                
                cursor.execute("SELECT id FROM third_party_profiles WHERE name = %s", (name,))
                existing = cursor.fetchone()
                
                if existing:
                    cursor.execute("""
                        UPDATE third_party_profiles 
                        SET sesmt_date=%s, aso_date=%s, custom_reqs=%s
                        WHERE id=%s
                    """, (sesmt_date, aso_date, json.dumps(custom_reqs), existing['id']))
                    updated += 1
                else:
                    cursor.execute("""
                        INSERT INTO third_party_profiles 
                        (id, name, company, document, aso_date, sesmt_date, custom_reqs, document_history, is_banned, is_admin_service, enable_control_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, '[]', 0, 0, 0)
                    """, (uuid.uuid4().hex, name, company, doc, aso_date, sesmt_date, json.dumps(custom_reqs)))
                    inserted += 1
                
    conn.commit()
    conn.close()
    print(f"Sucesso! {inserted} inseridos, {updated} atualizados. Total: {inserted + updated}")
except Exception as e:
    print(f"Error: {e}")
