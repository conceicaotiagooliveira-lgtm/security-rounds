from app.database.database import SessionLocal
from app.models.refueling import Refueling

db = SessionLocal()
refs = db.query(Refueling).all()
for r in refs:
    print(f"Vehicle: {r.vehicle_id}, Lat: {r.latitude}, Lng: {r.longitude}")
db.close()
