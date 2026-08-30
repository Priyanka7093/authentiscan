# Deepfake Detection System

A full-stack deepfake detection application that analyzes video/NumPy face sequences using a hybrid MobileNetV2 + LSTM deep learning model and provides prediction history through a REST API.

## Project Architecture

The project is organized into multiple services:

- **Frontend** — React + Vite + Tailwind CSS
- **API Gateway** — FastAPI gateway for frontend requests
- **History Service** — FastAPI service responsible for prediction history and database operations
- **ML Inference Service** — FastAPI service for loading the trained deepfake detection model and performing inference
- **ML Service** — ML processing, video preprocessing, model utilities and database integration
- **Database** — MySQL schema, sample data and useful SQL queries

## Folder Structure

`	ext
deepfake-project/
+-- api-gateway/
¦   +-- main.py
¦   +-- requirements.txt
¦
+-- frontend/
¦   +-- src/
¦   +-- public/
¦   +-- package.json
¦   +-- vite.config.js
¦
+-- history-service/
¦   +-- main.py
¦   +-- database.py
¦   +-- requirements.txt
¦   +-- .env.example
¦   +-- test_microservices.py
¦
+-- ml-inference-service/
¦   +-- main.py
¦   +-- video_preprocessing.py
¦   +-- requirements.txt
¦
+-- ml-service/
¦   +-- main.py
¦   +-- database.py
¦   +-- load_model.py
¦   +-- video_preprocessing.py
¦   +-- requirements.txt
¦   +-- .env.example
¦
+-- database/
¦   +-- schema.sql
¦   +-- data.sql
¦   +-- queries.sql
¦
+-- .gitignore
+-- README.md
Technologies
Frontend
React
Vite
Tailwind CSS
Axios
React Router
Recharts
jsPDF
Backend
Python
FastAPI
Uvicorn
Requests
SQLAlchemy
MySQL Connector
python-dotenv
Machine Learning
TensorFlow
Keras
MobileNetV2
LSTM
NumPy
OpenCV
Database
MySQL
Deepfake Detection Model

The system uses a hybrid deep learning architecture:

Input Face Sequence
       ?
MobileNetV2
       ?
TimeDistributed
       ?
LSTM
       ?
Dropout
       ?
Dense Layer
       ?
Sigmoid Output
       ?
REAL / FAKE

The model processes sequences of video frames and produces:

Fake probability
Prediction
Confidence score
Database Setup

Create the database and predictions table using:

database/schema.sql

Optional demo records are available in:

database/data.sql

Useful SQL queries are available in:

database/queries.sql
Environment Variables

Real .env files are intentionally excluded from Git.

Create:

history-service/.env
ml-service/.env

using the corresponding .env.example files.

Example:

DB_PASSWORD=your_mysql_password

Do not commit real passwords, API keys or other secrets.

Installing Backend Dependencies
API Gateway
cd api-gateway
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
History Service
cd history-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
ML Service
cd ml-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
ML Inference Service
cd ml-inference-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
Frontend Setup
cd frontend
npm install
npm run dev

The Vite development server normally runs on:

http://localhost:5173
Running the Services

Start each service in a separate terminal.

ML Service
cd ml-service
.\.venv\Scripts\activate
uvicorn main:app --host 127.0.0.1 --port 8001
History Service
cd history-service
.\.venv\Scripts\activate
uvicorn main:app --host 127.0.0.1 --port 8002
API Gateway
cd api-gateway
.\.venv\Scripts\activate
uvicorn main:app --host 127.0.0.1 --port 8000
Frontend
cd frontend
npm run dev
API Endpoints
API Gateway
GET    /health
POST   /predict/npy
POST   /predict/video
GET    /predictions
GET    /predictions/{prediction_id}
DELETE /predictions/{prediction_id}
History Service
GET    /health
POST   /predict/npy
POST   /predict/video
GET    /predictions
GET    /predictions/{prediction_id}
DELETE /predictions/{prediction_id}
Security

The following are intentionally excluded from Git:

.env files
Python virtual environments
node_modules
trained model files
large media files
local datasets
generated NumPy samples
Python cache files

Never commit passwords, API keys or other credentials.

Contributing
Clone the repository.
Create a new branch.
Make your changes.
Test the affected service.
Commit your changes.
Push your branch.
Create a Pull Request.

Example:

git checkout -b feature/my-feature
git add .
git commit -m "Add my feature"
git push -u origin feature/my-feature
Contributors
Priyanka Reddy
Gowtham Sai Garnepudi

