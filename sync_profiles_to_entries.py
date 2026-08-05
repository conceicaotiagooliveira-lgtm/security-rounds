import os
import sys
import uuid
from datetime import datetime

# Setup paths and environment
sys.path.append('/Server_vite/FrotaPatrimonial/backend')
os.environ["DATABASE_URL"] = "mysql+pymysql://root:qff77eti@192.168.0.53/fleet_control"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.third_party import ThirdPartyProfile, ThirdPartyEntry

def generate_id():
    return str(uuid.uuid4())

def run():
    engine = create_engine(os.environ["DATABASE_URL"])
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Get all profiles
    profiles = db.query(ThirdPartyProfile).all()
    
    # Get all entries to avoid duplicates by document
    existing_entries_docs = {e.document for e in db.query(ThirdPartyEntry).all()}
    
    new_entries = []
    now_str = datetime.now().isoformat()
    
    for p in profiles:
        if p.document not in existing_entries_docs:
            entry = ThirdPartyEntry(
                id=generate_id()[:8] + p.id[:8],
                name=p.name,
                company=p.company,
                document=p.document,
                vehicle_plate=None,
                reason="Importação Inicial",
                destination="-",
                authorized_by="Sistema",
                check_in_time=now_str,
                status="Bloqueado"
            )
            new_entries.append(entry)
            
    if new_entries:
        db.add_all(new_entries)
        db.commit()
        print(f"Sucesso! {len(new_entries)} terceiros foram adicionados como Bloqueados nos Acessos.")
    else:
        print("Nenhum novo terceiro precisava ser adicionado.")
        
    db.close()

if __name__ == "__main__":
    run()
