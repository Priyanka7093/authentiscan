import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import io
import tempfile
import os
from fastapi.middleware.cors import CORSMiddleware

from video_preprocessing import extract_face_sequence
from database import init_db, get_db, PredictionRecord


app = FastAPI(title="Deepfake Detection API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_model(input_shape=(20, 224, 224, 3), lstm_units=128, freeze_base=True):
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

print("Loading model...")
model = build_model(freeze_base=True)
model.load_weights("model/deepfake_detector_final.weights.h5")
print("Model loaded and ready.")

# Extract layers for memory-efficient forward passes on low-RAM cloud instances
base_feature_extractor = model.layers[1].layer
lstm_layer = model.layers[2]
dropout_1 = model.layers[3]
dense_1 = model.layers[4]
dropout_2 = model.layers[5]
output_layer = model.layers[6]

# Warm up layers
try:
    _f_dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)
    _out = base_feature_extractor(_f_dummy, training=False)
    _seq_dummy = np.zeros((1, 20, 1280), dtype=np.float32)
    _x = lstm_layer(_seq_dummy)
    _x = dense_1(_x)
    _pred = output_layer(_x)
    print("Model warmup complete.")
except Exception as e:
    print(f"Warmup notice: {e}")

print("Initializing database...")
init_db()
print("Database ready.")

def run_prediction(face_sequence):
    """
    Memory-efficient inference: processes frames one by one through MobileNetV2
    to prevent memory spikes, then executes LSTM temporal classification.
    """
    arr = face_sequence.astype("float32")
    arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)

    # Low-memory frame-by-frame feature extraction (< 30 MB peak RAM)
    features = []
    for i in range(arr.shape[0]):
        f_in = np.expand_dims(arr[i], axis=0) # (1, 224, 224, 3)
        f_out = base_feature_extractor(f_in, training=False) # (1, 1280)
        features.append(f_out)

    feat_seq = tf.stack(features, axis=1) # (1, 20, 1280)

    # Fast LSTM sequence evaluation
    x = lstm_layer(feat_seq)
    x = dropout_1(x, training=False)
    x = dense_1(x)
    x = dropout_2(x, training=False)
    prediction = output_layer(x).numpy()

    fake_probability = float(prediction[0][0])
    return {
        "fake_probability": fake_probability,
        "prediction": "FAKE" if fake_probability > 0.5 else "REAL",
        "confidence": fake_probability if fake_probability > 0.5 else 1 - fake_probability
    }

@app.get("/")
def root():
    return {
        "service": "AuthentiScan Deepfake Detection API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}

@app.post("/predict/npy")
def predict_npy(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = file.file.read()
        arr = np.load(io.BytesIO(contents)).astype("float32")
        result = run_prediction(arr)

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
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"NumPy prediction error: {str(e)}")

@app.post("/predict/video")
def predict_video(file: UploadFile = File(...), db: Session = Depends(get_db)):
    suffix = os.path.splitext(file.filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        contents = file.file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        face_sequence = extract_face_sequence(tmp_path)
        result = run_prediction(face_sequence)

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
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"Error processing video: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

# ===== CRUD endpoints for prediction history =====

@app.get("/predictions")
def list_predictions(db: Session = Depends(get_db)):
    """List all prediction history records, most recent first."""
    records = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc()).all()
    return records

@app.get("/predictions/{prediction_id}")
def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Get a single prediction record by ID."""
    record = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return record

@app.delete("/predictions/{prediction_id}")
def delete_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Delete a prediction record by ID."""
    record = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    db.delete(record)
    db.commit()
    return {"deleted": True, "id": prediction_id}