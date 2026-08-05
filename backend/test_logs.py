import requests

BASE_URL = "http://192.168.20.106"

def get_logs():
    try:
        resp = requests.post(f"{BASE_URL}/login.fcgi", json={"login": "admin", "password": "admin"}, timeout=5)
        session = resp.json().get("session")
        
        resp = requests.post(f"{BASE_URL}/load_objects.fcgi?session={session}", json={
            "object": "access_logs",
            "limit": 50
        })
        logs = resp.json().get("access_logs", [])
        for log in logs:
            print(log)
    except Exception as e:
        print("Error:", e)

get_logs()
