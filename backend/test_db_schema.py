import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@{os.getenv('MYSQL_HOST')}:{os.getenv('MYSQL_PORT')}/{os.getenv('MYSQL_DB')}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    print("PROFILES COLUMNS:")
    res = conn.execute(text("DESCRIBE third_party_profiles"))
    for row in res:
        print(row[0])
    print("\nENTRIES COLUMNS:")
    res2 = conn.execute(text("DESCRIBE third_party_entries"))
    for row in res2:
        print(row[0])
