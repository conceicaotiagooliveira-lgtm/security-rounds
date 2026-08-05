from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.database.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String(20), unique=True, index=True, nullable=False)
    model = Column(String(100), nullable=False)
    brand = Column(String(100), nullable=False)
    year = Column(Integer)
    chassis = Column(String(100), unique=True)
    renavam = Column(String(50), unique=True)
    color = Column(String(50))
    current_km = Column(Float, default=0.0)
    status = Column(String(50), default="Ativo")
    fuel_type = Column(String(50))
    tank_capacity = Column(Float)
    expected_kml = Column(Float, default=0.0)
    photo_url = Column(String(255), nullable=True)
    oil_change_interval_km = Column(Float, default=0.0)
    last_oil_change_km = Column(Float, default=0.0)
    oil_alert_threshold_km = Column(Float, default=1000.0)
    notify_whatsapp_oil = Column(Boolean, default=False)
    whatsapp_numbers_oil = Column(String(255), nullable=True)
    last_oil_alert_km = Column(Float, nullable=True)
    last_oil_alert_date = Column(DateTime, nullable=True)
