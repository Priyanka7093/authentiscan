from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import requests

from database import init_db, get_db, PredictionRecord

app = FastAPI(title="History Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ML_SERVICE_URL = "http://127.0.0.1:8001"

print("Initializing database...")
init_db()
print("Database ready.")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict/npy")
async def predict_npy(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    response = requests.post(
        f"{ML_SERVICE_URL}/predict/npy",
        files={"file": (file.filename, contents)}
    )
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="ML service error: " + response.text)

    result = response.json()

    record = PredictionRecord(
        filename=file.filename,
        fake_probability=result["fake_probability"],
        prediction=result["prediction"],
        confidence=result["confidence"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    return result

@app.post("/predict/video")
async def predict_video(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    response = requests.post(
        f"{ML_SERVICE_URL}/predict/video",
        files={"file": (file.filename, contents)}
    )
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="ML service error: " + response.text)

    result = response.json()

    record = PredictionRecord(
        filename=file.filename,
        fake_probability=result["fake_probability"],
        prediction=result["prediction"],
        confidence=result["confidence"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    return result

@app.get("/predictions")
def list_predictions(db: Session = Depends(get_db)):
    records = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc()).all()
    return records

@app.get("/predictions/{prediction_id}")
def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    record = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return record

@app.delete("/predictions/{prediction_id}")
def delete_prediction(prediction_id: int, db: Session = Depends(get_db)):
    record = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    db.delete(record)
    db.commit()
    return {"deleted": True, "id": prediction_id}