from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.refueling import Refueling

DATABASE_URL = "mysql+pymysql://root:sua_senha_aqui@localhost:3306/fleet_control"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

refs = db.query(Refueling).all()
for r in refs:
    print(f"Vehicle: {r.vehicle_id}, Lat: {r.latitude}, Lng: {r.longitude}")
db.close()
