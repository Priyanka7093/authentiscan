import requests

url = "http://127.0.0.1:8001/predict/video"

with open("samples/webcam_test.mp4", "rb") as f:
    response = requests.post(url, files={"file": f})

print("Status code:", response.status_code)
print("Response:", response.json())