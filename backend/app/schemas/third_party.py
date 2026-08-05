from pydantic import BaseModel, ConfigDict, computed_field
from pydantic.alias_generators import to_camel
from typing import Optional, List, Dict, Any

class ThirdPartyBaseConfig(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

class ThirdPartyProfileBase(ThirdPartyBaseConfig):
    id: str
    name: str
    company: str
    document: str
    internal_contact: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    vehicle_plate: Optional[str] = None
    aso_date: Optional[str] = None
    sesmt_training_date: Optional[str] = None
    sesmt_date: Optional[str] = None
    custom_reqs: Optional[Dict[str, Any]] = {}
    document_history: Optional[List[Dict[str, Any]]] = []
    photo_url: Optional[str] = None
    photo_date: Optional[str] = None
    is_banned: Optional[bool] = False
    ban_reason: Optional[str] = None
    is_admin_service: Optional[bool] = False
    enable_control_id: Optional[bool] = False

    @computed_field
    @property
    def isAdminService(self) -> Optional[bool]:
        return self.is_admin_service
        
    @computed_field
    @property
    def enableControlId(self) -> Optional[bool]:
        return self.enable_control_id

class ThirdPartyProfileCreate(ThirdPartyProfileBase):
    photoBase64: Optional[str] = None

class ThirdPartyProfileResponse(ThirdPartyProfileBase):
    pass

class ThirdPartyEntryBase(ThirdPartyBaseConfig):
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
    aso_date: Optional[str] = None
    sesmt_training_date: Optional[str] = None
    sesmt_date: Optional[str] = None
    custom_reqs: Optional[Dict[str, Any]] = {}
    photo_url: Optional[str] = None
    photo_date: Optional[str] = None
    is_admin_service: Optional[bool] = False
    enable_control_id: Optional[bool] = False

    @computed_field
    @property
    def isAdminService(self) -> Optional[bool]:
        return self.is_admin_service
        
    @computed_field
    @property
    def enableControlId(self) -> Optional[bool]:
        return self.enable_control_id

class ThirdPartyEntryCreate(ThirdPartyEntryBase):
    photoBase64: Optional[str] = None

class ThirdPartyEntryResponse(ThirdPartyEntryBase):
    pass

class ThirdPartyConfigBase(ThirdPartyBaseConfig):
    id: str
    type: str
    value: Any

class ThirdPartyConfigCreate(ThirdPartyConfigBase):
    pass

class ThirdPartyConfigResponse(ThirdPartyConfigBase):
    pass
