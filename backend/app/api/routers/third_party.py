import os
import base64
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.third_party import ThirdPartyProfile, ThirdPartyEntry, ThirdPartyConfig
from app.schemas.third_party import (
    ThirdPartyProfileCreate, ThirdPartyProfileResponse,
    ThirdPartyEntryCreate, ThirdPartyEntryResponse,
    ThirdPartyConfigCreate, ThirdPartyConfigResponse
)
from datetime import datetime

router = APIRouter(prefix="/terceiros", tags=["Third Party Control"])

UPLOAD_DIR = "uploads/third_party"
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
        return f"/uploads/third_party/{filename}"
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

# --- Profiles ---
@router.get("/profiles", response_model=List[ThirdPartyProfileResponse])
def get_profiles(db: Session = Depends(get_db)):
    return db.query(ThirdPartyProfile).all()

@router.post("/profiles", response_model=ThirdPartyProfileResponse)
def create_or_update_profile(profile: ThirdPartyProfileCreate, db: Session = Depends(get_db)):
    print("INCOMING PROFILE JSON:", profile.json())
    
    # Busca primariamente pelo ID para permitir edição do documento
    db_profile = db.query(ThirdPartyProfile).filter(ThirdPartyProfile.id == profile.id).first()
    
    # Se não achou por ID, verifica se já existe alguém com esse documento (para evitar duplicidade na criação)
    if not db_profile:
        existing_doc = db.query(ThirdPartyProfile).filter(ThirdPartyProfile.document == profile.document).first()
        if existing_doc:
            raise HTTPException(status_code=400, detail="Este documento já está cadastrado em outro perfil.")
    
    photo_url = None
    if profile.photoBase64 and profile.photoBase64.startswith("data:image"):
        photo_url = save_base64_image(profile.photoBase64)
    elif profile.photo_url:
        photo_url = profile.photo_url

    profile_data = profile.dict(exclude={"photoBase64"})
    profile_data["photo_url"] = photo_url if photo_url else (db_profile.photo_url if db_profile else None)
    
    # Force map toggles
    profile_data["is_admin_service"] = profile.isAdminService
    profile_data["enable_control_id"] = profile.enableControlId
    profile_data.pop("isAdminService", None)
    profile_data.pop("enableControlId", None)
    
    print("PROFILE DATA DICT:", profile_data)

    if db_profile:
        old_document = db_profile.document
        new_document = profile_data.get("document")
        
        if new_document and new_document != old_document:
            existing_doc = db.query(ThirdPartyProfile).filter(ThirdPartyProfile.document == new_document).first()
            if existing_doc:
                raise HTTPException(status_code=400, detail="Este documento já está cadastrado em outro perfil.")
        
        for key, value in profile_data.items():
            setattr(db_profile, key, value)
            
        if old_document and new_document and old_document != new_document:
            db.query(ThirdPartyEntry).filter(ThirdPartyEntry.document == old_document).update({"document": new_document}, synchronize_session=False)
            
    else:
        db_profile = ThirdPartyProfile(**profile_data)
        db.add(db_profile)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.delete("/profiles/{profile_id}")
def delete_profile(profile_id: str, db: Session = Depends(get_db)):
    db_profile = db.query(ThirdPartyProfile).filter(ThirdPartyProfile.id == profile_id).first()
    if db_profile:
        # Cascade delete entries
        db.query(ThirdPartyEntry).filter(ThirdPartyEntry.document == db_profile.document).delete(synchronize_session=False)
        db.delete(db_profile)
        db.commit()
    return {"status": "ok"}

@router.post("/profiles/bulk-delete")
def bulk_delete_profiles(payload: dict, db: Session = Depends(get_db)):
    ids = payload.get("ids", [])
    if not ids:
        return {"status": "ok", "deleted": 0}
        
    profiles = db.query(ThirdPartyProfile).filter(ThirdPartyProfile.id.in_(ids)).all()
    documents = [p.document for p in profiles]
    
    if documents:
        db.query(ThirdPartyEntry).filter(ThirdPartyEntry.document.in_(documents)).delete(synchronize_session=False)
        
    deleted = db.query(ThirdPartyProfile).filter(ThirdPartyProfile.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"status": "ok", "deleted": deleted}

# --- Entries ---
@router.get("/entries", response_model=List[ThirdPartyEntryResponse])
def get_entries(db: Session = Depends(get_db)):
    return db.query(ThirdPartyEntry).order_by(ThirdPartyEntry.check_in_time.desc()).all()

