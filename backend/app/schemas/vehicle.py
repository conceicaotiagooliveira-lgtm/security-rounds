from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class VehicleBase(BaseModel):
    plate: str = Field(..., max_length=20)
    model: str = Field(..., max_length=100)
    brand: str = Field(..., max_length=100)
    year: int
    chassis: str = Field(..., max_length=100)
    renavam: str = Field(..., max_length=50)
    color: str = Field(..., max_length=50)
    current_km: float = 0.0
    status: str = Field(default="Ativo", max_length=50)
    fuel_type: str = Field(..., max_length=50)
    tank_capacity: float = 0.0
    expected_kml: float = 0.0
    oil_change_interval_km: float = 0.0
    last_oil_change_km: float = 0.0
    oil_alert_threshold_km: float = 1000.0
    notify_whatsapp_oil: bool = False
    whatsapp_numbers_oil: Optional[str] = None
    last_oil_alert_km: Optional[float] = None
    last_oil_alert_date: Optional[datetime] = None

class VehicleCreate(VehicleBase):
    driver_id: Optional[int] = None

class VehicleUpdate(BaseModel):
    plate: Optional[str] = Field(None, max_length=20)
    model: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    year: Optional[int] = None
    chassis: Optional[str] = Field(None, max_length=100)
    renavam: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    current_km: Optional[float] = None
    status: Optional[str] = Field(None, max_length=50)
    fuel_type: Optional[str] = Field(None, max_length=50)
    tank_capacity: Optional[float] = None
    expected_kml: Optional[float] = None
    oil_change_interval_km: Optional[float] = None
    last_oil_change_km: Optional[float] = None
    oil_alert_threshold_km: Optional[float] = None
    notify_whatsapp_oil: Optional[bool] = None
    whatsapp_numbers_oil: Optional[str] = None
    last_oil_alert_km: Optional[float] = None
    last_oil_alert_date: Optional[datetime] = None
    driver_id: Optional[int] = None

class VehicleResponse(VehicleBase):
    id: int
    photo_url: Optional[str] = None
    driver_id: Optional[int] = None
    recent_refuelings_count: int = 0

    class Config:
        from_attributes = True
