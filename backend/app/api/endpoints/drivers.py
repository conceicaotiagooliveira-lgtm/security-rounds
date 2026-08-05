from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import uuid

from app.database.database import get_db
from app.models.driver import Driver
from app.schemas.driver import DriverBase, DriverResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

# Directory for storing driver photos
UPLOAD_DIR = "uploads/drivers"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=List[DriverResponse])
def get_drivers(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    drivers = db.query(Driver).order_by(Driver.name).offset(skip).limit(limit).all()
    return drivers

@router.post("", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(driver: DriverBase, db: Session = Depends(get_db)):
    # Check if CPF already exists
    if db.query(Driver).filter(Driver.cpf == driver.cpf).first():
        raise HTTPException(status_code=400, detail="Motorista com este CPF já cadastrado.")
    
    # Check if CNH already exists
    if db.query(Driver).filter(Driver.cnh == driver.cnh).first():
        raise HTTPException(status_code=400, detail="Motorista com esta CNH já cadastrado.")

    new_driver = Driver(
        name=driver.name,
        cpf=driver.cpf,
        cnh=driver.cnh,
        cnh_expiration=driver.cnh_expiration,
        phone=driver.phone,
        email=driver.email,
        status=driver.status,
        vehicle_id=driver.vehicle_id,
        user_id=driver.user_id
    )
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver

@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(driver_id: int, driver_update: DriverBase, db: Session = Depends(get_db)):
    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Motorista não encontrado")
    
    # Check if another driver has this CPF
    cpf_conflict = db.query(Driver).filter(Driver.cpf == driver_update.cpf, Driver.id != driver_id).first()
    if cpf_conflict:
        raise HTTPException(status_code=400, detail="Outro motorista já possui este CPF.")

    for key, value in driver_update.model_dump().items():
        setattr(db_driver, key, value)
        
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Motorista não encontrado")
    
    # Remove photo if exists
    if db_driver.photo_url:
        file_path = f"uploads/{db_driver.photo_url.split('/uploads/')[1]}"
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(db_driver)
    db.commit()
    return None

@router.post("/{driver_id}/photo")
def upload_driver_photo(driver_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Motorista não encontrado")

    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update database
    photo_url = f"/uploads/drivers/{filename}"
    
    # Remove old photo if exists
    if db_driver.photo_url:
        old_file_path = f"uploads/{db_driver.photo_url.split('/uploads/')[1]}"
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

    db_driver.photo_url = photo_url
    db.commit()
    db.refresh(db_driver)

    return {"photo_url": photo_url}
