from sqlalchemy import Column, String, JSON, Boolean
from app.database.database import Base

class VisitProfile(Base):
    __tablename__ = "visit_profiles"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    document = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_plate = Column(String(20), nullable=True)
    document_history = Column(JSON, default=[])
    photo_url = Column(String(500), nullable=True)
    photo_date = Column(String(50), nullable=True)
    is_banned = Column(Boolean, default=False, nullable=True)
    ban_reason = Column(String(500), nullable=True)

class VisitEntry(Base):
    __tablename__ = "visit_entries"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    document = Column(String(50), nullable=False)
    vehicle_plate = Column(String(20), nullable=True)
    reason = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    authorized_by = Column(String(255), nullable=False)
    check_in_time = Column(String(50), nullable=False)
    check_out_time = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="Ativo")
    photo_url = Column(String(500), nullable=True)
    photo_date = Column(String(50), nullable=True)

class VisitConfig(Base):
    __tablename__ = "visit_configs"

    id = Column(String(100), primary_key=True, index=True)
    type = Column(String(50), nullable=False)
    value = Column(JSON, nullable=False)
