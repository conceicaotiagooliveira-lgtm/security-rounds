import pymysql
import sqlite3
import os
from app.core.config import settings

# 1. Update MySQL database
try:
    conn = pymysql.connect(
        host=settings.MYSQL_HOST,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DB,
        port=int(settings.MYSQL_PORT),
        cursorclass=pymysql.cursors.DictCursor
    )
    with conn.cursor() as cursor:
        cursor.execute("SHOW TABLES LIKE 'keys_history';")
        if cursor.fetchone():
            cursor.execute("DESCRIBE keys_history;")
            columns = [row['Field'] for row in cursor.fetchall()]
            
            if 'authorized_by' not in columns:
                try:
                    cursor.execute("ALTER TABLE keys_history ADD COLUMN authorized_by VARCHAR(255) NULL;")
                    print("Added authorized_by column to MySQL keys_history")
                except Exception as e:
                    print(f"Error adding authorized_by to MySQL: {e}")
                    
            if 'returned_authorized_by' not in columns:
                try:
                    cursor.execute("ALTER TABLE keys_history ADD COLUMN returned_authorized_by VARCHAR(255) NULL;")
                    print("Added returned_authorized_by column to MySQL keys_history")
                except Exception as e:
                    print(f"Error adding returned_authorized_by to MySQL: {e}")
                    
    conn.commit()
    conn.close()
except Exception as e:
    print(f"MySQL Migration Note/Error: {e}")

# 2. Update local SQLite databases if any exist
db_files = ['app.db', 'database.db', 'fleet.db', 'sql_app.db', 'fleet_control.db']
for db_file in db_files:
    full_path = os.path.join(os.path.dirname(__file__), db_file)
    if os.path.exists(full_path):
        try:
            conn = sqlite3.connect(full_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='keys_history';")
            if cursor.fetchone():
                cursor.execute("PRAGMA table_info(keys_history);")
                columns = [row[1] for row in cursor.fetchall()]
                if 'authorized_by' not in columns:
                    cursor.execute("ALTER TABLE keys_history ADD COLUMN authorized_by VARCHAR(255);")
                if 'returned_authorized_by' not in columns:
                    cursor.execute("ALTER TABLE keys_history ADD COLUMN returned_authorized_by VARCHAR(255);")
                conn.commit()
            conn.close()
        except Exception as e:
            pass
