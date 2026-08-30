from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI(title="API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HISTORY_SERVICE_URL = "http://127.0.0.1:8002"

@app.get("/health")
def health():
    """Gateway health check — also verifies downstream services are reachable."""
    try:
        history_health = requests.get(f"{HISTORY_SERVICE_URL}/health", timeout=3).json()
    except requests.exceptions.RequestException:
        history_health = {"status": "unreachable"}
    return {"gateway": "ok", "history_service": history_health}

@app.post("/predict/npy")
async def predict_npy(file: UploadFile = File(...)):
    contents = await file.read()
    response = requests.post(
        f"{HISTORY_SERVICE_URL}/predict/npy",
        files={"file": (file.filename, contents)}
    )
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()

@app.post("/predict/video")
async def predict_video(file: UploadFile = File(...)):
    contents = await file.read()
    response = requests.post(
        f"{HISTORY_SERVICE_URL}/predict/video",
        files={"file": (file.filename, contents)}
    )
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()

@app.get("/predictions")
def list_predictions():
    response = requests.get(f"{HISTORY_SERVICE_URL}/predictions")
    return response.json()

@app.get("/predictions/{prediction_id}")
def get_prediction(prediction_id: int):
    response = requests.get(f"{HISTORY_SERVICE_URL}/predictions/{prediction_id}")
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()

@app.delete("/predictions/{prediction_id}")
def delete_prediction(prediction_id: int):
    response = requests.delete(f"{HISTORY_SERVICE_URL}/predictions/{prediction_id}")
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()