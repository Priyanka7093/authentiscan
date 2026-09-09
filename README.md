# AuthentiScan — AI-Powered Video Deepfake Detection & Explainability Platform

AuthentiScan is an enterprise-grade, deterministic AI platform designed to detect deepfake and manipulated video media with high precision. It combines frame-level spatial feature extraction (**MobileNetV2**), temporal sequence analysis (**LSTM**), and **Grad-CAM spatial explainability heatmaps**.

---

## 🏗️ System Architecture

```text
                               ┌─────────────────────────────┐
                               │     React + Vite Frontend   │
                               └──────────────┬──────────────┘
                                              │  HTTPS
                                              ▼
                               ┌─────────────────────────────┐
                               │   FastAPI Backend Service   │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │ Deterministic Pipeline  │                     │ Database & Result Cache │
         │  • SHA-256 Video Hash   │                     │  • SQLite (Dev)         │
         │  • 20-Frame Sampling    │                     │  • PostgreSQL (Prod)    │
         │  • YuNet Face Alignment │                     │  • Prediction History   │
         │  • MobileNetV2 + LSTM   │                     └─────────────────────────┘
         │  • Grad-CAM Heatmap     │
         └─────────────────────────┘
```

---

## 🧬 AI Model Architecture

The deep learning model evaluates spatial features across 20 equidistant video frames and models facial temporal inconsistencies over time:

1. **Input Sequence**: `(20, 224, 224, 3)` in **RGB** color space.
2. **Preprocessing**: Normalization to `[-1, 1]` via `tf.keras.applications.mobilenet_v2.preprocess_input`.
3. **Spatial Feature Extraction**: Pre-trained `MobileNetV2` backbone (`pooling="avg"`, 1280-dim feature vector per frame).
4. **Temporal Classification**: `LSTM(128 units)` -> `Dropout(0.5)` -> `Dense(64, activation="relu")` -> `Dropout(0.3)` -> `Dense(1, activation="sigmoid")`.
5. **Class Output**: 
   - `P(Fake) > 0.50` $\implies$ **`FAKE`** (Confidence = $P(\text{Fake})$)
   - `P(Fake) \le 0.50` $\implies$ **`REAL`** (Confidence = $1.0 - P(\text{Fake})$)
6. **Explainability**: Grad-CAM heatmap generated from the `out_relu` activation layer of MobileNetV2 on the primary facial frame.

---

## 🔒 Deterministic Inference Guarantees

AuthentiScan eliminates non-deterministic inference variance through:
* **Fixed Random Seeds**: System-wide configuration of `PYTHONHASHSEED=42`, `random.seed(42)`, `np.random.seed(42)`, `tf.random.set_seed(42)`, and `tf.config.experimental.enable_op_determinism()`.
* **Deterministic Frame Indexing**: Target frame indices are calculated deterministically across the video duration (`np.linspace(0, total_frames - 1, 20, dtype=int)`).
* **Primary Face Selection**: Deterministically selects the primary face using the largest bounding box area ($\text{width} \times \text{height}$) with score $\ge 0.5$.
* **Temporal Slot Integrity**: Forward/backward temporal filling ensures each of the 20 slots corresponds to its exact temporal position without shifting.
* **Evaluation Mode**: All model layers execute strictly with `training=False`.
* **Duplicate Video Caching**: Instant lookup for identical files matching `SHA-256 + model_version`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API service metadata & status |
| `GET` | `/health` | Health check endpoint returning model version and deterministic status |
| `POST` | `/predict/video` | Uploads and analyzes a video file for deepfake manipulation |
| `POST` | `/predict/npy` | Evaluates pre-extracted NumPy sequence arrays `(20, 224, 224, 3)` |
| `GET` | `/predictions` | Lists recent prediction history |
| `GET` | `/predictions/{id}` | Retrieves detailed analysis record for a specific prediction |
| `DELETE` | `/predictions/{id}` | Deletes a prediction history record |
| `GET` | `/h2-console` | Standalone interactive SQL console for database management |

---

## 🧪 Automated Testing Suite

Run test suites locally:
```bash
# 1. Prediction consistency test (5 consecutive runs on same video -> asserts 0.0 variance)
python tests/test_prediction_consistency.py

# 2. Error handling test (empty files, invalid extensions, corrupted media)
python tests/test_error_handling.py

# 3. Model evaluation benchmark (Accuracy, Precision, Recall, F1, Confusion Matrix)
python tests/test_model_metrics.py
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (refer to `.env.example`):
```env
DATABASE_URL=sqlite:///./deepfake_db.sqlite
ALLOWED_ORIGINS=http://localhost:5173,https://authentiscan-frontend.onrender.com
MAX_UPLOAD_SIZE_MB=500
MODEL_VERSION=v2.0-mobilenetv2-lstm
```

---

## 🚀 Production Deployment (Render)

This repository includes a `render.yaml` blueprint for one-click deployment:

1. **Backend Web Service**:
   - Runtime: Python 3.11
   - Build Command: `pip install -r ml-service/requirements.txt`
   - Start Command: `cd ml-service && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health Check: `/health`

2. **Frontend Static Site**:
   - Runtime: Node.js (Vite React)
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Rewrites: `/* -> /index.html`

Live Production URLs:
- **Frontend App**: [https://authentiscan-frontend.onrender.com](https://authentiscan-frontend.onrender.com)
- **Backend API**: [https://authentiscan-backend-wfrb.onrender.com](https://authentiscan-backend-wfrb.onrender.com)
- **Swagger Documentation**: [https://authentiscan-backend-wfrb.onrender.com/docs](https://authentiscan-backend-wfrb.onrender.com/docs)
