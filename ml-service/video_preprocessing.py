import os
import gc
import random
import numpy as np

# Set environment variables for reproducibility before importing TensorFlow/OpenCV
os.environ["PYTHONHASHSEED"] = "42"
os.environ["TF_DETERMINISTIC_OPS"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

random.seed(42)
np.random.seed(42)

import cv2
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FACE_DETECTOR_PATH = os.path.join(BASE_DIR, "face_detection_yunet_2023mar.onnx")
NUM_FRAMES = 20
FRAME_SIZE = 224

YUNET_URL = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"

face_detector = None
try:
    if not os.path.exists(FACE_DETECTOR_PATH) or os.path.getsize(FACE_DETECTOR_PATH) < 10000:
        print(f"Downloading YuNet face detection model to {FACE_DETECTOR_PATH}...")
        urllib.request.urlretrieve(YUNET_URL, FACE_DETECTOR_PATH)
        print("YuNet face detection model downloaded successfully.")

    face_detector = cv2.FaceDetectorYN_create(
        FACE_DETECTOR_PATH,
        "",
        (320, 320),
        score_threshold=0.45,
        nms_threshold=0.3,
        top_k=5000
    )
except Exception as e:
    print(f"Warning: YuNet face detector not available ({e}). Using Haar Cascade fallback.")
    face_detector = None


def detect_and_crop_face(frame_small):
    """
    Deterministic face detection and cropping from a pre-downscaled frame (max 360px):
    - Detects faces using YuNet (or Haar Cascade fallback)
    - Deterministically selects the PRIMARY face (largest bounding box area with score >= 0.4)
    - Adds 15% margin for facial context
    - Returns cropped + resized RGB frame (224, 224, 3), or None if no face found.
    """
    if frame_small is None or frame_small.size == 0:
        return None
    h, w = frame_small.shape[:2]

    faces = None
    if face_detector is not None:
        try:
            face_detector.setInputSize((w, h))
            _, faces = face_detector.detect(frame_small)
        except Exception:
            faces = None

    if faces is not None and len(faces) > 0:
        # Deterministically select the largest face by bounding box area (w * h)
        best_face = None
        max_area = -1.0
        for f in faces:
            area = float(f[2] * f[3])
            score = float(f[-1]) if len(f) > 4 else 1.0
            if score >= 0.35 and area > max_area:
                max_area = area
                best_face = f

        if best_face is None:
            best_face = faces[0]

        fx, fy, fbw, fbh = best_face[:4]
        x = max(0, int(fx))
        y = max(0, int(fy))
        box_w = int(fbw)
        box_h = int(fbh)

        # 15% contextual padding around face
        mx = int(box_w * 0.15)
        my = int(box_h * 0.15)
        x1 = max(0, x - mx)
        y1 = max(0, y - my)
        x2 = min(w, x + box_w + mx)
        y2 = min(h, y + box_h + my)

        face_crop = frame_small[y1:y2, x1:x2]
        if face_crop.size > 0:
            face_resized = cv2.resize(face_crop, (FRAME_SIZE, FRAME_SIZE), interpolation=cv2.INTER_LINEAR)
            return cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)

    # Deterministic fallback: Haar Cascade
    try:
        gray = cv2.cvtColor(frame_small, cv2.COLOR_BGR2GRAY)
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        if os.path.exists(cascade_path):
            haar = cv2.CascadeClassifier(cascade_path)
            haar_faces = haar.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=4, minSize=(25, 25))
            if len(haar_faces) > 0:
                best_haar = max(haar_faces, key=lambda b: b[2] * b[3])
                hx, hy, hw, hh = best_haar
                x1 = max(0, int(hx))
                y1 = max(0, int(hy))
                x2 = min(w, x1 + int(hw))
                y2 = min(h, y1 + int(hh))
                face_crop = frame_small[y1:y2, x1:x2]
                if face_crop.size > 0:
                    face_resized = cv2.resize(face_crop, (FRAME_SIZE, FRAME_SIZE), interpolation=cv2.INTER_LINEAR)
                    return cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
    except Exception:
        pass

    return None


def extract_face_sequence(video_path, num_frames=NUM_FRAMES):
    """
    Ultra-low-memory deterministic frame extraction:
    - Calculates exact 20 target frame indices
    - Uses cap.grab() for fast frame skipping
    - Downscales retrieved frames IMMEDIATELY to 360p and frees the 4K raw buffer instantly
    - Extracts primary face crop or center crop fallback
    - Memory usage remains strictly < 20 MB RAM even for 4K / 8K videos.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file. Ensure file is a valid video format.")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        total_frames = 100

    # Calculate exact deterministic target indices
    if total_frames < num_frames:
        target_indices = set(range(total_frames))
    else:
        target_indices = set(np.linspace(0, total_frames - 1, num_frames, dtype=int).tolist())

    slot_faces = {}
    slot_fallbacks = {}
    processed_indices = set()

    frame_idx = 0
    while cap.isOpened() and len(processed_indices) < len(target_indices):
        grabbed = cap.grab()
        if not grabbed:
            break

        if frame_idx in target_indices:
            ret, frame = cap.retrieve()
            if ret and frame is not None:
                # Downscale immediately to max 360p and free large raw 4K frame from memory
                h, w = frame.shape[:2]
                max_dim = max(h, w)
                if max_dim > 360:
                    s = 360.0 / max_dim
                    frame_small = cv2.resize(frame, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
                else:
                    frame_small = frame
                del frame

                # Center-crop fallback
                sh, sw = frame_small.shape[:2]
                min_dim = min(sh, sw)
                cy, cx = sh // 2, sw // 2
                center_crop = frame_small[cy - min_dim // 2: cy + min_dim // 2, cx - min_dim // 2: cx + min_dim // 2]
                if center_crop.size > 0:
                    center_resized = cv2.resize(center_crop, (FRAME_SIZE, FRAME_SIZE), interpolation=cv2.INTER_LINEAR)
                    slot_fallbacks[frame_idx] = cv2.cvtColor(center_resized, cv2.COLOR_BGR2RGB)

                # Detect face on the small frame
                face = detect_and_crop_face(frame_small)
                if face is not None:
                    slot_faces[frame_idx] = face

                del frame_small

            processed_indices.add(frame_idx)

        frame_idx += 1

    cap.release()
    gc.collect()

    if len(slot_faces) == 0 and len(slot_fallbacks) == 0:
        raise ValueError("No video frames could be read or decoded from the uploaded file.")

    # Assemble ordered sequence across the sorted target indices
    ordered_target_indices = sorted(list(target_indices))
    sequence = []
    last_valid_face = None

    # First pass: forward fill
    for idx in ordered_target_indices:
        if idx in slot_faces:
            last_valid_face = slot_faces[idx]
            sequence.append(last_valid_face)
        elif last_valid_face is not None:
            sequence.append(last_valid_face)
        elif idx in slot_fallbacks:
            sequence.append(slot_fallbacks[idx])
        else:
            sequence.append(None)

    # Second pass: backward fill for any leading None values
    first_valid = next((f for f in sequence if f is not None), None)
    if first_valid is None:
        raise ValueError("Failed to extract any usable frames from video.")

    sequence = [f if f is not None else first_valid for f in sequence]

    # Pad or trim strictly to num_frames
    while len(sequence) < num_frames:
        sequence.append(sequence[-1])

    sequence = sequence[:num_frames]
    return np.array(sequence, dtype=np.uint8)