from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RefuelingCreate(BaseModel):
    current_km: float = Field(..., gt=0)
    liters: float = Field(..., gt=0)
    total_cost: float = Field(..., gt=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RefuelingAdminCreate(RefuelingCreate):
    driver_id: int

class RefuelingResponse(RefuelingCreate):
    id: int
    vehicle_id: int
    driver_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RefuelingReportResponse(RefuelingResponse):
    vehicle_plate: str
    driver_name: str
