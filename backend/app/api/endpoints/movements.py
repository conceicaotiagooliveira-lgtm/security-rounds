from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.database import get_db
from app.models.movement import Movement
from app.models.vehicle import Vehicle
from app.schemas.movement import Movement as MovementSchema, MovementCreate, MovementArrival

router = APIRouter()

@router.get("/", response_model=List[MovementSchema])
def read_movements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    movements = db.query(Movement).order_by(Movement.departure_time.desc()).offset(skip).limit(limit).all()
    return movements

@router.get("/active", response_model=List[MovementSchema])
def get_active_movements(db: Session = Depends(get_db)):
    movements = db.query(Movement).filter(Movement.status == "EM USO").order_by(Movement.departure_time.desc()).all()
    return movements

@router.post("/departure", response_model=MovementSchema)
def create_departure(movement: MovementCreate, db: Session = Depends(get_db)):
    # Check if vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == movement.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")

    # Check if vehicle is already in use
    active = db.query(Movement).filter(Movement.vehicle_id == movement.vehicle_id, Movement.status == "EM USO").first()
    if active:
        raise HTTPException(status_code=400, detail="Veículo já está em uso")

    db_movement = Movement(**movement.dict())
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    return db_movement

@router.put("/{movement_id}/arrival", response_model=MovementSchema)
def register_arrival(movement_id: int, arrival: MovementArrival, db: Session = Depends(get_db)):
    db_movement = db.query(Movement).filter(Movement.id == movement_id).first()
    if not db_movement:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")
    
    if db_movement.status == "CONCLUIDO":
        raise HTTPException(status_code=400, detail="Esta viagem já foi concluída")

    if arrival.arrival_km < db_movement.departure_km:
        raise HTTPException(status_code=400, detail="KM de chegada não pode ser menor que o de saída")

    # Update movement
    db_movement.arrival_km = arrival.arrival_km
    db_movement.arrival_time = datetime.now()
    db_movement.arrival_authorized_by = arrival.arrival_authorized_by
    db_movement.status = "CONCLUIDO"
    
    # Update vehicle's current km
    vehicle = db.query(Vehicle).filter(Vehicle.id == db_movement.vehicle_id).first()
    if vehicle and arrival.arrival_km > vehicle.current_km:
        vehicle.current_km = arrival.arrival_km

    db.commit()
    db.refresh(db_movement)
    return db_movement
