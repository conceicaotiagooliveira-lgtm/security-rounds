from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MovementBase(BaseModel):
    vehicle_id: int
    driver_name: str
    authorized_by: Optional[str] = None
    destination: Optional[str] = None
    departure_km: float
    estimated_distance_km: Optional[float] = None

class MovementCreate(MovementBase):
    pass

class MovementArrival(BaseModel):
    arrival_km: float
    arrival_authorized_by: Optional[str] = None

class Movement(MovementBase):
    id: int
    departure_time: datetime
    arrival_time: Optional[datetime] = None
    arrival_km: Optional[float] = None
    arrival_authorized_by: Optional[str] = None
    status: str

    class Config:
        from_attributes = True
