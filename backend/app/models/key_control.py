from sqlalchemy import Column, String
from app.database.database import Base
from datetime import datetime
import pytz

def get_current_time():
    sp_tz = pytz.timezone('America/Sao_Paulo')
    return datetime.now(sp_tz).strftime('%Y-%m-%dT%H:%M:%S')

class KeyCabinet(Base):
    __tablename__ = "keys_cabinet"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="Disponível")
    current_borrower = Column(String(255), nullable=True)
    borrowed_at = Column(String(50), nullable=True)
    created_at = Column(String(50), nullable=False, default=get_current_time)

class KeyHistory(Base):
    __tablename__ = "keys_history"

    id = Column(String(100), primary_key=True, index=True)
    key_id = Column(String(100), nullable=False)
    key_name = Column(String(255), nullable=False)
    borrower = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    reason = Column(String(255), nullable=True) # purpose
    borrowed_time = Column(String(50), nullable=False) # borrowedAt
    authorized_by = Column(String(255), nullable=True)
    returned_time = Column(String(50), nullable=True) # returnedAt
    returned_by = Column(String(255), nullable=True)
    returned_authorized_by = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="Emprestada")

    @property
    def borrowed_at(self):
        return self.borrowed_time

    @property
    def returned_at(self):
        return self.returned_time

    @property
    def purpose(self):
        return self.reason
