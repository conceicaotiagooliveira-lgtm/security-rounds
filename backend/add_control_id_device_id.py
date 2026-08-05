from sqlalchemy import text
from app.database.database import engine

def upgrade():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE third_party_entries ADD COLUMN control_id_device_id VARCHAR(50) DEFAULT NULL;"))
            print("Successfully added control_id_device_id to third_party_entries.")
        except Exception as e:
            print(f"Column might already exist or error occurred: {e}")

if __name__ == "__main__":
    upgrade()
