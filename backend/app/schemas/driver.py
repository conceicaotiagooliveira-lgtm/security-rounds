from pydantic import BaseModel
from typing import Optional
from datetime import date
from .vehicle import VehicleResponse

class DriverBase(BaseModel):
    name: str
    cpf: str
    cnh: str
    cnh_expiration: date
    phone: Optional[str] = None
    email: Optional[str] = None
    status: str = "Disponível"
    vehicle_id: Optional[int] = None
    user_id: Optional[int] = None

class DriverResponse(DriverBase):
    id: int
    photo_url: Optional[str] = None
    vehicle: Optional[VehicleResponse] = None

    class Config:
        from_attributes = True
