from sqlalchemy import Column, Integer, String, Boolean, JSON
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="Operador")
    permissions = Column(JSON, nullable=True, default=list)
    is_active = Column(Boolean, default=True)
