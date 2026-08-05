from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import math
import requests
import threading
from app.models.whatsapp_instance import WhatsAppInstance

from app.database.database import get_db
from app.models.patrol import Patrol
from app.models.patrol_route import PatrolRoute
from app.models.guard import Guard
from app.schemas.patrol import PatrolStart, PatrolCheckpointVisit, PatrolPositionUpdate, PatrolResponse, PatrolFinish
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

CHECKPOINT_RADIUS_M = 20  # meters

def send_whatsapp_alert(db: Session, route: PatrolRoute, message: str):
    if not route.notify_whatsapp or not route.whatsapp_number:
        return
    
    instance = db.query(WhatsAppInstance).filter(WhatsAppInstance.status == 'Conectado').first()
    if not instance:
        return
    
    url = f"{instance.api_url.rstrip('/')}/message/sendText/{instance.name}"
    headers = {
        "apikey": instance.api_key,
        "Content-Type": "application/json"
    }
    
    number = route.whatsapp_number
    if not number.startswith("55"):
        number = "55" + number

    payload = {
        "number": number,
        "text": message
    }
    
    def _send():
        try:
            requests.post(url, json=payload, headers=headers, timeout=5)
        except Exception as e:
            print("Error sending WhatsApp alert:", e)
            
    # Run in background to avoid blocking the patrol request
    threading.Thread(target=_send).start()



def haversine(lat1, lng1, lat2, lng2):
    """Calculate distance in meters between two GPS points."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def point_in_polygon(lat, lng, polygon):
    """Ray casting algorithm to check if point is inside polygon.
    polygon is a list of [lat, lng] pairs.
    We treat lat as Y and lng as X for the 2D ray casting.
    """
    n = len(polygon)
    if n < 3:
        return True  # No geofence defined
    inside = False
    j = n - 1
    for i in range(n):
        lat_i, lng_i = polygon[i]
        lat_j, lng_j = polygon[j]
        if ((lat_i > lat) != (lat_j > lat)) and (lng < (lng_j - lng_i) * (lat - lat_i) / (lat_j - lat_i) + lng_i):
            inside = not inside
        j = i
    return inside


from typing import List, Optional

@router.get("", response_model=List[PatrolResponse])
def get_patrols(
    route_id: Optional[int] = None, 
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db)
):
    query = db.query(Patrol)
    if route_id is not None:
        query = query.filter(Patrol.patrol_route_id == route_id)
    if start_date:
        query = query.filter(Patrol.started_at >= start_date)
    if end_date:
        query = query.filter(Patrol.started_at <= end_date + "T23:59:59")
    return query.order_by(Patrol.started_at.desc()).offset(skip).limit(limit).all()


@router.get("/active", response_model=PatrolResponse)
def get_active_patrol(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the active patrol for the currently logged-in guard."""
    guard = db.query(Guard).filter(Guard.user_id == current_user.id).first()
    if not guard:
        raise HTTPException(status_code=404, detail="Vigia não encontrado para este usuário")

    patrol = db.query(Patrol).filter(
        Patrol.guard_id == guard.id,
        Patrol.status == "Em Andamento"
    ).first()

    if not patrol:
        raise HTTPException(status_code=404, detail="Nenhuma ronda ativa")

    return patrol


