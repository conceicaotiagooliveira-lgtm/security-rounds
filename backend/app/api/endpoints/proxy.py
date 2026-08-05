from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import urllib.request
import urllib.error
import json
from fastapi.responses import Response

router = APIRouter()

class ProxyRequest(BaseModel):
    url: str
    method: str = "GET"
    headers: dict = {}

@router.post("/")
async def proxy_request(req: ProxyRequest):
    try:
        request = urllib.request.Request(
            req.url, 
            method=req.method, 
            headers=req.headers
        )
        with urllib.request.urlopen(request) as response:
            body = response.read()
            return Response(content=body, media_type=response.headers.get_content_type(), status_code=response.status)
    except urllib.error.HTTPError as e:
        return Response(content=e.read(), status_code=e.code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
