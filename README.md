# Deepfake Detection System

A full-stack deepfake detection application that analyzes video files and NumPy face sequences using a hybrid **MobileNetV2 + LSTM** deep learning model. The system provides real-time predictions, confidence scores, and prediction history through REST APIs.

---

## 🏗️ Project Architecture

The project is organized into multiple services:

* **Frontend** — React + Vite + Tailwind CSS
* **API Gateway** — FastAPI gateway that handles frontend requests
* **History Service** — FastAPI service responsible for prediction history and database operations
* **ML Inference Service** — FastAPI service for loading the trained deepfake detection model and performing inference
* **ML Service** — ML processing, video preprocessing, model utilities, and database integration
* **Database** — MySQL schema, sample data, and useful SQL queries

### High-Level Architecture

```text
                    ┌─────────────────────┐
                    │      Frontend       │
                    │ React + Vite +      │
                    │ Tailwind CSS        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    API Gateway      │
                    │      FastAPI        │
                    │      Port 8000      │
                    └───────┬─────┬───────┘
                            │     │
                 ┌──────────┘     └──────────┐
                 ▼                           ▼
       ┌──────────────────┐       ┌──────────────────┐
       │   ML Service     │       │ History Service  │
       │    FastAPI       │       │    FastAPI       │
       │    Port 8001     │       │    Port 8002     │
       └────────┬─────────┘       └────────┬─────────┘
                │                          │
                ▼                          ▼
       ┌──────────────────┐       ┌──────────────────┐
       │ MobileNetV2 +    │       │     Database     │
       │      LSTM        │       │      MySQL       │
       └──────────────────┘       └──────────────────┘
```

---

## 📁 Folder Structure

```text
deepfake-project/
│
├── api-gateway/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── history-service/
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   ├── .env.example
│   └── test_microservices.py
│
├── ml-inference-service/
│   ├── main.py
│   ├── video_preprocessing.py
│   └── requirements.txt
│
├── ml-service/
│   ├── main.py
│   ├── database.py
│   ├── load_model.py
│   ├── video_preprocessing.py
│   ├── requirements.txt
│   └── .env.example
│
├── database/
│   ├── schema.sql
│   ├── data.sql
│   └── queries.sql
│
├── .gitignore
└── README.md
```

---

## 🧠 Deepfake Detection Model

The system uses a hybrid deep learning architecture combining **MobileNetV2** for spatial feature extraction and **LSTM** for temporal sequence analysis.

### Model Architecture

```text
Input Face Sequence
        │
        ▼
   MobileNetV2
        │
        ▼
  TimeDistributed
        │
        ▼
      LSTM
        │
        ▼
     Dropout
        │
        ▼
   Dense Layer
        │
        ▼
   Sigmoid Output
        │
        ▼
    REAL / FAKE
```

### Input

The model processes a sequence of:

```text
20 frames × 224 × 224 × 3
```

Each video is converted into a sequence of face frames before being passed to the model.

### Output

The model produces:

* **Fake probability**
* **Prediction** — `REAL` or `FAKE`
* **Confidence score**

Example:

```json
{
  "fake_probability": 0.9616,
  "prediction": "FAKE",
  "confidence": 0.9616
}
```

---

## 🛠️ Technologies Used

### Frontend

* React
* Vite
* Tailwind CSS
* Axios
* React Router
* Recharts
* jsPDF

### Backend

* Python
* FastAPI
* Uvicorn
* Requests
* SQLAlchemy
* MySQL Connector
* python-dotenv

### Machine Learning

* TensorFlow
* Keras
* MobileNetV2
* LSTM
* NumPy
* OpenCV

### Database

* MySQL

---

## 🗄️ Database Setup

Create the database and required tables using:

```text
database/schema.sql
```

Optional demo records are available in:

```text
database/data.sql
```

Useful SQL queries are available in:

```text
database/queries.sql
```

---

## 🔐 Environment Variables

Real `.env` files are intentionally excluded from Git.

Create:

```text
history-service/.env
ml-service/.env
```

using the corresponding `.env.example` files.

Example:

```env
DB_PASSWORD=your_mysql_password
```

Never commit:

* Database passwords
* API keys
* Access tokens
* Other credentials

---

# ⚙️ Installation

## 1. API Gateway

```powershell
cd api-gateway
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 2. History Service

```powershell
cd history-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 3. ML Service

```powershell
cd ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 4. ML Inference Service

```powershell
cd ml-inference-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 5. Frontend

```powershell
cd frontend
npm install
```

---

# ▶️ Running the Application

Start each service in a **separate terminal**.

## Terminal 1 — ML Service

