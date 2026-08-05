import sys
sys.path.append('.')
from app.database.database import engine, Base
from app.models.oil_history import VehicleOilHistory

print("Creating vehicle_oil_history table...")
VehicleOilHistory.__table__.create(bind=engine, checkfirst=True)
print("Table created successfully!")
