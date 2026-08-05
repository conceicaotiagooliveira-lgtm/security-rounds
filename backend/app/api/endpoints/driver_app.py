from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.refueling import Refueling
from app.models.user import User
from app.api.deps import get_current_user

from app.schemas.driver import DriverResponse
from app.schemas.refueling import RefuelingCreate, RefuelingResponse

router = APIRouter()

def get_current_driver(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Motorista":
        raise HTTPException(status_code=403, detail="Apenas motoristas podem acessar esta área.")
    
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Perfil de motorista não encontrado.")
    
    return driver

@router.get("/me", response_model=DriverResponse)
def read_driver_profile(driver: Driver = Depends(get_current_driver)):
    """
    Retorna os dados do motorista atual, incluindo seu veículo (via relacionamento).
    """
    return driver

@router.get("/refuelings", response_model=List[RefuelingResponse])
def read_driver_refuelings(driver: Driver = Depends(get_current_driver), db: Session = Depends(get_db)):
    """
    Retorna o histórico de abastecimentos do motorista atual.
    """
    refuelings = db.query(Refueling).filter(Refueling.driver_id == driver.id).order_by(Refueling.created_at.desc()).all()
    return refuelings

@router.post("/refueling", response_model=RefuelingResponse, status_code=status.HTTP_201_CREATED)
def register_refueling(
    refueling_data: RefuelingCreate, 
    driver: Driver = Depends(get_current_driver), 
    db: Session = Depends(get_db)
):
    """
    Registra um novo abastecimento para o veículo atual do motorista.
    """
    if not driver.vehicle_id:
        raise HTTPException(status_code=400, detail="Motorista não possui um veículo alocado.")
        
    vehicle = db.query(Vehicle).filter(Vehicle.id == driver.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo alocado não encontrado.")
        
    # Validação de KM
    if refueling_data.current_km < vehicle.current_km:
        raise HTTPException(status_code=400, detail=f"KM atual não pode ser menor que o último KM registrado ({vehicle.current_km})")

    # Cria o abastecimento
    new_refueling = Refueling(
        vehicle_id=vehicle.id,
        driver_id=driver.id,
        current_km=refueling_data.current_km,
        liters=refueling_data.liters,
        total_cost=refueling_data.total_cost,
        latitude=refueling_data.latitude,
        longitude=refueling_data.longitude
    )
    
    # Atualiza KM do veículo
    vehicle.current_km = refueling_data.current_km
    
    db.add(new_refueling)
    db.commit()
    db.refresh(new_refueling)
    
    return new_refueling
