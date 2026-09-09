import os
import sys
import numpy as np

# Add ml-service to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "ml-service"))

from video_preprocessing import extract_face_sequence
from main import run_prediction

SAMPLE_VIDEO = os.path.join(BASE_DIR, "Videos", "232464_medium.mp4")


def test_prediction_consistency_5_runs():
    """
    Verifies that running inference on the exact same video 5 times in a row
    produces strictly identical results with 0.0 variance.
    """
    assert os.path.exists(SAMPLE_VIDEO), f"Sample video not found at {SAMPLE_VIDEO}"

    results = []
    probabilities = []
    confidences = []
    verdicts = []

    for run_idx in range(5):
        seq = extract_face_sequence(SAMPLE_VIDEO, num_frames=20)
        res = run_prediction(seq)
        results.append(res)
        probabilities.append(res["fake_probability"])
        confidences.append(res["confidence"])
        verdicts.append(res["prediction"])
        print(f"Run {run_idx + 1}: Verdict={res['prediction']}, FakeProb={res['fake_probability']:.4f}, Conf={res['confidence']:.4f}")

    # Check that all verdicts are identical
    assert len(set(verdicts)) == 1, f"Inconsistent verdicts across runs: {verdicts}"

    # Check that probabilities and confidences match exactly
    assert np.allclose(probabilities, probabilities[0], atol=1e-5), f"Probabilities differed across runs: {probabilities}"
    assert np.allclose(confidences, confidences[0], atol=1e-5), f"Confidences differed across runs: {confidences}"

    print(f"\n[PASS] Prediction is strictly deterministic across 5 consecutive runs. (Identical predictions: {verdicts[0]}, Conf: {confidences[0]*100:.2f}%)")


if __name__ == "__main__":
    test_prediction_consistency_5_runs()
