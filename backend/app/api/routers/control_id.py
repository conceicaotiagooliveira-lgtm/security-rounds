from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.control_id import ControlIdService

from app.models.third_party import ThirdPartyEntry

router = APIRouter(
    prefix="/control-id",
    tags=["Control iD"]
)

@router.post("/grant-access")
def grant_access(
    name: str = Body(...),
    photoBase64: str = Body(None),
    photoUrl: str = Body(None),
    entryId: str = Body(None),
    db: Session = Depends(get_db)
):
    print("GRANT_ACCESS CALLED FOR:", name)
    print("photoBase64:", (photoBase64[:50] + "...") if photoBase64 else None)
    print("photoUrl:", photoUrl)
    
    if not photoBase64 and not photoUrl:
        raise HTTPException(status_code=400, detail="Foto é obrigatória para o reconhecimento facial")
        
    service = ControlIdService(db)
    result = service.grant_access(name, photoBase64, photoUrl)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Erro desconhecido ao sincronizar"))
        
    if entryId and result.get("device_id"):
        entry = db.query(ThirdPartyEntry).filter(ThirdPartyEntry.id == entryId).first()
        if entry:
            entry.control_id_device_id = str(result["device_id"])
            db.commit()
            
    return {"message": result.get("message")}

@router.post("/revoke-access")
def revoke_access(
    name: str = Body(...),
    entryId: str = Body(None),
    db: Session = Depends(get_db)
):
    service = ControlIdService(db)
    
    device_id = None
    if entryId:
        entry = db.query(ThirdPartyEntry).filter(ThirdPartyEntry.id == entryId).first()
        if entry and entry.control_id_device_id:
            try:
                device_id = int(entry.control_id_device_id)
            except:
                pass
                
    result = service.revoke_access(name, device_id)
    
    if entryId:
        entry = db.query(ThirdPartyEntry).filter(ThirdPartyEntry.id == entryId).first()
        if entry:
            entry.control_id_device_id = None
            db.commit()
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Erro desconhecido ao remover acesso"))
        
    return {"message": result.get("message")}
