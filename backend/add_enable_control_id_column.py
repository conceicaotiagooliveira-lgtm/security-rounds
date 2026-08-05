import os
import sys

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database.database import engine

def add_column(table_name, column_name, column_type):
    try:
        with engine.begin() as conn:
            # For MySQL, we can just try to add the column, it will throw an error if it exists.
            # But let's check first.
            result = conn.execute(text(f"SHOW COLUMNS FROM {table_name} LIKE '{column_name}'"))
            if result.fetchone() is None:
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
                print(f"Added column {column_name} to {table_name}")
            else:
                print(f"Column {column_name} already exists in {table_name}")
    except Exception as e:
        print(f"Error adding column to {table_name}: {e}")

if __name__ == "__main__":
    add_column("third_party_profiles", "enable_control_id", "BOOLEAN DEFAULT 0")
    add_column("third_party_entries", "enable_control_id", "BOOLEAN DEFAULT 0")
