from app.database.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"Email: {u.email}, Role: {u.role}, Permissions: {u.permissions}")
db.close()
