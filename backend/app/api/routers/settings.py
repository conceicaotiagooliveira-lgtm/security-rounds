from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any, Optional

from app.database.database import get_db
from app.models.setting import Setting

router = APIRouter()

class SettingItem(BaseModel):
    key: str
    value: str

@router.get("/{key}")
def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"key": setting.key, "value": setting.value}

@router.post("/")
def save_setting(item: SettingItem, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == item.key).first()
    if setting:
        setting.value = item.value
    else:
        setting = Setting(key=item.key, value=item.value)
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    return {"key": setting.key, "value": setting.value}
