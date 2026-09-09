# AuthentiScan — Render & PostgreSQL Production Deployment Guide

This guide describes how to deploy AuthentiScan to Render with automatic scaling, persistent database storage, and low-latency inference.

---

## 1. Architecture Overview

```text
[ React / Vite Frontend ]  (Static Site on Render)
          │  HTTPS
          ▼
[ FastAPI Backend Service ] (Web Service on Render, Python 3.11)
          │  SQLAlchemy
          ▼
[ PostgreSQL / SQLite DB ] (Render Managed PostgreSQL or SQLite)
```

---

## 2. Environment Variables

### Backend Service (`authentiscan-backend`)
| Variable | Description | Example Value |
|---|---|---|
| `PYTHON_VERSION` | Python runtime version | `3.11.9` |
| `DATABASE_URL` | PostgreSQL or SQLite connection URL | `postgresql://user:pass@host:5432/dbname` |
| `ALLOWED_ORIGINS` | Permitted frontend origins for CORS | `https://authentiscan-frontend.onrender.com,http://localhost:5173` |
| `MAX_UPLOAD_SIZE_MB` | Maximum video upload size in MB | `500` |
| `PORT` | Dynamic HTTP port provided by Render | `8001` (managed automatically) |

### Frontend Static Site (`authentiscan-frontend`)
| Variable | Description | Example Value |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | `https://authentiscan-backend-wfrb.onrender.com` |

---

## 3. Deployment Steps via Render Dashboard

### Backend Web Service
1. In Render, select **New +** -> **Web Service**.
2. Connect repository `Priyanka7093/authentiscan`.
3. Set **Root Directory**: `.`
4. Set **Build Command**: `pip install -r ml-service/requirements.txt`
5. Set **Start Command**: `cd ml-service && uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Under **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.9`
   - `DATABASE_URL`: Your PostgreSQL connection string or leave blank for SQLite.
7. Click **Create Web Service**.

### Frontend Static Site
1. In Render, select **New +** -> **Static Site**.
2. Connect repository `Priyanka7093/authentiscan`.
3. Set **Root Directory**: `frontend`
4. Set **Build Command**: `npm install && npm run build`
5. Set **Publish Directory**: `dist`
6. Under **Redirects/Rewrites**, add:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
7. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend-service-url.onrender.com`
8. Click **Create Static Site**.

---

## 4. Verification

After deployment, verify the health and prediction endpoints:
```bash
# Health check
curl -X GET https://authentiscan-backend-wfrb.onrender.com/health

# Prediction endpoint
curl -X POST https://authentiscan-backend-wfrb.onrender.com/predict/video \
  -F "file=@test_video.mp4"
```
