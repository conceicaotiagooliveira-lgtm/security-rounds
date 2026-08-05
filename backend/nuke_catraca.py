import requests
import sys

BASE_URL = "http://192.168.20.106"

def nuke_users():
    # Login
    resp = requests.post(f"{BASE_URL}/login.fcgi", json={"login": "admin", "password": "admin"}, timeout=5)
    if resp.status_code != 200:
        print("Login failed")
        return
    session = resp.json().get("session")
    
    # Load all users
    resp = requests.post(f"{BASE_URL}/load_objects.fcgi?session={session}", json={"object": "users", "fields": ["id", "name"]})
    users = resp.json().get("users", [])
    print(f"Found {len(users)} users. Deleting...")
    
    for u in users:
        print(f"Deleting user {u['id']} - {u.get('name')}")
        requests.post(f"{BASE_URL}/destroy_objects.fcgi?session={session}", json={
            "object": "users",
            "where": {"users": {"id": u['id']}}
        })
    print("Done!")

if __name__ == "__main__":
    nuke_users()
