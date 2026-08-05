from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.guard import Guard
from app.models.patrol_route import PatrolRoute
from app.models.patrol import Patrol
from app.models.third_party import ThirdPartyProfile, ThirdPartyEntry, ThirdPartyConfig
from app.models.company import Company
from app.models.key_control import KeyCabinet, KeyHistory
from app.models.visit import VisitProfile, VisitEntry, VisitConfig

# This ensures that Base.metadata.create_all() sees all models
