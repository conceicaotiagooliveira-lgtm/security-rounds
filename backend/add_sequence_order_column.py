import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE patrol_routes ADD COLUMN sequence_order VARCHAR(50) DEFAULT 'default';"))
        conn.commit()
    print("Migration successful: added sequence_order column to patrol_routes table.")
except Exception as e:
    print("Migration failed or already applied:", e)
