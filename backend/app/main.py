from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.database.database import engine, Base
from app.api.endpoints import auth
# Import models to ensure they are created
from app.models import user, vehicle, driver, refueling, movement, guard, patrol_route, patrol, third_party, company, key_control, setting, whatsapp_instance, oil_history, visit

# Create database tables
Base.metadata.create_all(bind=engine)

from app.scheduler import scheduler

app = FastAPI(
    title="Fleet Control API",
    description="API for the modern vehicle management system",
    version="1.0.0"
)

os.makedirs("uploads/vehicles", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
from app.api.endpoints import vehicles, driver_app, drivers, movements, guards, patrol_routes, patrols, proxy, sql_proxy
app.include_router(proxy.router, prefix="/api/proxy", tags=["proxy"])
app.include_router(sql_proxy.router, prefix="/api/proxy/sql", tags=["proxy-sql"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["vehicles"])
app.include_router(driver_app.router, prefix="/api/driver", tags=["driver"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["drivers"])
app.include_router(movements.router, prefix="/api/movements", tags=["movements"])
app.include_router(guards.router, prefix="/api/guards", tags=["guards"])
app.include_router(patrol_routes.router, prefix="/api/patrol-routes", tags=["patrol-routes"])
app.include_router(patrols.router, prefix="/api/patrols", tags=["patrols"])

from app.api.endpoints import whatsapp_instances
app.include_router(whatsapp_instances.router, prefix="/api/whatsapp-instances", tags=["whatsapp"])

from app.api.routers import third_party, companies, keys, settings, visits, control_id
app.include_router(third_party.router, prefix="/api")
app.include_router(visits.router, prefix="/api")
app.include_router(companies.router)
app.include_router(keys.router)
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(control_id.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Fleet Control API"}

@app.on_event("startup")
def startup_event():
    if not scheduler.running:
        scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    if scheduler.running:
        scheduler.shutdown()
