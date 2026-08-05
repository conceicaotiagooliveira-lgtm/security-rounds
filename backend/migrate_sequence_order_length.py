import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE patrol_routes MODIFY COLUMN sequence_order VARCHAR(255) DEFAULT 'default';"))
        conn.commit()
    print("Migration successful: increased sequence_order length to VARCHAR(255).")
except Exception as e:
    print("Migration failed or already applied:", e)