```powershell
cd C:\deepfake-project\ml-service
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

ML Service:

```text
http://127.0.0.1:8001
```

Health check:

```text
http://127.0.0.1:8001/health
```

---

## Terminal 2 — History Service

```powershell
cd C:\deepfake-project\history-service
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8002
```

History Service:

```text
http://127.0.0.1:8002
```

---

## Terminal 3 — API Gateway

```powershell
cd C:\deepfake-project\api-gateway
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

API Gateway:

```text
http://127.0.0.1:8000
```

---

## Terminal 4 — Frontend

```powershell
cd C:\deepfake-project\frontend
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

---

# 🚀 Deployment on Render

This project includes a `render.yaml` Blueprint for fast, automated deployment on [Render](https://render.com).

### Option 1: Render Blueprint (Recommended)

1. Push this repository to your GitHub account.
2. Log into [Render](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your `authentiscan` GitHub repository.
5. Render will automatically detect `render.yaml` and configure:
   - **Backend Web Service** (`authentiscan-backend`)
   - **Frontend Static Site** (`authentiscan-frontend`)
6. Click **Apply**.
7. Once the backend finishes deploying, copy its URL (e.g. `https://authentiscan-backend.onrender.com`) and add it to your frontend static site environment variable `VITE_API_URL`.

---

### Option 2: Manual Setup on Render

#### 1. Backend Web Service (`ml-service`)
- **Type**: Web Service
- **Runtime**: Python
- **Root Directory**: `ml-service` (or repo root)
- **Build Command**: `pip install -r ml-service/requirements.txt`
- **Start Command**: `cd ml-service && uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `PYTHON_VERSION`: `3.11.9`
  - `DATABASE_URL`: `sqlite:///./deepfake_db.sqlite`

#### 2. Frontend Static Site (`frontend`)
- **Type**: Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-backend-name.onrender.com`
- **Redirects/Rewrites**:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`

---

# 🔌 API Endpoints

## API Gateway

| Method | Endpoint                       | Description                 |
| ------ | ------------------------------ | --------------------------- |
| GET    | `/health`                      | Check gateway health        |
| POST   | `/predict/npy`                 | Analyze NumPy face sequence |
| POST   | `/predict/video`               | Analyze uploaded video      |
| GET    | `/predictions`                 | Get prediction history      |
| GET    | `/predictions/{prediction_id}` | Get a specific prediction   |
| DELETE | `/predictions/{prediction_id}` | Delete a prediction         |

---

## History Service

| Method | Endpoint                       | Description               |
| ------ | ------------------------------ | ------------------------- |
| GET    | `/health`                      | Check service health      |
| POST   | `/predict/npy`                 | Store NumPy prediction    |
| POST   | `/predict/video`               | Store video prediction    |
| GET    | `/predictions`                 | Get prediction history    |
| GET    | `/predictions/{prediction_id}` | Get a specific prediction |
| DELETE | `/predictions/{prediction_id}` | Delete a prediction       |

---

# 🧪 Testing

The ML service has been tested locally using both NumPy samples and video files.

### NumPy Test

Example successful results:

```text
REAL sample:
fake_probability = 0.0086777
prediction       = REAL
confidence       = 0.9913223
```

```text
FAKE sample:
fake_probability = 0.9616303
prediction       = FAKE
confidence       = 0.9616303
```

### Video Test

Example successful video prediction:

```text
Status code: 200

fake_probability = 0.6416897
prediction       = FAKE
confidence       = 0.6416897
```

### Prediction History

Prediction history is successfully returned through:

```text
GET /predictions
```

The history contains:

* Prediction ID
* Filename
* Fake probability
* Prediction
* Confidence
* Timestamp

---

# 🔒 Security

The following files and directories are intentionally excluded from Git:

```text
.env
.venv/
node_modules/
trained model files
large media files
local datasets
generated NumPy samples
__pycache__/
```

Never commit passwords, API keys, tokens, or other credentials.

---

# 🤝 Contributing

1. Clone the repository.
2. Create a new branch.
3. Make your changes.
4. Test the affected service.
5. Commit your changes.
6. Push your branch.
7. Create a Pull Request.

Example:

```powershell
git checkout -b feature/my-feature
git add .
git commit -m "Add my feature"
git push -u origin feature/my-feature
```

---

# 👥 Contributors

* **Priyanka Reddy**
* **Gowtham Sai Garnepudi**

---

## 📄 License

This project is licensed under the MIT License.

Copyright (c) 2026 Priyanka Reddy and Gowtham Sai Garnepudi.

See the [LICENSE](LICENSE) file for details.

