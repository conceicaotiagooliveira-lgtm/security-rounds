from pydantic import BaseModel
from typing import Optional

class GuardBase(BaseModel):
    name: str
    registration: str
    shift: str
    schedule: Optional[str] = None
    phone: Optional[str] = None
    status: str = "Ativo"
    user_id: Optional[int] = None
    auth_password: Optional[str] = None

class GuardResponse(GuardBase):
    id: int

    class Config:
        from_attributes = True
