import re
import datetime
import pymysql
import os

# Database Config from .env
MYSQL_USER = "root"
MYSQL_PASSWORD = "sua_senha_aqui"
MYSQL_HOST = "192.168.0.53"
MYSQL_PORT = 3306
MYSQL_DB = "fleet_control"

def parse_date(date_str):
    # Format YYYYMMDD to YYYY-MM-DD
    if len(date_str) == 8:
        return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"
    return "2030-01-01"

def import_drivers():
    # Connect to database
    connection = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor
    )
    
    file_path = "/Server_vite/FrotaPatrimonial/port_004_dump.sql"
    
    # Regex to find tuples of values: ('01','01',183,'JULCEMAR SEIBERT',59,'111670130','20331127','A')
    # Be careful with strings that might contain quotes or escaped chars.
    # Simple regex for this specific file format:
    pattern = re.compile(r"\('(\d+)','(\d+)',(\d+),'([^']*)',(\d+),'([^']*)','([^']*)','([^']*)'\)")

    drivers_to_insert = []
    
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
        matches = pattern.findall(content)
        for match in matches:
            emp, filial, codigo, descricao, setor, numcnh, dtvalcnh, status = match
            
            # Formatting data
            name = descricao.strip()
            cnh = numcnh.strip()
            cnh_expiration = parse_date(dtvalcnh.strip())
            
            # Since the original table doesn't have CPF and our system requires a UNIQUE CPF,
            # we will generate a placeholder unique CPF using the 'codigo'.
            # Format: 999.000.XXX-XX
            fake_cpf = f"999.000.{int(codigo):03d}-{int(codigo)%99:02d}"
            
            # Map status 'A' to 'Disponível' (our system default active status)
            sys_status = "Disponível" if status == 'A' else "Inativo"
            
            drivers_to_insert.append((name, fake_cpf, cnh, cnh_expiration, sys_status))

    print(f"Found {len(drivers_to_insert)} drivers to import.")

    if not drivers_to_insert:
        print("No drivers matched the regex pattern. Please check the file structure.")
        return

    # Insert into database
    success_count = 0
    error_count = 0
    with connection.cursor() as cursor:
        for driver in drivers_to_insert:
            try:
                # Use IGNORE to skip duplicates based on UNIQUE constraints (like cnh or cpf)
                sql = """
                INSERT IGNORE INTO drivers (name, cpf, cnh, cnh_expiration, status)
                VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(sql, driver)
                if cursor.rowcount > 0:
                    success_count += 1
            except Exception as e:
                print(f"Error inserting {driver[0]}: {e}")
                error_count += 1
                
        connection.commit()
    
    connection.close()
    print(f"Import completed! Successfully inserted: {success_count}. Errors/Duplicates: {error_count}.")

if __name__ == "__main__":
    import_drivers()
