import os
import sys
import tempfile
from fastapi.testclient import TestClient

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "ml-service"))

from main import app

client = TestClient(app)


def test_empty_file_rejection():
    """Tests that an empty 0-byte video file is rejected with 422 Unprocessable Entity."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            response = client.post("/predict/video", files={"file": ("empty.mp4", f, "video/mp4")})
        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
        assert "empty" in data["error"].lower()
        print("[PASS] Empty video file rejected properly with 422.")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_invalid_extension_rejection():
    """Tests that non-video file formats (e.g. .pdf, .txt) are rejected."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        tmp.write(b"Hello world this is not a video")
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            response = client.post("/predict/video", files={"file": ("document.txt", f, "text/plain")})
        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
        assert "unsupported" in data["error"].lower()
        print("[PASS] Invalid file extension rejected properly with 422.")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_health_endpoint():
    """Tests that the health endpoint returns healthy status and model version."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["deterministic_mode"] is True
    print("[PASS] Health check returns 200 with model loaded and deterministic mode.")


if __name__ == "__main__":
    test_empty_file_rejection()
    test_invalid_extension_rejection()
    test_health_endpoint()
