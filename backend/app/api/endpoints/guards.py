from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.models.guard import Guard
from app.schemas.guard import GuardBase, GuardResponse

router = APIRouter()

@router.get("", response_model=List[GuardResponse])
def get_guards(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    guards = db.query(Guard).offset(skip).limit(limit).all()
    return guards

@router.post("", response_model=GuardResponse, status_code=status.HTTP_201_CREATED)
def create_guard(guard: GuardBase, db: Session = Depends(get_db)):
    # Check if registration already exists
    if db.query(Guard).filter(Guard.registration == guard.registration).first():
        raise HTTPException(status_code=400, detail="Vigia com esta matrícula já cadastrado.")

    new_guard = Guard(**guard.model_dump())
    db.add(new_guard)
    db.commit()
    db.refresh(new_guard)
    return new_guard

@router.put("/{guard_id}", response_model=GuardResponse)
def update_guard(guard_id: int, guard_update: GuardBase, db: Session = Depends(get_db)):
    db_guard = db.query(Guard).filter(Guard.id == guard_id).first()
    if not db_guard:
        raise HTTPException(status_code=404, detail="Vigia não encontrado")

    # Check if another guard has this registration
    conflict = db.query(Guard).filter(Guard.registration == guard_update.registration, Guard.id != guard_id).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Outro vigia já possui esta matrícula.")

    for key, value in guard_update.model_dump().items():
        setattr(db_guard, key, value)

    db.commit()
    db.refresh(db_guard)
    return db_guard

@router.delete("/{guard_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_guard(guard_id: int, db: Session = Depends(get_db)):
    db_guard = db.query(Guard).filter(Guard.id == guard_id).first()
    if not db_guard:
        raise HTTPException(status_code=404, detail="Vigia não encontrado")

    db.delete(db_guard)
    db.commit()
    return None
