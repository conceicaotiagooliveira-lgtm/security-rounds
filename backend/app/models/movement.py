from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.database import Base

class Movement(Base):
    __tablename__ = "movements"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_name = Column(String(255), nullable=False)
    authorized_by = Column(String(255), nullable=True)
    destination = Column(String(255), nullable=True)
    
    departure_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    departure_km = Column(Float, nullable=False)
    
    estimated_distance_km = Column(Float, nullable=True)
    
    arrival_time = Column(DateTime(timezone=True), nullable=True)
    arrival_km = Column(Float, nullable=True)
    arrival_authorized_by = Column(String(255), nullable=True)
    
    status = Column(String(50), default="EM USO")  # EM USO or CONCLUIDO
