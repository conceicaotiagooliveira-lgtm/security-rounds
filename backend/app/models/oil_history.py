from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class VehicleOilHistory(Base):
    __tablename__ = "vehicle_oil_history"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    km_at_change = Column(Float, nullable=False)
    notes = Column(String(500), nullable=True)

    vehicle = relationship("Vehicle", backref="oil_history")
