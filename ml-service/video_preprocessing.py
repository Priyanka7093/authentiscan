import cv2
import numpy as np

FACE_DETECTOR_PATH = "face_detection_yunet_2023mar.onnx"
NUM_FRAMES = 20
FRAME_SIZE = 224

# Load the face detector once at import time
face_detector = cv2.FaceDetectorYN_create(
    FACE_DETECTOR_PATH,
    "",
    (320, 320),  # initial input size, gets resized per-frame below
    score_threshold=0.6
)

def detect_and_crop_face(frame):
    """
    frame: raw BGR frame from OpenCV (H, W, 3)
    Returns: cropped+resized face (224, 224, 3) RGB, or None if no face detected
    """
    h, w = frame.shape[:2]
    face_detector.setInputSize((w, h))
    _, faces = face_detector.detect(frame)

    if faces is None or len(faces) == 0:
        return None

    # Take the highest-confidence face (first result, YuNet sorts by confidence)
    x, y, box_w, box_h = faces[0][:4].astype(int)
    x, y = max(0, x), max(0, y)
    face_crop = frame[y:y+box_h, x:x+box_w]

    if face_crop.size == 0:
        return None

    face_resized = cv2.resize(face_crop, (FRAME_SIZE, FRAME_SIZE))
    face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
    return face_rgb

def extract_face_sequence(video_path, num_frames=NUM_FRAMES):
    """
    Extracts `num_frames` evenly-spaced frames from the video,
    detects+crops the face in each, and returns a (num_frames, 224, 224, 3) uint8 array.
    Raises ValueError if not enough valid faces are found.
    """
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames <= 0:
        cap.release()
        raise ValueError("Could not read video or video has no frames.")

    frame_indices = np.linspace(0, total_frames - 1, num_frames).astype(int)
    collected_faces = []

    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            continue
        face = detect_and_crop_face(frame)
        if face is not None:
            collected_faces.append(face)

    cap.release()

    if len(collected_faces) == 0:
        raise ValueError("No faces detected in video.")

    # If we got fewer than num_frames valid faces, pad by repeating the last one
    while len(collected_faces) < num_frames:
        collected_faces.append(collected_faces[-1])

    # If somehow more (shouldn't happen given loop), trim
    collected_faces = collected_faces[:num_frames]

    return np.array(collected_faces, dtype=np.uint8)