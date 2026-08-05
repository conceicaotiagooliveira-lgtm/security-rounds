from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.database.database import Base

class WhatsAppInstance(Base):
    __tablename__ = "whatsapp_instances"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    api_url = Column(String(255), nullable=False)
    api_key = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Desconectado")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
