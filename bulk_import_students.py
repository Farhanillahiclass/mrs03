import csv
import requests
import sys
import os

# Configuration
API_URL = "http://localhost:8000/api/register"
DEFAULT_CSV_FILE = "students.csv"

def bulk_import(csv_file_path):
    if not os.path.exists(csv_file_path):
        print(f"Error: File '{csv_file_path}' not found.")
        print("Please create a CSV file with headers: name, email, password")
        return

    print(f"--- Starting Bulk Import from {csv_file_path} ---")
    
    success_count = 0
    fail_count = 0

    try:
        with open(csv_file_path, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            # Validate headers
            required_headers = {'name', 'email', 'password'}
            if not reader.fieldnames or not required_headers.issubset(set(reader.fieldnames)):
                print(f"Error: CSV file must contain the following headers: {', '.join(required_headers)}")
                return

            for row in reader:
                payload = {
                    "name": row['name'].strip(),
                    "email": row['email'].strip(),
                    "password": row['password'].strip(),
                    "role": "Student"  # Enforce Student role for this import
                }

                try:
                    response = requests.post(API_URL, json=payload)
                    if response.status_code == 200:
                        print(f"[SUCCESS] Imported: {payload['email']}")
                        success_count += 1
                    else:
                        print(f"[FAILED]  {payload['email']} - {response.json().get('message', 'Unknown error')}")
                        fail_count += 1
                except requests.exceptions.ConnectionError:
                    print(f"[ERROR]   Could not connect to server at {API_URL}. Is it running?")
                    return

    except Exception as e:
        print(f"An unexpected error occurred: {e}")

    print(f"\n--- Import Summary ---\nSuccessful: {success_count}\nFailed:     {fail_count}")

if __name__ == "__main__":
    # Use command line argument if provided, otherwise default
    filename = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV_FILE
    bulk_import(filename)