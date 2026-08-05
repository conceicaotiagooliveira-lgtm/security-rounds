from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import requests

from app.database.database import get_db
from app.models.whatsapp_instance import WhatsAppInstance
from app.schemas.whatsapp_instance import WhatsAppInstanceCreate, WhatsAppInstanceUpdate, WhatsAppInstanceResponse, SendMessageRequest
from app.api.endpoints.auth import get_current_active_user

router = APIRouter()

def get_evolution_headers(api_key: str):
    return {
        "Content-Type": "application/json",
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}"
    }

def clean_url(url: str):
    url = url.rstrip('/')
    if not url.startswith('http://') and not url.startswith('https://'):
        url = 'http://' + url
    return url

@router.get("/", response_model=List[WhatsAppInstanceResponse])
def get_instances(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    instances = db.query(WhatsAppInstance).all()
    return instances

@router.post("/", response_model=WhatsAppInstanceResponse)
def create_instance(instance_in: WhatsAppInstanceCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    instance = WhatsAppInstance(**instance_in.dict())
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance

@router.put("/{instance_id}", response_model=WhatsAppInstanceResponse)
def update_instance(instance_id: int, instance_in: WhatsAppInstanceUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    instance = db.query(WhatsAppInstance).filter(WhatsAppInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    update_data = instance_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(instance, field, value)
    
    db.commit()
    db.refresh(instance)
    return instance

@router.delete("/{instance_id}")
def delete_instance(instance_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    instance = db.query(WhatsAppInstance).filter(WhatsAppInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    db.delete(instance)
    db.commit()
    return {"message": "Instance deleted successfully"}

@router.get("/{instance_id}/status")
def check_status(instance_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    instance = db.query(WhatsAppInstance).filter(WhatsAppInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    
    url = f"{clean_url(instance.api_url)}/instance/connectionState/{instance.name}"
    
    try:
        response = requests.get(url, headers=get_evolution_headers(instance.api_key), timeout=10)
        data = response.json()
        
        state = data.get("instance", {}).get("state", "")
        
        if state == "open":
            new_status = "Conectado"
        elif state == "connecting":
            new_status = "Conectando"
        else:
            new_status = "Desconectado"
            
    except Exception as e:
        new_status = "Desconectado"
        
    instance.status = new_status
    db.commit()
    
    return {"status": new_status}

@router.get("/{instance_id}/qr")
def get_qr(instance_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    instance = db.query(WhatsAppInstance).filter(WhatsAppInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
        
    url = f"{clean_url(instance.api_url)}/instance/connect/{instance.name}"
    
    try:
        response = requests.get(url, headers=get_evolution_headers(instance.api_key), timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch QR Code from Evolution API")
            
        data = response.json()
        qr_base64 = data.get("qrcode", {}).get("base64")
        if not qr_base64:
            # Em algumas versoes da evolution base64 vem direto em base64
            qr_base64 = data.get("base64")
            
        return {"base64": qr_base64}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Evolution API communication error: {str(e)}")

@router.post("/{instance_id}/send")
def send_message(instance_id: int, req: SendMessageRequest, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    instance = db.query(WhatsAppInstance).filter(WhatsAppInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
        
    if instance.status != "Conectado":
        raise HTTPException(status_code=400, detail="Instance is not connected")
        
    url = f"{clean_url(instance.api_url)}/message/sendText/{instance.name}"
    
    try:
        payload = {
            "number": req.number,
            "text": req.text
        }
        response = requests.post(url, json=payload, headers=get_evolution_headers(instance.api_key), timeout=10)
        
        if response.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=f"Evolution API Error: {response.text}")
            
        return {"success": True, "data": response.json()}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Evolution API communication error: {str(e)}")
