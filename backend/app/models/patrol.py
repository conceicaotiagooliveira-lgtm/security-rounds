from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class Patrol(Base):
    __tablename__ = "patrols"

    id = Column(Integer, primary_key=True, index=True)
    patrol_route_id = Column(Integer, ForeignKey("patrol_routes.id"), nullable=False)
    guard_id = Column(Integer, ForeignKey("guards.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    # "Em Andamento", "Concluída", "Incompleta", "Fora da Área"
    status = Column(String(50), default="Em Andamento")
    # JSON: [{checkpoint_index, visited_at, lat, lng}]
    checkpoints_visited = Column(Text, default="[]")
    # JSON: [{lat, lng, timestamp}]
    gps_track = Column(Text, default="[]")
    # JSON: [{type, message, timestamp, lat, lng}]
    alerts = Column(Text, default="[]")
    observations = Column(Text, nullable=True)
    delay_justification = Column(Text, nullable=True)

    patrol_route = relationship("PatrolRoute")
    guard = relationship("Guard")
