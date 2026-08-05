from sqlalchemy import Column, String, JSON, Boolean
from app.database.database import Base

class ThirdPartyProfile(Base):
    __tablename__ = "third_party_profiles"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    document = Column(String(50), unique=True, index=True, nullable=False)
    internal_contact = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    vehicle_plate = Column(String(20), nullable=True)
    aso_date = Column(String(50), nullable=True)
    sesmt_training_date = Column(String(50), nullable=True)
    sesmt_date = Column(String(50), nullable=True)
    custom_reqs = Column(JSON, default={})
    document_history = Column(JSON, default=[])
    photo_url = Column(String(500), nullable=True)
    photo_date = Column(String(50), nullable=True)
    is_banned = Column(Boolean, default=False, nullable=True)
    ban_reason = Column(String(500), nullable=True)
    is_admin_service = Column(Boolean, default=False, nullable=True)
    enable_control_id = Column(Boolean, default=False, nullable=True)

class ThirdPartyEntry(Base):
    __tablename__ = "third_party_entries"

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
    aso_date = Column(String(50), nullable=True)
    sesmt_training_date = Column(String(50), nullable=True)
    sesmt_date = Column(String(50), nullable=True)
    custom_reqs = Column(JSON, default={})
    photo_url = Column(String(500), nullable=True)
    photo_date = Column(String(50), nullable=True)
    is_admin_service = Column(Boolean, default=False, nullable=True)
    enable_control_id = Column(Boolean, default=False, nullable=True)
    control_id_device_id = Column(String(50), nullable=True)

class ThirdPartyConfig(Base):
    __tablename__ = "third_party_configs"

    id = Column(String(100), primary_key=True, index=True)
    type = Column(String(50), nullable=False)
    value = Column(JSON, nullable=False)
