from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OilHistoryBase(BaseModel):
    km_at_change: float
    date: Optional[datetime] = None
    notes: Optional[str] = None

class OilHistoryCreate(OilHistoryBase):
    pass

class OilHistoryResponse(OilHistoryBase):
    id: int
    vehicle_id: int
    date: datetime

    class Config:
        from_attributes = True
