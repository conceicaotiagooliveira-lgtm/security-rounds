from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional, List, Dict, Any

class VisitBaseConfig(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

class VisitProfileBase(VisitBaseConfig):
    id: str
    name: str
    company: str
    document: str
    vehicle_plate: Optional[str] = None
    document_history: Optional[List[Dict[str, Any]]] = []
    photo_url: Optional[str] = None
    photo_date: Optional[str] = None
    is_banned: Optional[bool] = False
    ban_reason: Optional[str] = None

class VisitProfileCreate(VisitProfileBase):
    photoBase64: Optional[str] = None

class VisitProfileResponse(VisitProfileBase):
    pass

class VisitEntryBase(VisitBaseConfig):
    id: str
    name: str
    company: str
    document: str
    vehicle_plate: Optional[str] = None
    reason: str
    destination: str
    authorized_by: str
    check_in_time: str
    check_out_time: Optional[str] = None
    status: str
    photo_url: Optional[str] = None
    photo_date: Optional[str] = None

class VisitEntryCreate(VisitEntryBase):
    photoBase64: Optional[str] = None

class VisitEntryResponse(VisitEntryBase):
    pass

class VisitConfigBase(VisitBaseConfig):
    id: str
    type: str
    value: Any

class VisitConfigCreate(VisitConfigBase):
    pass

class VisitConfigResponse(VisitConfigBase):
    pass
