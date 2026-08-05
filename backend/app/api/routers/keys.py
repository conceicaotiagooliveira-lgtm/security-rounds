from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.database import get_db
from app.models.key_control import KeyCabinet, KeyHistory
from app.schemas.key_control import KeyCabinetCreate, KeyCabinetResponse, KeyHistoryCreate, KeyHistoryResponse

router = APIRouter(prefix="/api/keys", tags=["keys"])

# --- Cabinet ---
@router.get("/cabinet", response_model=List[KeyCabinetResponse])
def get_cabinet(db: Session = Depends(get_db)):
    return db.query(KeyCabinet).all()

@router.post("/cabinet", response_model=KeyCabinetResponse)
def create_key(key_in: KeyCabinetCreate, db: Session = Depends(get_db)):
    new_key = KeyCabinet(
        id=str(uuid.uuid4()),
        name=key_in.name,
        description=key_in.description,
        status=key_in.status,
        current_borrower=key_in.current_borrower,
        borrowed_at=key_in.borrowed_at
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    return new_key

@router.put("/cabinet/{key_id}", response_model=KeyCabinetResponse)
def update_key(key_id: str, key_in: KeyCabinetCreate, db: Session = Depends(get_db)):
    db_key = db.query(KeyCabinet).filter(KeyCabinet.id == key_id).first()
    if not db_key:
        raise HTTPException(status_code=404, detail="Key not found")
    
    db_key.name = key_in.name
    db_key.description = key_in.description
    db_key.status = key_in.status
    db_key.current_borrower = key_in.current_borrower
    db_key.borrowed_at = key_in.borrowed_at
    db.commit()
    db.refresh(db_key)
    return db_key

@router.delete("/cabinet/{key_id}")
def delete_key(key_id: str, db: Session = Depends(get_db)):
    db_key = db.query(KeyCabinet).filter(KeyCabinet.id == key_id).first()
    if not db_key:
        raise HTTPException(status_code=404, detail="Key not found")
    
    db.delete(db_key)
    db.commit()
    return {"message": "Key deleted"}

# --- History ---
@router.get("/history", response_model=List[KeyHistoryResponse])
def get_history(db: Session = Depends(get_db)):
    return db.query(KeyHistory).order_by(KeyHistory.borrowed_time.desc()).all()

@router.post("/history", response_model=KeyHistoryResponse)
def create_history_entry(entry_in: KeyHistoryCreate, db: Session = Depends(get_db)):
    new_entry = KeyHistory(
        id=entry_in.id,
        key_id=entry_in.key_id,
        key_name=entry_in.key_name,
        borrower=entry_in.borrower,
        department=entry_in.department,
        reason=entry_in.purpose,
        borrowed_time=entry_in.borrowed_at,
        authorized_by=entry_in.authorized_by,
        returned_time=entry_in.returned_at,
        returned_by=entry_in.returned_by,
        returned_authorized_by=entry_in.returned_authorized_by,
        status=entry_in.status
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.put("/history/{entry_id}", response_model=KeyHistoryResponse)
def update_history_entry(entry_id: str, entry_in: KeyHistoryCreate, db: Session = Depends(get_db)):
    db_entry = db.query(KeyHistory).filter(KeyHistory.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    
    db_entry.returned_time = entry_in.returned_at
    db_entry.returned_by = entry_in.returned_by
    db_entry.returned_authorized_by = entry_in.returned_authorized_by
    if entry_in.authorized_by:
        db_entry.authorized_by = entry_in.authorized_by
    db_entry.status = entry_in.status
    db.commit()
    db.refresh(db_entry)
    return db_entry
