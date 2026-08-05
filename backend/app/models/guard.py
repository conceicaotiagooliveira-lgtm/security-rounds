from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class Guard(Base):
    __tablename__ = "guards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    registration = Column(String(50), unique=True, index=True, nullable=False)  # matrícula
    shift = Column(String(100), nullable=False)  # ex: "Diurno", "Noturno", "12x36"
    schedule = Column(String(100), nullable=True)  # ex: "18:00 - 06:00"
    phone = Column(String(20), nullable=True)
    status = Column(String(50), default="Ativo")
    auth_password = Column(String(255), nullable=True)  # Senha para autorizar saídas/entradas
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User")
