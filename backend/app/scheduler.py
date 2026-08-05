from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import math

from app.database.database import SessionLocal
from app.models.patrol_route import PatrolRoute
from app.models.patrol import Patrol
from app.api.endpoints.patrols import send_whatsapp_alert
from app.models.vehicle import Vehicle
from app.models.whatsapp_instance import WhatsAppInstance
from app.models.setting import Setting
import requests
import threading

def send_generic_whatsapp_alert(db: Session, number: str, message: str):
    instance = db.query(WhatsAppInstance).filter(WhatsAppInstance.status == 'Conectado').first()
    if not instance:
        return
    
    url = f"{instance.api_url.rstrip('/')}/message/sendText/{instance.name}"
    headers = {
        "apikey": instance.api_key,
        "Content-Type": "application/json"
    }
    
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
            
    threading.Thread(target=_send).start()

def check_missed_patrols():
    db: Session = SessionLocal()
    try:
        active_setting = db.query(Setting).filter(Setting.key == 'patrol_scheduler_active').first()
        if active_setting and active_setting.value == 'false':
            return

        now_utc = datetime.utcnow()
        now_local = datetime.now()
        local_to_utc_offset = now_utc - now_local

        # Find active routes that have start_time and repeat frequency, and notify_whatsapp enabled
        routes = db.query(PatrolRoute).filter(
            PatrolRoute.is_active == True,
            PatrolRoute.notify_whatsapp == True,
            PatrolRoute.start_time.isnot(None),
            PatrolRoute.repeat_every_minutes.isnot(None)
        ).all()

        for route in routes:
            if now_local < route.start_time:
                continue

            delta_m = (now_local - route.start_time).total_seconds() / 60
            if delta_m < 0: continue

            N = math.floor(delta_m / route.repeat_every_minutes)
            expected_start_local = route.start_time + timedelta(minutes=N * route.repeat_every_minutes)
            deadline_local = expected_start_local + timedelta(minutes=route.tolerance_minutes)

            expected_start_utc = expected_start_local + local_to_utc_offset
            deadline_utc = deadline_local + local_to_utc_offset

            # Check if deadline passed
            if now_local > deadline_local:
                # Check if we already alerted for this expected_start (or later)
                if route.last_missed_alert_time and route.last_missed_alert_time >= expected_start_utc:
                    continue

                # Check if a patrol was actually started recently for this cycle.
                patrol = db.query(Patrol).filter(
                    Patrol.patrol_route_id == route.id,
                    Patrol.started_at >= expected_start_utc - timedelta(minutes=60)
                ).first()

                if not patrol:
                    # Patrol missed!
                    route.last_missed_alert_time = now_utc
                    db.commit()
                    
                    time_str = deadline_local.strftime('%H:%M')
                    msg = f"🚨 ALERTA DE ATRASO: A ronda {route.name} não foi iniciada! O limite era até {time_str}."
                    send_whatsapp_alert(db, route, msg)

    except Exception as e:
        print("Error checking missed patrols:", e)
    finally:
        db.close()

# Start scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(
    check_missed_patrols,
    trigger=IntervalTrigger(minutes=5),
    id='check_missed_patrols',
    name='Check missed patrols every 5 minutes',
    replace_existing=True
)

def check_oil_changes():
    db: Session = SessionLocal()
    try:
        vehicles = db.query(Vehicle).filter(
            Vehicle.notify_whatsapp_oil == True
        ).all()
        
        for v in vehicles:
            if not v.oil_change_interval_km:
                continue
            
            target_km = v.last_oil_change_km + v.oil_change_interval_km
            threshold = getattr(v, 'oil_alert_threshold_km', 1000.0)
            
            if v.current_km >= (target_km - threshold):
                should_alert = (
                    v.last_oil_alert_km is None or 
                    v.last_oil_alert_km <= v.last_oil_change_km or 
                    (v.current_km - v.last_oil_alert_km) >= 100
                )
                
                if should_alert:
                    from app.models.driver import Driver
                    driver = db.query(Driver).filter(Driver.vehicle_id == v.id).first()
                    if not driver or not driver.phone:
                        continue
                        
                    v.last_oil_alert_km = v.current_km
                    v.last_oil_alert_date = datetime.utcnow()
                    db.commit()
                    
                    driver_name = driver.name.split(' ')[0] if driver.name else "Motorista"
                    msg = f"🚨 Olá *{driver_name}*, ALERTA DE MANUTENÇÃO (Automático): O veículo *{v.model}* ({v.plate}) atingiu a KM de troca de óleo!\n\n"
                    msg += f"📍 KM Atual: *{v.current_km:,.0f} km*\n".replace(',', '.')
                    msg += f"⏱️ KM Limite: *{target_km:,.0f} km*\n".replace(',', '.')
                    msg += "\nFavor providenciar a manutenção junto à administração."
                    
                    send_generic_whatsapp_alert(db, driver.phone, msg)
    except Exception as e:
        print("Error checking oil changes:", e)
    finally:
        db.close()

scheduler.add_job(
    check_oil_changes,
    trigger=IntervalTrigger(minutes=5),
    id='check_oil_changes',
    name='Check oil changes every 5 minutes',
    replace_existing=True
)
