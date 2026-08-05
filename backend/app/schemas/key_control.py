from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional

class KeyBaseConfig(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

class KeyCabinetBase(KeyBaseConfig):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "Disponível"
    current_borrower: Optional[str] = None
    borrowed_at: Optional[str] = None

class KeyCabinetCreate(KeyCabinetBase):
    pass

class KeyCabinetResponse(KeyCabinetBase):
    id: str
    created_at: str

class KeyHistoryBase(KeyBaseConfig):
    key_id: str
    key_name: str
    borrower: str
    department: str
    purpose: Optional[str] = None
    borrowed_at: str
    authorized_by: Optional[str] = None
    returned_at: Optional[str] = None
    returned_by: Optional[str] = None
    returned_authorized_by: Optional[str] = None
    status: Optional[str] = "Emprestada"

class KeyHistoryCreate(KeyHistoryBase):
    id: str

class KeyHistoryResponse(KeyHistoryBase):
    id: str
