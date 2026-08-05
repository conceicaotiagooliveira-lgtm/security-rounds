from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.guard import GuardResponse

class PatrolStart(BaseModel):
    patrol_route_id: int
    delay_justification: Optional[str] = None

class PatrolCheckpointVisit(BaseModel):
    checkpoint_index: int
    lat: float
    lng: float

class PatrolPositionUpdate(BaseModel):
    lat: float
    lng: float

class PatrolFinish(BaseModel):
    observations: Optional[str] = None

class PatrolResponse(BaseModel):
    id: int
    patrol_route_id: int
    guard_id: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    checkpoints_visited: str = "[]"
    gps_track: str = "[]"
    alerts: str = "[]"
    observations: Optional[str] = None
    delay_justification: Optional[str] = None
    guard: Optional[GuardResponse] = None

    class Config:
        from_attributes = True
