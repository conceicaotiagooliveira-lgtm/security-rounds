from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.schemas.guard import GuardResponse

class PatrolRouteBase(BaseModel):
    name: str
    description: Optional[str] = None
    checkpoints: str = "[]"  # JSON string
    geofence: str = "[]"  # JSON string
    estimated_duration_min: int = 60
    is_active: bool = True
    start_time: Optional[datetime] = None
    repeat_every_minutes: Optional[int] = None
    tolerance_minutes: int = 15
    assigned_shift: Optional[str] = None
    assigned_guard_id: Optional[int] = None
    is_random_sequence: bool = False
    sequence_order: str = "default"
    notify_whatsapp: bool = False
    whatsapp_number: Optional[str] = None
    last_missed_alert_time: Optional[datetime] = None

class PatrolRouteResponse(PatrolRouteBase):
    id: int
    assigned_guard: Optional[GuardResponse] = None

    class Config:
        from_attributes = True
