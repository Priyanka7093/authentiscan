import cv2
import numpy as np
import os
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
        score_threshold=0.6
    )
except Exception as e:
    print(f"Warning: YuNet face detector not available ({e}). Using Haar Cascade fallback.")
    face_detector = None


def detect_and_crop_face(frame):
    """
    frame: raw BGR frame from OpenCV (H, W, 3)
    Returns: cropped+resized face (224, 224, 3) RGB, or None if no face detected
    """
    if frame is None or frame.size == 0:
        return None
    h, w = frame.shape[:2]

    # Downscale large frames for fast, memory-efficient face detection (max 480px)
    max_dim = 480
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        detect_w, detect_h = int(w * scale), int(h * scale)
        detect_frame = cv2.resize(frame, (detect_w, detect_h), interpolation=cv2.INTER_AREA)
    else:
        scale = 1.0
        detect_w, detect_h = w, h
        detect_frame = frame

    faces = None
    if face_detector is not None:
        try:
            face_detector.setInputSize((detect_w, detect_h))
            _, faces = face_detector.detect(detect_frame)
        except Exception:
            faces = None

    if faces is not None and len(faces) > 0:
        fx, fy, fbw, fbh = faces[0][:4]
        x = max(0, int(fx / scale))
        y = max(0, int(fy / scale))
        box_w = int(fbw / scale)
        box_h = int(fbh / scale)

        mx = int(box_w * 0.1)
        my = int(box_h * 0.1)
        x1 = max(0, x - mx)
        y1 = max(0, y - my)
        x2 = min(w, x + box_w + mx)
        y2 = min(h, y + box_h + my)

        face_crop = frame[y1:y2, x1:x2]
        if face_crop.size > 0:
            face_resized = cv2.resize(face_crop, (FRAME_SIZE, FRAME_SIZE), interpolation=cv2.INTER_AREA)
            return cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)

    # Fast fallback: Haar Cascade
    try:
        gray = cv2.cvtColor(detect_frame, cv2.COLOR_BGR2GRAY)
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        if os.path.exists(cascade_path):
            haar = cv2.CascadeClassifier(cascade_path)
            haar_faces = haar.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=3, minSize=(30, 30))
            if len(haar_faces) > 0:
                hx, hy, hw, hh = haar_faces[0]
                x1 = max(0, int(hx / scale))
                y1 = max(0, int(hy / scale))
                x2 = min(w, x1 + int(hw / scale))
                y2 = min(h, y1 + int(hh / scale))
                face_crop = frame[y1:y2, x1:x2]
                if face_crop.size > 0:
                    face_resized = cv2.resize(face_crop, (FRAME_SIZE, FRAME_SIZE), interpolation=cv2.INTER_AREA)
                    return cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
    except Exception:
        pass

    return None


def extract_face_sequence(video_path, num_frames=NUM_FRAMES):
    """
    Extracts `num_frames` from the video sequentially for maximum speed and memory efficiency.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file.")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        total_frames = 100

    step = max(1, total_frames // num_frames)
    collected_faces = []
    fallback_frames = []

    frame_idx = 0
    # Process sequentially without expensive seeks
    while cap.isOpened() and len(collected_faces) < num_frames and frame_idx < 400:
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        if frame_idx % step == 0:
            # Store center-crop fallback
            h, w = frame.shape[:2]
            min_dim = min(h, w)
            cy, cx = h // 2, w // 2
            center_crop = frame[cy - min_dim // 2: cy + min_dim // 2, cx - min_dim // 2: cx + min_dim // 2]
            if center_crop.size > 0:
                center_resized = cv2.resize(center_crop, (FRAME_SIZE, FRAME_SIZE), interpolation=cv2.INTER_AREA)
                fallback_frames.append(cv2.cvtColor(center_resized, cv2.COLOR_BGR2RGB))

            face = detect_and_crop_face(frame)
            if face is not None:
                collected_faces.append(face)

        frame_idx += 1

    cap.release()

    if len(collected_faces) == 0:
        if len(fallback_frames) > 0:
            collected_faces = fallback_frames
        else:
            raise ValueError("No video frames could be read.")

    while len(collected_faces) < num_frames:
        collected_faces.append(collected_faces[-1])

    collected_faces = collected_faces[:num_frames]
    return np.array(collected_faces, dtype=np.uint8)