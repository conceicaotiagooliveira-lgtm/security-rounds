from sqlalchemy import Column, String
from app.database.database import Base

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(255), primary_key=True, index=True)
    value = Column(String(4000))  # We will store JSON as string here
