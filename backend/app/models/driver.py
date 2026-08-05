from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cpf = Column(String(14), unique=True, index=True, nullable=False)
    cnh = Column(String(20), unique=True, nullable=False)
    cnh_expiration = Column(Date, nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    photo_url = Column(String(255), nullable=True)
    status = Column(String(50), default="Disponível")
    
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    vehicle = relationship("Vehicle")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User")
