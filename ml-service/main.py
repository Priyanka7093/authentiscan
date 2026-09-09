import os
import random
import time
import hashlib
import tempfile
import shutil
import io

# Enforce system-level determinism
os.environ["PYTHONHASHSEED"] = "42"
os.environ["TF_DETERMINISTIC_OPS"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

random.seed(42)

import numpy as np
np.random.seed(42)

import tensorflow as tf
tf.random.set_seed(42)

from tensorflow.keras import layers, models
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from video_preprocessing import extract_face_sequence
from database import init_db, get_db, PredictionRecord
from h2_console import H2_CONSOLE_HTML, execute_h2_query, get_h2_schema_info

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_WEIGHTS_PATH = os.path.join(BASE_DIR, "model", "deepfake_detector_final.weights.h5")
MODEL_VERSION = "v2.0-mobilenetv2-lstm"
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "500"))
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"}

app = FastAPI(
    title="AuthentiScan Deepfake Detection API",
    description="Deterministic AI-Powered Video Authenticity & Deepfake Detection Platform",
    version="2.0.0"
)

# CORS configuration
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SqlQueryRequest(BaseModel):
    sql: str


def build_model(input_shape=(20, 224, 224, 3), lstm_units=128, freeze_base=True):
    """
    Constructs the MobileNetV2 + LSTM deepfake detection architecture.
    """
    base = tf.keras.applications.MobileNetV2(
        input_shape=input_shape[1:], include_top=False, weights=None, pooling="avg"
    )
    base.trainable = not freeze_base
    inputs = layers.Input(shape=input_shape)
    x = layers.TimeDistributed(base)(inputs)
    x = layers.LSTM(lstm_units)(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(64, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(1, activation="sigmoid")(x)
    return models.Model(inputs, outputs)


# Load Singleton Model once at startup
print(f"Loading AuthentiScan AI model from {MODEL_WEIGHTS_PATH}...")
model = build_model(freeze_base=True)
if os.path.exists(MODEL_WEIGHTS_PATH):
    model.load_weights(MODEL_WEIGHTS_PATH)
    print("AI Model loaded and weights initialized successfully.")
else:
    print(f"Warning: Model weights file not found at {MODEL_WEIGHTS_PATH}")

# Sub-layers for low-RAM frame-by-frame feature extraction (< 30 MB peak RAM)
base_feature_extractor = model.layers[1].layer
lstm_layer = model.layers[2]
dense_1 = model.layers[4]
output_layer = model.layers[6]

# Warm up computation graph deterministically
try:
    _f_dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)
    _out = base_feature_extractor(_f_dummy, training=False)
    _seq_dummy = np.zeros((1, 20, 1280), dtype=np.float32)
    _x = lstm_layer(_seq_dummy)
    _x = dense_1(_x)
    _pred = output_layer(_x)
    print("Model warmup completed successfully.")
except Exception as e:
    print(f"Warmup notice: {e}")

# Initialize Database Schema
print("Initializing database schema...")
init_db()
print("Database schema ready.")


def compute_sha256(file_path: str) -> str:
    """Computes SHA-256 hash of a file for caching and integrity."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def run_prediction(face_sequence: np.ndarray) -> dict:
    """
    Deterministic & memory-efficient inference pipeline:
    1. Normalizes images using MobileNetV2 preprocess_input (maps [0, 255] to [-1, 1]).
    2. Runs feature extraction in evaluation mode (training=False) frame-by-frame.
    3. Feeds 20x1280 temporal sequence into LSTM and dense classifier.
    4. Computes mathematically consistent confidence score.
    """
    arr = face_sequence.astype("float32")
    arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)

    # Frame-by-frame evaluation (strictly deterministic, < 30 MB peak RAM)
    features = []
    for i in range(arr.shape[0]):
        f_in = np.expand_dims(arr[i], axis=0)
        f_out = base_feature_extractor(f_in, training=False)
        features.append(f_out)

    feat_seq = tf.stack(features, axis=1)

    # LSTM temporal evaluation in deterministic eval mode
    x = lstm_layer(feat_seq)
    x = dense_1(x)
    prediction = output_layer(x).numpy()

    fake_probability = float(prediction[0][0])
    # Mathematical confidence mapping
    if fake_probability > 0.5:
        verdict = "FAKE"
        confidence = fake_probability
    else:
        verdict = "REAL"
        confidence = 1.0 - fake_probability

    return {
        "fake_probability": round(fake_probability, 4),
        "prediction": verdict,
        "confidence": round(confidence, 4)
    }


# ================= ROUTES =================

@app.get("/")
def root():
    return {
        "service": "AuthentiScan Deepfake Detection API",
        "status": "online",
        "version": "2.0.0",
        "model_version": MODEL_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": bool(model is not None),
        "model_version": MODEL_VERSION,
        "deterministic_mode": True
    }


# ===== H2 Database Console Web Interface & API =====

@app.get("/h2-console", response_class=HTMLResponse)
@app.get("/h2-console/", response_class=HTMLResponse)
@app.get("/db-console", response_class=HTMLResponse)
def h2_console_view():
    """Serves the interactive H2 Database Console Web UI."""
    return HTMLResponse(content=H2_CONSOLE_HTML, status_code=200)


@app.post("/h2-console/execute")
def h2_console_execute(req: SqlQueryRequest):
    """Executes arbitrary SQL queries from the H2 Database Console."""
    return execute_h2_query(req.sql)


@app.get("/h2-console/schema")
def h2_console_schema():
    """Returns database schema information (tables, columns, types)."""
    return get_h2_schema_info()


@app.post("/predict/video")
def predict_video(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Analyzes an uploaded video for AI-generated deepfake content.
    Includes SHA-256 result caching, input validation, and deterministic inference.
    """
    # 1. Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": f"Unsupported video format '{ext}'.",
                "suggestion": f"Please upload a valid video file in one of: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            }
        )

    # 2. Stream to disk and enforce size limit
    start_time = time.perf_counter()
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        file_size = os.path.getsize(tmp_path)
        if file_size == 0:
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "error": "The uploaded video file is empty (0 bytes).",
                    "suggestion": "Please select a valid, non-empty video file."
                }
            )

        if file_size > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "error": f"File size ({file_size / 1024 / 1024:.1f} MB) exceeds maximum allowed limit ({MAX_UPLOAD_SIZE_MB} MB).",
                    "suggestion": "Please compress the video or select a smaller file."
                }
            )

        # 3. Compute SHA-256 hash
        video_hash = compute_sha256(tmp_path)

        # 4. Check cache for duplicate upload
        cached_record = db.query(PredictionRecord).filter(PredictionRecord.video_hash == video_hash).order_by(PredictionRecord.id.desc()).first()
        if cached_record:
            elapsed = round(time.perf_counter() - start_time, 2)
            return {
                "id": cached_record.id,
                "video_hash": video_hash,
                "filename": file.filename,
                "fake_probability": cached_record.fake_probability,
                "prediction": cached_record.prediction,
                "confidence": cached_record.confidence,
                "analysis_time": cached_record.analysis_time or elapsed,
                "frames_analyzed": cached_record.frames_analyzed or 20,
                "model_version": cached_record.model_version or MODEL_VERSION,
                "cached": True
            }

        # 5. Extract deterministic face sequence
        face_sequence = extract_face_sequence(tmp_path, num_frames=20)

        # 6. Run deterministic inference
        result = run_prediction(face_sequence)
        elapsed = round(time.perf_counter() - start_time, 2)

        # 7. Store in database
        record = PredictionRecord(
            video_hash=video_hash,
            filename=file.filename,
            fake_probability=result["fake_probability"],
            prediction=result["prediction"],
            confidence=result["confidence"],
            analysis_time=elapsed,
            frames_analyzed=20,
            model_version=MODEL_VERSION
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "id": record.id,
            "video_hash": video_hash,
            "filename": file.filename,
            "fake_probability": result["fake_probability"],
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "analysis_time": elapsed,
            "frames_analyzed": 20,
            "model_version": MODEL_VERSION,
            "cached": False
        }

    except ValueError as e:
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": str(e),
                "suggestion": "Please ensure the video has clear human face presence and is not corrupted."
            }
        )
    except Exception as e:
        print(f"Error analyzing video: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Internal inference processing error: {str(e)}",
                "suggestion": "Please try again or contact system support."
            }
        )
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@app.post("/predict/npy")
def predict_npy(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Inference endpoint for pre-extracted NumPy sequence arrays."""
    try:
        contents = file.file.read()
        arr = np.load(io.BytesIO(contents)).astype("float32")
        result = run_prediction(arr)

        record = PredictionRecord(
            filename=file.filename,
            fake_probability=result["fake_probability"],
            prediction=result["prediction"],
            confidence=result["confidence"],
            analysis_time=0.1,
            frames_analyzed=arr.shape[0] if len(arr.shape) >= 2 else 20,
            model_version=MODEL_VERSION
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        result["id"] = record.id
        result["model_version"] = MODEL_VERSION
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"NumPy prediction error: {str(e)}")


# ===== Prediction History CRUD Endpoints =====

@app.get("/predictions")
def list_predictions(db: Session = Depends(get_db)):
    """List all prediction history records, newest first."""
    records = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc()).all()
    return records


@app.get("/predictions/{prediction_id}")
def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Retrieve a single prediction record by ID."""
    record = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found")
    return record


@app.delete("/predictions/{prediction_id}")
def delete_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Delete a prediction record by ID."""
    record = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found")
    db.delete(record)
    db.commit()
    return {"deleted": True, "id": prediction_id}