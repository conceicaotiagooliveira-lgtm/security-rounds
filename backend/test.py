import requests
import json
try:
    res = requests.get("http://127.0.0.1:5011/api/terceiros/profiles")
    print("Status:", res.status_code)
    try:
        print(json.dumps(res.json()[:1], indent=2))
    except Exception:
        print("Response:", res.text)
except Exception as e:
    print("Exception:", e)
