import requests

# Calls the HISTORY SERVICE (8002), which internally forwards to the ML SERVICE (8001)
url = "http://127.0.0.1:8002/predict/npy"

real_path = r"C:\deepfake-project\ml-service\samples\sample_real.npy"
fake_path = r"C:\deepfake-project\ml-service\samples\sample_fake.npy"

with open(real_path, "rb") as f:
    response = requests.post(url, files={"file": f})
print("REAL sample result:", response.json())

with open(fake_path, "rb") as f:
    response = requests.post(url, files={"file": f})
print("FAKE sample result:", response.json())

# Confirm it was saved via the History Service's own CRUD
response = requests.get("http://127.0.0.1:8002/predictions")
print("\nAll saved predictions:", response.json())