@router.post("/entries", response_model=ThirdPartyEntryResponse)
def create_or_update_entry(entry: ThirdPartyEntryCreate, db: Session = Depends(get_db)):
    db_entry = db.query(ThirdPartyEntry).filter(ThirdPartyEntry.id == entry.id).first()
    
    photo_url = None
    if entry.photoBase64 and entry.photoBase64.startswith("data:image"):
        photo_url = save_base64_image(entry.photoBase64)
    elif entry.photo_url:
        photo_url = entry.photo_url

    entry_data = entry.dict(exclude={"photoBase64"})
    entry_data["photo_url"] = photo_url if photo_url else (db_entry.photo_url if db_entry else None)
    
    # Force map toggles
    entry_data["is_admin_service"] = entry.isAdminService
    entry_data["enable_control_id"] = entry.enableControlId
    entry_data.pop("isAdminService", None)
    entry_data.pop("enableControlId", None)

    if db_entry:
        for key, value in entry_data.items():
            setattr(db_entry, key, value)
    else:
        db_entry = ThirdPartyEntry(**entry_data)
        db.add(db_entry)
        
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/entries/{entry_id}")
def delete_entry(entry_id: str, db: Session = Depends(get_db)):
    db_entry = db.query(ThirdPartyEntry).filter(ThirdPartyEntry.id == entry_id).first()
    if db_entry:
        db.delete(db_entry)
        db.commit()
    return {"status": "ok"}

@router.post("/entries/bulk-delete")
def bulk_delete_entries(payload: dict, db: Session = Depends(get_db)):
    ids = payload.get("ids", [])
    if not ids:
        return {"status": "ok", "deleted": 0}
    deleted = db.query(ThirdPartyEntry).filter(ThirdPartyEntry.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"status": "ok", "deleted": deleted}

# --- Configs ---
@router.get("/configs", response_model=List[ThirdPartyConfigResponse])
def get_configs(db: Session = Depends(get_db)):
    return db.query(ThirdPartyConfig).all()

@router.post("/configs", response_model=ThirdPartyConfigResponse)
def create_or_update_config(config: ThirdPartyConfigCreate, db: Session = Depends(get_db)):
    db_config = db.query(ThirdPartyConfig).filter(ThirdPartyConfig.id == config.id).first()
    if db_config:
        db_config.type = config.type
        db_config.value = config.value
    else:
        db_config = ThirdPartyConfig(**config.dict())
        db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

# --- Bulk Import ---
@router.post("/import_bulk")
def import_bulk(profiles: List[ThirdPartyProfileCreate], db: Session = Depends(get_db)):
    imported_count = 0
    now_str = datetime.now().strftime('%d/%m/%Y %H:%M:%S')

    for profile in profiles:
        # Create or update profile
        db_profile = db.query(ThirdPartyProfile).filter(ThirdPartyProfile.id == profile.id).first()
        if not db_profile:
            existing_doc = db.query(ThirdPartyProfile).filter(ThirdPartyProfile.document == profile.document).first()
            if existing_doc:
                db_profile = existing_doc
        
        profile_data = profile.dict(exclude={"photoBase64"})
        # Force map toggles
        profile_data["is_admin_service"] = profile.isAdminService
        profile_data["enable_control_id"] = profile.enableControlId
        profile_data.pop("isAdminService", None)
        profile_data.pop("enableControlId", None)

        if db_profile:
            for key, value in profile_data.items():
                if value is not None:
                    setattr(db_profile, key, value)
        else:
            db_profile = ThirdPartyProfile(**profile_data)
            db.add(db_profile)
            
        # Create Entry
        entry_id = uuid.uuid4().hex
        db_entry = ThirdPartyEntry(
            id=entry_id,
            name=db_profile.name,
            company=db_profile.company,
            document=db_profile.document,
            vehicle_plate=db_profile.vehicle_plate,
            reason="Importação Inicial",
            destination="Geral",
            authorized_by="Sistema",
            check_in_time=now_str,
            status="Bloqueado",
            aso_date=db_profile.aso_date,
            sesmt_training_date=db_profile.sesmt_training_date,
            sesmt_date=db_profile.sesmt_date,
            custom_reqs=db_profile.custom_reqs,
            photo_url=db_profile.photo_url,
            photo_date=db_profile.photo_date,
            is_admin_service=db_profile.is_admin_service,
            enable_control_id=db_profile.enable_control_id
        )
        db.add(db_entry)
        imported_count += 1

    db.commit()
    return {"status": "ok", "imported": imported_count}

@router.delete("/configs/{config_id}")
def delete_config(config_id: str, db: Session = Depends(get_db)):
    db_config = db.query(ThirdPartyConfig).filter(ThirdPartyConfig.id == config_id).first()
    if db_config:
        db.delete(db_config)
        db.commit()
    return {"status": "ok"}
