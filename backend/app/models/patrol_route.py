from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.database import Base

class PatrolRoute(Base):
    __tablename__ = "patrol_routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    # JSON array: [{lat, lng, label, radius_m}]
    checkpoints = Column(Text, nullable=False, default="[]")
    # JSON array of polygon vertices: [[lat, lng], ...]
    geofence = Column(Text, nullable=False, default="[]")
    estimated_duration_min = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)

    # Agendamento e Atribuição
    start_time = Column(DateTime, nullable=True)
    repeat_every_minutes = Column(Integer, nullable=True)
    tolerance_minutes = Column(Integer, default=15)
    assigned_shift = Column(String(100), nullable=True)
    assigned_guard_id = Column(Integer, ForeignKey("guards.id"), nullable=True)
    is_random_sequence = Column(Boolean, default=False)
    sequence_order = Column(String(50), nullable=False, default="default")
    notify_whatsapp = Column(Boolean, default=False)
    whatsapp_number = Column(String(20), nullable=True)
    last_missed_alert_time = Column(DateTime, nullable=True)

    assigned_guard = relationship("Guard")
