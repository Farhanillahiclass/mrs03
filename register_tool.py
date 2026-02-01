import requests
import json

# Configuration
API_URL = "http://localhost:8000/api/register"
ADMIN_SECRET = "MRS_ADMIN_2026"

def register_user():
    print("--- MRS Registration Tool (Python) ---")
    name = input("Enter Name: ")
    email = input("Enter Email: ")
    password = input("Enter Password: ")
    
    print("\nSelect Role:")
    print("1. Student")
    print("2. Teacher")
    print("3. Admin")
    role_choice = input("Choice (1-3): ")
    
    role_map = {"1": "Student", "2": "Teacher", "3": "Admin"}
    role = role_map.get(role_choice, "Student")
    
    payload = {"name": name, "email": email, "password": password, "role": role}
    
    if role == "Admin":
        payload["adminKey"] = ADMIN_SECRET
        print(f"Auto-filling Admin Key: {ADMIN_SECRET}")

    try:
        response = requests.post(API_URL, json=payload)
        print(f"\nResponse [{response.status_code}]: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    register_user()