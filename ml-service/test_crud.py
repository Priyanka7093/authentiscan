import requests

BASE = "http://127.0.0.1:8000"

# Create a prediction (this also saves it to the DB)
with open("samples/sample_real.npy", "rb") as f:
    response = requests.post(f"{BASE}/predict/npy", files={"file": f})
print("CREATE:", response.json())

# List all predictions
response = requests.get(f"{BASE}/predictions")
print("\nLIST ALL:", response.json())

# Get the specific one we just created
new_id = response.json()[0]["id"]  # most recent, since list is ordered desc
response = requests.get(f"{BASE}/predictions/{new_id}")
print(f"\nGET ONE (id={new_id}):", response.json())

# Delete it
response = requests.delete(f"{BASE}/predictions/{new_id}")
print(f"\nDELETE (id={new_id}):", response.json())

# Confirm it's gone
response = requests.get(f"{BASE}/predictions/{new_id}")
print(f"\nGET AFTER DELETE (should be 404):", response.status_code, response.json())