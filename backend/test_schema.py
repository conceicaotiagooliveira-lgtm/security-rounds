import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.schemas.third_party import ThirdPartyProfileResponse

res = ThirdPartyProfileResponse(
    id="123",
    name="Teste",
    company="Company",
    document="1234",
    is_admin_service=True
)
print("Dump:", res.model_dump(by_alias=False))
