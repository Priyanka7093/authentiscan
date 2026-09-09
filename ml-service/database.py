import os
from datetime import datetime
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, Index
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if not DATABASE_URL:
    if DB_PASSWORD:
        DATABASE_URL = f"mysql+mysqlconnector://root:{quote_plus(DB_PASSWORD)}@127.0.0.1:3306/deepfake_db"
    else:
        DATABASE_URL = "sqlite:///./deepfake_db.sqlite"

# Handle Render PostgreSQL URL prefix (postgres:// -> postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
elif DATABASE_URL.startswith("postgresql"):
    engine_args["pool_pre_ping"] = True
    engine_args["pool_size"] = 5
    engine_args["max_overflow"] = 10

engine = create_engine(DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    video_hash = Column(String(64), index=True, nullable=True)
    filename = Column(String(255), nullable=False)
    prediction = Column(String(10), nullable=False)
    raw_probability = Column(Float, nullable=False)
    fake_probability = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    analysis_time = Column(Float, nullable=True, default=0.0)
    frames_analyzed = Column(Integer, nullable=True, default=20)
    model_version = Column(String(50), nullable=True, default="v2.0-mobilenetv2-lstm")
    explainability_available = Column(Boolean, nullable=True, default=True)
    cache_hit = Column(Boolean, nullable=True, default=False)
    gradcam_image = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_predictions_hash_created", "video_hash", "created_at"),
    )


# Alias for backward and forward compatibility
AnalysisResult = PredictionRecord


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(PredictionRecord).count() == 0:
            sample_records = [
                PredictionRecord(
                    video_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    filename="sample_real.mp4",
                    prediction="REAL",
                    raw_probability=0.08,
                    fake_probability=0.08,
                    confidence=0.92,
                    analysis_time=1.2,
                    frames_analyzed=20,
                    model_version="v2.0-mobilenetv2-lstm",
                    explainability_available=True,
                    cache_hit=False,
                    created_at=datetime.utcnow()
                ),
                PredictionRecord(
                    video_hash="7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
                    filename="sample_fake.mp4",
                    prediction="FAKE",
                    raw_probability=0.94,
                    fake_probability=0.94,
                    confidence=0.94,
                    analysis_time=1.4,
                    frames_analyzed=20,
                    model_version="v2.0-mobilenetv2-lstm",
                    explainability_available=True,
                    cache_hit=False,
                    created_at=datetime.utcnow()
                )
            ]
            db.add_all(sample_records)
            db.commit()
    except Exception as e:
        print(f"Notice during db init seeding: {e}")
        db.rollback()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()