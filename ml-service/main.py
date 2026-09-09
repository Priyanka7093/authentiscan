import os
import random
import time
import hashlib
import tempfile
import shutil
import io
import logging

# Enforce system-level determinism
os.environ["PYTHONHASHSEED"] = "42"
os.environ["TF_DETERMINISTIC_OPS"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

random.seed(42)

import numpy as np
np.random.seed(42)

import tensorflow as tf
tf.random.set_seed(42)
try:
    tf.config.experimental.enable_op_determinism()
except Exception:
    pass

from tensorflow.keras import layers, models
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from video_preprocessing import extract_face_sequence
from database import init_db, get_db, PredictionRecord, AnalysisResult
from explainability import get_gradcam_overlay
from h2_console import H2_CONSOLE_HTML, execute_h2_query, get_h2_schema_info

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("authentiscan")

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
    Constructs the MobileNetV2 + LSTM deepfake detection architecture:
    Input: (20, 224, 224, 3) RGB
    -> TimeDistributed(MobileNetV2 avg pooling) -> LSTM(128) -> Dropout(0.5)
    -> Dense(64, relu) -> Dropout(0.3) -> Dense(1, sigmoid)
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
logger.info(f"Loading AuthentiScan AI model from {MODEL_WEIGHTS_PATH}...")
model = build_model(freeze_base=True)
if os.path.exists(MODEL_WEIGHTS_PATH):
    model.load_weights(MODEL_WEIGHTS_PATH)
    logger.info("AI Model loaded and weights initialized successfully.")
else:
    logger.warning(f"Model weights file not found at {MODEL_WEIGHTS_PATH}")

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
    logger.info("Model warmup completed successfully.")
except Exception as e:
    logger.warning(f"Warmup notice: {e}")

# Initialize Database Schema
logger.info("Initializing database schema...")
init_db()
logger.info("Database schema ready.")


def compute_sha256(file_path: str) -> str:
    """Computes SHA-256 hash of a file for caching and integrity."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def run_prediction(face_sequence: np.ndarray, generate_explainability: bool = True) -> dict:
    """
    Deterministic inference pipeline:
    - Normalization: MobileNetV2 preprocess_input (maps [0, 255] to [-1, 1])
    - Evaluation Mode: training=False passed to all layers
    - Temporal Classifier: LSTM sequence evaluation
    - Explainability: Grad-CAM heatmap generation on primary frame
    """
    arr = face_sequence.astype("float32")
    arr_preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(arr)

    # Frame-by-frame feature extraction (deterministic & low memory)
    features = []
    for i in range(arr_preprocessed.shape[0]):
        f_in = np.expand_dims(arr_preprocessed[i], axis=0)
        f_out = base_feature_extractor(f_in, training=False)
        features.append(f_out)

    feat_seq = tf.stack(features, axis=1)

    # LSTM temporal evaluation
    x = lstm_layer(feat_seq)
    x = dense_1(x)
    prediction = output_layer(x).numpy()

    raw_probability = float(prediction[0][0])
    fake_probability = round(raw_probability, 4)

    # Mathematically sound confidence calculation
    if fake_probability > 0.5:
        verdict = "FAKE"
        confidence = round(fake_probability, 4)
    else:
        verdict = "REAL"
        confidence = round(1.0 - fake_probability, 4)

    # Optional Grad-CAM explainability
    gradcam_b64 = ""
    if generate_explainability and face_sequence.shape[0] > 0:
        # Choose middle frame (e.g. frame 10 of 20) as primary anchor
        primary_frame_idx = face_sequence.shape[0] // 2
        gradcam_b64 = get_gradcam_overlay(base_feature_extractor, face_sequence[primary_frame_idx])

    return {
        "raw_probability": raw_probability,
        "fake_probability": fake_probability,
        "prediction": verdict,
        "confidence": confidence,
        "gradcam_image": gradcam_b64,
        "explainability_available": bool(gradcam_b64)
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
    Includes SHA-256 result caching, input validation, deterministic inference, and Grad-CAM explainability.
    """
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

        # Compute SHA-256 hash
        video_hash = compute_sha256(tmp_path)

        # Check Cache
        cached_record = db.query(PredictionRecord).filter(
            PredictionRecord.video_hash == video_hash,
            PredictionRecord.model_version == MODEL_VERSION
        ).order_by(PredictionRecord.id.desc()).first()

        if cached_record:
            elapsed = round(time.perf_counter() - start_time, 2)
            logger.info(f"Cache hit for video {file.filename} (hash={video_hash[:8]}...) -> {cached_record.prediction} ({cached_record.confidence*100:.1f}%)")
            return {
                "id": cached_record.id,
                "video_hash": video_hash,
                "filename": file.filename,
                "prediction": cached_record.prediction,
                "raw_probability": cached_record.raw_probability or cached_record.fake_probability,
                "fake_probability": cached_record.fake_probability,
                "confidence": cached_record.confidence,
                "analysis_time": cached_record.analysis_time or elapsed,
                "frames_analyzed": cached_record.frames_analyzed or 20,
                "model_version": cached_record.model_version or MODEL_VERSION,
                "explainability_available": bool(cached_record.explainability_available),
                "gradcam_image": cached_record.gradcam_image or "",
                "cached": True
            }

        # Deterministic frame extraction
        face_sequence = extract_face_sequence(tmp_path, num_frames=20)

        # Run Deterministic Inference & Grad-CAM
        result = run_prediction(face_sequence, generate_explainability=True)
        elapsed = round(time.perf_counter() - start_time, 2)

        # Diagnostic structured logging
        logger.info(
            f"Diagnostic Log: hash={video_hash[:8]}... frames={face_sequence.shape[0]} "
            f"dtype={face_sequence.dtype} min={face_sequence.min()} max={face_sequence.max()} "
            f"prob={result['fake_probability']:.4f} verdict={result['prediction']} conf={result['confidence']:.4f} "
            f"time={elapsed}s"
        )

        # Store in database
        record = PredictionRecord(
            video_hash=video_hash,
            filename=file.filename,
            prediction=result["prediction"],
            raw_probability=result["raw_probability"],
            fake_probability=result["fake_probability"],
            confidence=result["confidence"],
            analysis_time=elapsed,
            frames_analyzed=20,
            model_version=MODEL_VERSION,
            explainability_available=result["explainability_available"],
            cache_hit=False,
            gradcam_image=result["gradcam_image"]
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "id": record.id,
            "video_hash": video_hash,
            "filename": file.filename,
            "prediction": result["prediction"],
            "raw_probability": result["raw_probability"],
            "fake_probability": result["fake_probability"],
            "confidence": result["confidence"],
            "analysis_time": elapsed,
            "frames_analyzed": 20,
            "model_version": MODEL_VERSION,
            "explainability_available": result["explainability_available"],
            "gradcam_image": result["gradcam_image"],
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
        logger.error(f"Error analyzing video: {e}")
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
        result = run_prediction(arr, generate_explainability=False)

        record = PredictionRecord(
            filename=file.filename,
            prediction=result["prediction"],
            raw_probability=result["raw_probability"],
            fake_probability=result["fake_probability"],
            confidence=result["confidence"],
            analysis_time=0.1,
            frames_analyzed=arr.shape[0] if len(arr.shape) >= 2 else 20,
            model_version=MODEL_VERSION,
            explainability_available=False,
            cache_hit=False
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