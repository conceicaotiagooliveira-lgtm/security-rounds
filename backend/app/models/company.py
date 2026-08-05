from sqlalchemy import Column, String
from app.database.database import Base
from datetime import datetime
import pytz

def get_current_time():
    sp_tz = pytz.timezone('America/Sao_Paulo')
    return datetime.now(sp_tz).strftime('%Y-%m-%dT%H:%M:%S')

class Company(Base):
    __tablename__ = "companies"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    corporate_name = Column(String(255), nullable=True)
    cnpj = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    manager = Column(String(255), nullable=True)
    activity_area = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="Ativo")
    created_at = Column(String(50), nullable=False, default=get_current_time)
