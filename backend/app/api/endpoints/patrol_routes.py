from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.models.patrol_route import PatrolRoute
from app.schemas.patrol_route import PatrolRouteBase, PatrolRouteResponse

router = APIRouter()

@router.get("", response_model=List[PatrolRouteResponse])
def get_patrol_routes(db: Session = Depends(get_db)):
    return db.query(PatrolRoute).all()

@router.get("/{route_id}", response_model=PatrolRouteResponse)
def get_patrol_route(route_id: int, db: Session = Depends(get_db)):
    route = db.query(PatrolRoute).filter(PatrolRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Roteiro não encontrado")
    return route

@router.post("", response_model=PatrolRouteResponse, status_code=status.HTTP_201_CREATED)
def create_patrol_route(route: PatrolRouteBase, db: Session = Depends(get_db)):
    new_route = PatrolRoute(**route.model_dump())
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route

@router.put("/{route_id}", response_model=PatrolRouteResponse)
def update_patrol_route(route_id: int, route_update: PatrolRouteBase, db: Session = Depends(get_db)):
    db_route = db.query(PatrolRoute).filter(PatrolRoute.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Roteiro não encontrado")

    for key, value in route_update.model_dump().items():
        setattr(db_route, key, value)

    db.commit()
    db.refresh(db_route)
    return db_route

@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patrol_route(route_id: int, db: Session = Depends(get_db)):
    db_route = db.query(PatrolRoute).filter(PatrolRoute.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Roteiro não encontrado")
    db.delete(db_route)
    db.commit()
    return None
