from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime
from app.database.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.api.deps import get_current_user
from app.models.user import User
from app.models.refueling import Refueling
from app.models.driver import Driver
from app.schemas.refueling import RefuelingResponse, RefuelingCreate, RefuelingAdminCreate, RefuelingReportResponse
from app.models.driver import Driver
from app.models.oil_history import VehicleOilHistory
from app.schemas.oil_history import OilHistoryCreate, OilHistoryResponse
from app.scheduler import send_generic_whatsapp_alert
from app.models.driver import Driver

router = APIRouter()

@router.get("/refuelings/all", response_model=List[RefuelingReportResponse])
def get_all_refuelings(skip: int = 0, limit: int = 2000, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(
        Refueling, Vehicle.plate.label('vehicle_plate'), Driver.name.label('driver_name')
    ).join(Vehicle, Refueling.vehicle_id == Vehicle.id)\
     .outerjoin(Driver, Refueling.driver_id == Driver.id)\
     .order_by(Refueling.created_at.desc()).offset(skip).limit(limit).all()
    
    response = []
    for ref, plate, driver in results:
        ref_dict = {
            "id": ref.id,
            "vehicle_id": ref.vehicle_id,
            "driver_id": ref.driver_id,
            "current_km": ref.current_km,
            "liters": ref.liters,
            "total_cost": ref.total_cost,
            "latitude": ref.latitude,
            "longitude": ref.longitude,
            "created_at": ref.created_at,
            "vehicle_plate": plate,
            "driver_name": driver or "Desconhecido"
        }
        response.append(ref_dict)
    
    return response

@router.get("", response_model=List[VehicleResponse])
def read_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import timedelta
    # Calculate midnight today in BRT (UTC-3), then convert back to UTC for DB query
    brt_now = datetime.utcnow() - timedelta(hours=3)
    brt_midnight = brt_now.replace(hour=0, minute=0, second=0, microsecond=0)
    utc_midnight = brt_midnight + timedelta(hours=3)
    
    vehicles = db.query(Vehicle).offset(skip).limit(limit).all()
    # Attach driver_id and recent refuelings count to each vehicle response manually
    for v in vehicles:
        driver = db.query(Driver).filter(Driver.vehicle_id == v.id).first()
        setattr(v, 'driver_id', driver.id if driver else None)
        
        recent_refuelings = db.query(Refueling).filter(
            Refueling.vehicle_id == v.id,
            Refueling.created_at >= utc_midnight
        ).count()
        setattr(v, 'recent_refuelings_count', recent_refuelings)
        
    return vehicles

@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.plate == vehicle.plate).first()
    if db_vehicle:
        raise HTTPException(status_code=400, detail="Placa já cadastrada no sistema")
    
    vehicle_data = vehicle.model_dump(exclude={'driver_id'})
    new_vehicle = Vehicle(**vehicle_data)
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    
    driver_id = vehicle.driver_id
    if driver_id:
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if driver:
            driver.vehicle_id = new_vehicle.id
            db.commit()
    setattr(new_vehicle, 'driver_id', driver_id)
    return new_vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, vehicle: VehicleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    update_data = vehicle.model_dump(exclude_unset=True, exclude={'driver_id'})
    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
        
    db.commit()
    db.refresh(db_vehicle)
    
    driver_id = None
    if 'driver_id' in vehicle.model_dump(exclude_unset=True):
        driver_id = vehicle.driver_id
        
        # Remove any existing driver assigned to this vehicle
        existing_driver = db.query(Driver).filter(Driver.vehicle_id == vehicle_id).first()
        if existing_driver and existing_driver.id != driver_id:
            existing_driver.vehicle_id = None
            
        if driver_id:
            new_driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if new_driver:
                new_driver.vehicle_id = vehicle_id
                
        db.commit()
    else:
        # If not updated, keep the old one for the response
        existing_driver = db.query(Driver).filter(Driver.vehicle_id == vehicle_id).first()
        driver_id = existing_driver.id if existing_driver else None
    setattr(db_vehicle, 'driver_id', driver_id)
    return db_vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, force: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    from app.models.movement import Movement
    has_refuelings = db.query(Refueling).filter(Refueling.vehicle_id == vehicle_id).first()
    has_movements = db.query(Movement).filter(Movement.vehicle_id == vehicle_id).first()
    has_oil = db.query(VehicleOilHistory).filter(VehicleOilHistory.vehicle_id == vehicle_id).first()
    
    if has_refuelings or has_movements or has_oil:
        if not force:
            raise HTTPException(status_code=400, detail="Este veículo possui histórico (abastecimentos, movimentações ou óleo).")
        else:
            db.query(Refueling).filter(Refueling.vehicle_id == vehicle_id).delete()
            db.query(Movement).filter(Movement.vehicle_id == vehicle_id).delete()
            db.query(VehicleOilHistory).filter(VehicleOilHistory.vehicle_id == vehicle_id).delete()
        
    driver = db.query(Driver).filter(Driver.vehicle_id == vehicle_id).first()
    if driver:
        driver.vehicle_id = None
    
    db.delete(db_vehicle)
    db.commit()
    return None

