import os
import base64
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.visit import VisitProfile, VisitEntry, VisitConfig
from app.schemas.visit import (
    VisitProfileCreate, VisitProfileResponse,
    VisitEntryCreate, VisitEntryResponse,
    VisitConfigCreate, VisitConfigResponse
)

router = APIRouter(prefix="/visitas", tags=["Visits Control"])

UPLOAD_DIR = "uploads/visits"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_base64_image(base64_str: str) -> str:
    if not base64_str or not base64_str.startswith("data:image"):
        return None
    try:
        header, encoded = base64_str.split(",", 1)
        ext = header.split(";")[0].split("/")[1]
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(encoded))
        return f"/uploads/visits/{filename}"
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

# --- Profiles ---
@router.get("/profiles", response_model=List[VisitProfileResponse])
def get_profiles(db: Session = Depends(get_db)):
    return db.query(VisitProfile).all()

@router.post("/profiles", response_model=VisitProfileResponse)
def create_or_update_profile(profile: VisitProfileCreate, db: Session = Depends(get_db)):
    db_profile = db.query(VisitProfile).filter(VisitProfile.document == profile.document).first()
    
    photo_url = None
    if profile.photoBase64 and profile.photoBase64.startswith("data:image"):
        photo_url = save_base64_image(profile.photoBase64)
    elif profile.photo_url:
        photo_url = profile.photo_url

    profile_data = profile.dict(exclude={"photoBase64"})
    profile_data["photo_url"] = photo_url if photo_url else (db_profile.photo_url if db_profile else None)

    if db_profile:
        for key, value in profile_data.items():
            setattr(db_profile, key, value)
    else:
        db_profile = VisitProfile(**profile_data)
        db.add(db_profile)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile

# --- Entries ---
@router.get("/entries", response_model=List[VisitEntryResponse])
def get_entries(db: Session = Depends(get_db)):
    return db.query(VisitEntry).order_by(VisitEntry.check_in_time.desc()).all()

@router.post("/entries", response_model=VisitEntryResponse)
def create_or_update_entry(entry: VisitEntryCreate, db: Session = Depends(get_db)):
    db_entry = db.query(VisitEntry).filter(VisitEntry.id == entry.id).first()
    
    photo_url = None
    if entry.photoBase64 and entry.photoBase64.startswith("data:image"):
        photo_url = save_base64_image(entry.photoBase64)
    elif entry.photo_url:
        photo_url = entry.photo_url

    entry_data = entry.dict(exclude={"photoBase64"})
    entry_data["photo_url"] = photo_url if photo_url else (db_entry.photo_url if db_entry else None)

    if db_entry:
        for key, value in entry_data.items():
            setattr(db_entry, key, value)
    else:
        db_entry = VisitEntry(**entry_data)
        db.add(db_entry)
        
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/entries/{entry_id}")
def delete_entry(entry_id: str, db: Session = Depends(get_db)):
    db_entry = db.query(VisitEntry).filter(VisitEntry.id == entry_id).first()
    if db_entry:
        db.delete(db_entry)
        db.commit()
    return {"status": "ok"}

# --- Configs ---
@router.get("/configs", response_model=List[VisitConfigResponse])
def get_configs(db: Session = Depends(get_db)):
    return db.query(VisitConfig).all()

@router.post("/configs", response_model=VisitConfigResponse)
def create_or_update_config(config: VisitConfigCreate, db: Session = Depends(get_db)):
    db_config = db.query(VisitConfig).filter(VisitConfig.id == config.id).first()
    if db_config:
        db_config.value = config.value
        db_config.type = config.type
    else:
        db_config = VisitConfig(**config.dict())
        db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

@router.delete("/configs/{config_id}")
def delete_config(config_id: str, db: Session = Depends(get_db)):
    db_config = db.query(VisitConfig).filter(VisitConfig.id == config_id).first()
    if db_config:
        db.delete(db_config)
        db.commit()
    return {"status": "ok"}
