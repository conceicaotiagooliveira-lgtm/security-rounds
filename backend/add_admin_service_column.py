import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_PORT = os.getenv('MYSQL_PORT')
MYSQL_DB = os.getenv('MYSQL_DB')

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    # Check if column exists in third_party_profiles
    res_profiles = conn.execute(text("SHOW COLUMNS FROM third_party_profiles LIKE 'is_admin_service'"))
    if not res_profiles.fetchone():
        print("Adding is_admin_service to third_party_profiles")
        conn.execute(text("ALTER TABLE third_party_profiles ADD COLUMN is_admin_service BOOLEAN DEFAULT FALSE"))
    else:
        print("is_admin_service already exists in third_party_profiles")
        
    # Check if column exists in third_party_entries
    res_entries = conn.execute(text("SHOW COLUMNS FROM third_party_entries LIKE 'is_admin_service'"))
    if not res_entries.fetchone():
        print("Adding is_admin_service to third_party_entries")
        conn.execute(text("ALTER TABLE third_party_entries ADD COLUMN is_admin_service BOOLEAN DEFAULT FALSE"))
    else:
        print("is_admin_service already exists in third_party_entries")

    conn.commit()

print("Migration completed.")
