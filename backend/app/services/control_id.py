import requests
import json
import base64
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.setting import Setting

logger = logging.getLogger(__name__)

class ControlIdService:
    def __init__(self, db: Session):
        self.db = db
        # Get settings or default
        setting = self.db.query(Setting).filter(Setting.key == 'control_id_settings').first()
        self.ip = "192.168.20.106"
        self.user = "admin"
        self.password = "admin"
        
        if setting and setting.value:
            try:
                data = json.loads(setting.value)
                self.ip = data.get("ip", self.ip)
                self.user = data.get("user", self.user)
                self.password = data.get("password", self.password)
            except Exception as e:
                logger.error(f"Error parsing control_id_settings: {e}")

        self.base_url = f"http://{self.ip}"

    def grant_access(self, name: str, photo_base64: str = None, photo_url: str = None) -> dict:
        try:
            # 1. Login
            login_resp = requests.post(
                f"{self.base_url}/login.fcgi",
                json={"login": self.user, "password": self.password},
                timeout=5
            )
            login_resp.raise_for_status()
            session_token = login_resp.json().get("session")
            if not session_token:
                return {"success": False, "error": "Falha na autenticação (token vazio)"}
            
            # 1.5. Clean up any existing user with the same name to avoid duplicates and old photos
            self.revoke_access(name)

            # Timestamps for today
            now = datetime.now()
            begin_time = int(datetime(now.year, now.month, now.day, 0, 0, 0).timestamp())
            end_time = int(datetime(now.year, now.month, now.day, 23, 59, 59).timestamp())
            
            # Use timestamp for unique registration
            registration = str(int(now.timestamp()))

            # 3. Create User (let device auto-generate ID)
            create_resp = requests.post(
                f"{self.base_url}/create_objects.fcgi?session={session_token}",
                json={
                    "object": "users",
                    "values": [
                        {
                            "name": name,
                            "registration": registration,
                            "begin_time": begin_time,
                            "end_time": end_time
                        }
                    ]
                },
                timeout=5
            )
            create_resp.raise_for_status()
            if "error" in create_resp.text.lower():
                return {"success": False, "error": f"Erro ao criar usuário: {create_resp.text}"}
                
            ids = create_resp.json().get("ids", [])
            if not ids:
                return {"success": False, "error": "Falha ao obter ID gerado pela catraca"}
                
            next_id = ids[0]
            
            # 4. Link to Access Rule 1
            rule_resp = requests.post(
                f"{self.base_url}/create_objects.fcgi?session={session_token}",
                json={
                    "object": "user_access_rules",
                    "values": [
                        {
                            "user_id": next_id,
                            "access_rule_id": 1
                        }
                    ]
                },
                timeout=5
            )
            rule_resp.raise_for_status()

            # 5. Send Photo
            photo_bytes = None
            if photo_base64:
                if ',' in photo_base64:
                    photo_base64 = photo_base64.split(',', 1)[1]
                photo_bytes = base64.b64decode(photo_base64)
            elif photo_url:
                import os
                filename = photo_url.split('/')[-1]
                filepath = os.path.join("uploads", "third_party", filename)
                if os.path.exists(filepath):
                    with open(filepath, "rb") as f:
                        photo_bytes = f.read()

            if photo_bytes:
                import io
                from PIL import Image
                import tempfile
                
                # Trata a imagem com Pillow para garantir que é um JPG válido e legível
                try:
                    img = Image.open(io.BytesIO(photo_bytes))
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Garantir tamanho mínimo 160x160 exigido pela Control iD
                    if img.width < 160 or img.height < 160:
                        img = img.resize((max(160, img.width), max(160, img.height)))
                    
                    # Salva num arquivo físico temporário único para evitar concorrência
                    temp_jpg = os.path.join(tempfile.gettempdir(), f'foto_control_id_{next_id}.jpg')
                    img.save(temp_jpg, 'JPEG', quality=90)
                    
                    with open(temp_jpg, 'rb') as f:
                        final_jpg_bytes = f.read()
                        
                    import os
                    os.remove(temp_jpg)
                        
                    current_timestamp = int(datetime.now().timestamp())
                    photo_resp = requests.post(
                        f"{self.base_url}/user_set_image.fcgi?session={session_token}&user_id={next_id}&timestamp={current_timestamp}&match=0",
                        headers={"Content-Type": "application/octet-stream"},
                        data=final_jpg_bytes,
                        timeout=10
                    )
                    if photo_resp.status_code != 200:
                        return {"success": False, "error": f"Erro na foto: {photo_resp.text}"}
                    
                    if "error" in photo_resp.text.lower():
                        return {"success": False, "error": f"Dispositivo recusou a foto: {photo_resp.text}"}
                except Exception as e:
                    logger.error(f"Erro ao processar imagem da webcam: {e}")
                    return {"success": False, "error": f"Erro ao gerar JPG da foto: {str(e)}"}

            return {"success": True, "message": f"Usuário sincronizado (ID: {next_id})", "device_id": next_id}

        except requests.exceptions.RequestException as e:
            logger.error(f"Control iD network error: {e}")
            return {"success": False, "error": f"Erro de conexão com dispositivo: {str(e)}"}
        except Exception as e:
            logger.error(f"Control iD error: {e}")
            return {"success": False, "error": str(e)}

    def revoke_access(self, name: str, device_id: int = None) -> dict:
        try:
            # 1. Login
            login_resp = requests.post(
                f"{self.base_url}/login.fcgi",
                json={"login": self.user, "password": self.password},
                timeout=5
            )
            login_resp.raise_for_status()
            session_token = login_resp.json().get("session")
            if not session_token:
                return {"success": False, "error": "Falha na autenticação"}
            
            ids_to_delete = []
            
            if device_id:
                ids_to_delete = [device_id]
            else:
                # 2. Get Users by name
                list_resp = requests.post(
                    f"{self.base_url}/load_objects.fcgi?session={session_token}",
                    json={"object": "users", "fields": ["id", "name"]},
                    timeout=5
                )
                list_resp.raise_for_status()
                users_data = list_resp.json().get("users", [])
                target_name = name.strip().lower()
                ids_to_delete = [u["id"] for u in users_data if str(u.get("name", "")).strip().lower() == target_name]

            if not ids_to_delete:
                return {"success": True, "message": "Usuário não encontrado na catraca"}

            # 3. Delete Users
            for uid in ids_to_delete:
                del_resp = requests.post(
                    f"{self.base_url}/destroy_objects.fcgi?session={session_token}",
                    json={"object": "users", "where": {"users": {"id": uid}}},
                    timeout=5
                )
                del_resp.raise_for_status()

            return {"success": True, "message": f"Acesso removido ({len(ids_to_delete)} registros excluídos da catraca)"}

        except requests.exceptions.RequestException as e:
            logger.error(f"Control iD network error: {e}")
            return {"success": False, "error": f"Erro de conexão com dispositivo: {str(e)}"}
        except Exception as e:
            logger.error(f"Control iD error: {e}")
            return {"success": False, "error": str(e)}
