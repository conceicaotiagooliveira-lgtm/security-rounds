from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WhatsAppInstanceBase(BaseModel):
    name: str
    api_url: str
    api_key: str
    description: Optional[str] = None

class WhatsAppInstanceCreate(WhatsAppInstanceBase):
    pass

class WhatsAppInstanceUpdate(BaseModel):
    name: Optional[str] = None
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    description: Optional[str] = None

class WhatsAppInstanceResponse(WhatsAppInstanceBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    number: str
    text: str
