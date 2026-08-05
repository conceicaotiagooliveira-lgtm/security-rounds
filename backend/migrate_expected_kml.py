import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE vehicles ADD COLUMN expected_kml FLOAT DEFAULT 0.0;"))
        conn.commit()
    print("Migration successful: added expected_kml to vehicles table.")
except Exception as e:
    print("Migration failed or already applied:", e)
