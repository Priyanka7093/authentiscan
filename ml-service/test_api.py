import requests

url = "http://127.0.0.1:8001/predict/npy"

with open("samples/sample_real.npy", "rb") as f:
    response = requests.post(url, files={"file": f})
print("REAL sample result:", response.json())

with open("samples/sample_fake.npy", "rb") as f:
    response = requests.post(url, files={"file": f})
print("FAKE sample result:", response.json())