@router.post("/{vehicle_id}/photo", response_model=VehicleResponse)
def upload_vehicle_photo(
    vehicle_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    # Validações básicas (opcional, pode melhorar)
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="O arquivo deve ser uma imagem")
    
    # Create safe filename
    ext = file.filename.split('.')[-1]
    safe_filename = f"{vehicle_id}_photo.{ext}"
    file_path = os.path.join("uploads", "vehicles", safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_vehicle.photo_url = f"/uploads/vehicles/{safe_filename}"
    db.commit()
    db.refresh(db_vehicle)
    
    return db_vehicle

@router.post("/{vehicle_id}/refuelings", response_model=RefuelingResponse, status_code=status.HTTP_201_CREATED)
def register_vehicle_refueling(
    vehicle_id: int, 
    ref_data: RefuelingAdminCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    db_driver = db.query(Driver).filter(Driver.id == ref_data.driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Motorista não encontrado")

    if ref_data.current_km < db_vehicle.current_km:
        raise HTTPException(
            status_code=400, 
            detail=f"Quilometragem inválida. A KM atual do veículo é {db_vehicle.current_km}."
        )

    new_refueling = Refueling(
        vehicle_id=vehicle_id,
        driver_id=ref_data.driver_id,
        current_km=ref_data.current_km,
        liters=ref_data.liters,
        total_cost=ref_data.total_cost,
        latitude=ref_data.latitude,
        longitude=ref_data.longitude
    )
    
    db_vehicle.current_km = ref_data.current_km
    db.add(new_refueling)
    db.commit()
    db.refresh(new_refueling)
    return new_refueling

@router.get("/{vehicle_id}/refuelings", response_model=List[RefuelingResponse])
def read_vehicle_refuelings(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    refuelings = db.query(Refueling).filter(Refueling.vehicle_id == vehicle_id).order_by(Refueling.created_at.asc()).all()
    return refuelings

@router.put("/refuelings/{refueling_id}", response_model=RefuelingResponse)
def update_refueling(refueling_id: int, ref_data: RefuelingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_refueling = db.query(Refueling).filter(Refueling.id == refueling_id).first()
    if not db_refueling:
        raise HTTPException(status_code=404, detail="Abastecimento não encontrado")
    
    db_refueling.current_km = ref_data.current_km
    db_refueling.liters = ref_data.liters
    db_refueling.total_cost = ref_data.total_cost
    
    if ref_data.latitude is not None:
        db_refueling.latitude = ref_data.latitude
    if ref_data.longitude is not None:
        db_refueling.longitude = ref_data.longitude
        
    db.commit()
    db.refresh(db_refueling)
    return db_refueling

@router.delete("/refuelings/{refueling_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_refueling(refueling_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_refueling = db.query(Refueling).filter(Refueling.id == refueling_id).first()
    if not db_refueling:
        raise HTTPException(status_code=404, detail="Abastecimento não encontrado")
    
    db.delete(db_refueling)
    db.commit()
    return None

@router.get("/{vehicle_id}/oil-history", response_model=List[OilHistoryResponse])
def read_vehicle_oil_history(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    history = db.query(VehicleOilHistory).filter(VehicleOilHistory.vehicle_id == vehicle_id).order_by(VehicleOilHistory.date.desc()).all()
    return history

@router.post("/{vehicle_id}/oil-history", response_model=OilHistoryResponse)
def create_vehicle_oil_history(vehicle_id: int, history: OilHistoryCreate, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    # Create history entry
    new_history = VehicleOilHistory(
        vehicle_id=vehicle_id,
        km_at_change=history.km_at_change,
        date=history.date,
        notes=history.notes
    )
    db.add(new_history)
    
    # Update vehicle's last_oil_change_km automatically
    db_vehicle.last_oil_change_km = history.km_at_change
    
    db.commit()
    db.refresh(new_history)
    return new_history

@router.delete("/oil-history/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle_oil_history(history_id: int, db: Session = Depends(get_db)):
    db_history = db.query(VehicleOilHistory).filter(VehicleOilHistory.id == history_id).first()
    if not db_history:
        raise HTTPException(status_code=404, detail="Histórico não encontrado")
    
    db.delete(db_history)
    db.commit()
    return None

@router.post("/{vehicle_id}/notify-oil", status_code=status.HTTP_200_OK)
def manual_notify_oil(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not db_vehicle:
            raise HTTPException(status_code=404, detail="Veículo não encontrado")
        
        driver = db.query(Driver).filter(Driver.vehicle_id == vehicle_id).first()
        if not driver:
            raise HTTPException(status_code=400, detail="Este veículo não possui um motorista vinculado.")
            
        if not driver.phone:
            raise HTTPException(status_code=400, detail="O motorista vinculado não possui um número de celular cadastrado.")
            
        current_km = db_vehicle.current_km or 0.0
        driver_name = driver.name.split(' ')[0] if driver.name else "Motorista"
        
        msg = f"🚨 Olá *{driver_name}*, ALERTA DE MANUTENÇÃO: O veículo *{db_vehicle.model}* ({db_vehicle.plate}) precisa de atenção para troca de óleo!\n\n"
        msg += f"📍 KM Atual: *{current_km:,.0f} km*\n".replace(',', '.')
        if db_vehicle.last_oil_change_km and db_vehicle.oil_change_interval_km:
            limite = db_vehicle.last_oil_change_km + db_vehicle.oil_change_interval_km
            msg += f"⏱️ KM Limite: *{limite:,.0f} km*\n".replace(',', '.')
        msg += "\nFavor providenciar a manutenção junto à administração."

        send_generic_whatsapp_alert(db, driver.phone, msg)
            
        # Update last_oil_alert_km to mark as notified
        db_vehicle.last_oil_alert_km = current_km
        db_vehicle.last_oil_alert_date = datetime.utcnow()
        db.commit()
        
        return {"message": f"Alerta enviado para o motorista {driver.name}!"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Erro no servidor: {str(e)}")

