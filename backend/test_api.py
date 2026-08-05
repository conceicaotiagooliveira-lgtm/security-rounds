import urllib.request
import json

try:
    req = urllib.request.Request('http://192.168.0.53:5011/api/third-party/profiles')
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for p in data:
            if p.get('custom_reqs') and p['custom_reqs'] != '{}':
                print(f"custom_reqs type: {type(p['custom_reqs'])}")
                print(f"custom_reqs val: {p['custom_reqs']}")
                break
except Exception as e:
    print(f"Error: {e}")