@router.post("/start", response_model=PatrolResponse, status_code=status.HTTP_201_CREATED)
def start_patrol(data: PatrolStart, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Guard starts a new patrol."""
    guard = db.query(Guard).filter(Guard.user_id == current_user.id).first()
    if not guard:
        raise HTTPException(status_code=404, detail="Vigia não encontrado para este usuário")

    # Check no active patrol
    active = db.query(Patrol).filter(Patrol.guard_id == guard.id, Patrol.status == "Em Andamento").first()
    if active:
        raise HTTPException(status_code=400, detail="Já existe uma ronda em andamento")

    # Check route exists
    route = db.query(PatrolRoute).filter(PatrolRoute.id == data.patrol_route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Roteiro não encontrado")

    patrol = Patrol(
        patrol_route_id=data.patrol_route_id,
        guard_id=guard.id,
        status="Em Andamento",
        checkpoints_visited="[]",
        gps_track="[]",
        alerts="[]",
        delay_justification=data.delay_justification,
    )
    db.add(patrol)

    # If guard provided a justification (or is starting a delayed patrol), clear the alert status
    if route.last_missed_alert_time:
        route.last_missed_alert_time = None

    db.commit()
    db.refresh(patrol)
    return patrol


@router.post("/{patrol_id}/checkpoint", response_model=PatrolResponse)
def visit_checkpoint(patrol_id: int, data: PatrolCheckpointVisit, db: Session = Depends(get_db)):
    """Register that the guard visited a checkpoint."""
    patrol = db.query(Patrol).filter(Patrol.id == patrol_id).first()
    if not patrol:
        raise HTTPException(status_code=404, detail="Ronda não encontrada")

    route = db.query(PatrolRoute).filter(PatrolRoute.id == patrol.patrol_route_id).first()
    checkpoints = json.loads(route.checkpoints)

    if data.checkpoint_index < 0 or data.checkpoint_index >= len(checkpoints):
        raise HTTPException(status_code=400, detail="Checkpoint inválido")

    cp = checkpoints[data.checkpoint_index]
    # dist = haversine(data.lat, data.lng, cp["lat"], cp["lng"])
    # Backend distance check is removed because frontend now handles dynamic accuracy overlaps
    # and anti-jitter filtering.

    visited = json.loads(patrol.checkpoints_visited)
    visited.append({
        "checkpoint_index": data.checkpoint_index,
        "visited_at": datetime.utcnow().isoformat(),
        "lat": data.lat,
        "lng": data.lng,
    })
    patrol.checkpoints_visited = json.dumps(visited)
    db.commit()
    db.refresh(patrol)
    return patrol


@router.post("/{patrol_id}/position", response_model=dict)
def update_position(patrol_id: int, data: PatrolPositionUpdate, db: Session = Depends(get_db)):
    """Update guard's GPS position and check geofence."""
    patrol = db.query(Patrol).filter(Patrol.id == patrol_id).first()
    if not patrol:
        raise HTTPException(status_code=404, detail="Ronda não encontrada")

    # Append to GPS track
    track = json.loads(patrol.gps_track)
    track.append({
        "lat": data.lat,
        "lng": data.lng,
        "timestamp": datetime.utcnow().isoformat(),
    })
    patrol.gps_track = json.dumps(track)

    # Check geofence
    route = db.query(PatrolRoute).filter(PatrolRoute.id == patrol.patrol_route_id).first()
    geofence = json.loads(route.geofence)
    inside = point_in_polygon(data.lat, data.lng, geofence)

    alert = None
    if not inside and len(geofence) >= 3:
        was_inside = True
        if len(track) >= 2:
            prev_lat = track[-2]["lat"]
            prev_lng = track[-2]["lng"]
            was_inside = point_in_polygon(prev_lat, prev_lng, geofence)
            
        if was_inside:
            alerts = json.loads(patrol.alerts)
            alert = {
                "type": "FORA_DA_AREA",
                "message": "Vigia saiu da área de ronda!",
                "timestamp": datetime.utcnow().isoformat(),
                "lat": data.lat,
                "lng": data.lng,
            }
            alerts.append(alert)
            patrol.alerts = json.dumps(alerts)
            
            if route.notify_whatsapp:
                guard_name = patrol.guard.name if patrol.guard else f"ID {patrol.guard_id}"
                msg = f"🚨 ALERTA: Vigia {guard_name} saiu da área na ronda {route.name}!"
                send_whatsapp_alert(db, route, msg)

    db.commit()
    return {"inside_geofence": inside, "alert": alert}


@router.post("/{patrol_id}/finish", response_model=PatrolResponse)
def finish_patrol(patrol_id: int, data: PatrolFinish = Body(default=PatrolFinish()), db: Session = Depends(get_db)):
    """Guard finishes the patrol."""
    patrol = db.query(Patrol).filter(Patrol.id == patrol_id).first()
    if not patrol:
        raise HTTPException(status_code=404, detail="Ronda não encontrada")

    route = db.query(PatrolRoute).filter(PatrolRoute.id == patrol.patrol_route_id).first()
    checkpoints = json.loads(route.checkpoints)
    visited = json.loads(patrol.checkpoints_visited)
    visited_indices = set(v["checkpoint_index"] for v in visited)

    all_visited = all(i in visited_indices for i in range(len(checkpoints)))

    patrol.finished_at = datetime.utcnow()
    patrol.status = "Concluída" if all_visited else "Incompleta"
    
    if patrol.status == "Incompleta" and route.notify_whatsapp:
        guard_name = patrol.guard.name if patrol.guard else f"ID {patrol.guard_id}"
        msg = f"🚨 ALERTA: Ronda {route.name} foi encerrada de forma Incompleta pelo vigia {guard_name}."
        send_whatsapp_alert(db, route, msg)

    if data.observations:
        patrol.observations = data.observations
        
    db.commit()
    db.refresh(patrol)
    return patrol


@router.post("/{patrol_id}/cancel", response_model=PatrolResponse)
def cancel_patrol(patrol_id: int, db: Session = Depends(get_db)):
    """Guard cancels the patrol."""
    patrol = db.query(Patrol).filter(Patrol.id == patrol_id).first()
    if not patrol:
        raise HTTPException(status_code=404, detail="Ronda não encontrada")

    patrol.finished_at = datetime.utcnow()
    patrol.status = "Cancelada"
    db.commit()
    db.refresh(patrol)
    return patrol
