import os
import sys
import glob
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "ml-service"))

from video_preprocessing import extract_face_sequence
from main import run_prediction


def evaluate_dataset_metrics():
    """
    Evaluates deepfake model metrics across the benchmark video set.
    Computes Accuracy, Precision, Recall, F1 Score, and Confusion Matrix.
    """
    videos_dir = os.path.join(BASE_DIR, "Videos")
    video_files = sorted(glob.glob(os.path.join(videos_dir, "*.mp4")))

    print(f"===========================================================")
    print(f"AUTHENTISCAN MODEL EVALUATION BENCHMARK ({len(video_files)} Videos)")
    print(f"===========================================================")

    predictions = []
    # Benchmark ground truths (based on test dataset annotations)
    ground_truth = {
        "8084752-uhd_3840_2160_25fps.mp4": "FAKE"
    }

    y_true = []
    y_pred = []

    for vpath in video_files:
        vname = os.path.basename(vpath)
        expected = ground_truth.get(vname, "REAL")
        seq = extract_face_sequence(vpath, num_frames=20)
        res = run_prediction(seq)
        pred = res["prediction"]
        fake_prob = res["fake_probability"]
        conf = res["confidence"]

        y_true.append(1 if expected == "FAKE" else 0)
        y_pred.append(1 if pred == "FAKE" else 0)

        match = "[OK]" if expected == pred else "[X ]"
        print(f"{match} {vname:<35} Expected={expected:<5} Predicted={pred:<5} (Prob={fake_prob:.4f}, Conf={conf*100:.1f}%)")

    # Confusion Matrix:
    # TP: True Fake, FP: False Fake, TN: True Real, FN: False Real
    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
    tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)
    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)

    total = len(y_true)
    accuracy = (tp + tn) / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    print(f"\n==================== EVALUATION METRICS ====================")
    print(f"Total Videos Tested:  {total}")
    print(f"Accuracy:             {accuracy * 100:.2f}%")
    print(f"Precision:            {precision * 100:.2f}%")
    print(f"Recall:               {recall * 100:.2f}%")
    print(f"F1 Score:             {f1 * 100:.2f}%")
    print(f"\nCONFUSION MATRIX:")
    print(f"                 Predicted Real    Predicted Fake")
    print(f"  Actual Real         {tn:<17} {fp:<14}")
    print(f"  Actual Fake         {fn:<17} {tp:<14}")
    print(f"============================================================")

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "confusion_matrix": {"tp": tp, "tn": tn, "fp": fp, "fn": fn}
    }


if __name__ == "__main__":
    evaluate_dataset_metrics()
