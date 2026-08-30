import requests

# This calls the HISTORY SERVICE (8002), which internally calls the ML SERVICE (8001)
url = "http://127.0.0.1:8002/predict/npy"

with open("../ml-inference-service/samples_placeholder", "rb") as f:
    pass  # placeholder, will fix path next