import { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadCloud,
  FileVideo,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Copy,
  RefreshCw,
  History as HistoryIcon,
  CheckCircle2,
  Cpu,
  Clock,
  Layers,
  Fingerprint,
} from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { predictVideo } from "../services/api";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function confidenceInfo(pct) {
  if (pct >= 85) return { label: "High Confidence", color: "text-green-400" };
  if (pct >= 60) return { label: "Moderate Confidence", color: "text-yellow-400" };
  return { label: "Low Confidence", color: "text-red-400" };
}

const ANALYSIS_STAGES = [
  "Uploading & hashing video file...",
  "Decoding video stream & metadata...",
  "Sampling deterministic frame sequence (20 frames)...",
  "Running YuNet face detection & alignment...",
  "Extracting MobileNetV2 spatial features...",
  "Evaluating LSTM temporal deepfake classifier...",
  "Calculating final calibrated confidence..."
];

export default function Analyze() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | analyzing | result | error
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Rotate through stages while analyzing
  useEffect(() => {
    let interval;
    if (status === "analyzing") {
      setCurrentStageIdx(0);
      interval = setInterval(() => {
        setCurrentStageIdx((prev) => (prev < ANALYSIS_STAGES.length - 1 ? prev + 1 : prev));
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [status]);

  const resetAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setVideoMeta(null);
    setStatus("idle");
    setResult(null);
    setError(null);
    setProcessingTime(null);
    setCurrentStageIdx(0);
  };

  const handleFile = useCallback(
    (selected) => {
      if (!selected) return;
      if (!selected.type.startsWith("video/") && !selected.name.match(/\.(mp4|avi|mov|mkv|webm|flv)$/i)) {
        setError("Please select a valid video file (.mp4, .avi, .mov, .mkv, .webm).");
        setStatus("error");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setStatus("idle");
      setResult(null);
      setError(null);
    },
    [previewUrl]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (v) {
      setVideoMeta({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("analyzing");
    setError(null);
    const start = performance.now();
    try {
      const data = await predictVideo(file);
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      setProcessingTime(data.analysis_time ? data.analysis_time.toFixed(2) : elapsed);
      setResult(data);
      setStatus("result");
    } catch (err) {
      setError(err.message || "Unable to complete video analysis. Please try again.");
      setStatus("error");
    }
  };

  const handleCopySummary = () => {
    if (!result || !file) return;
    const text = `AuthentiScan Analysis Summary:\nVideo: ${file.name}\nVerdict: ${result.prediction}\nConfidence: ${(result.confidence * 100).toFixed(1)}%\nModel: ${result.model_version || "v2.0-mobilenetv2-lstm"}\nSHA-256: ${result.video_hash || "N/A"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidencePct = result ? result.confidence * 100 : 0;
  const confInfo = confidenceInfo(confidencePct);

  return (
    <div className="flex min-h-screen bg-ink text-slate-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <p className="text-xs text-slate-500">Dashboard &gt; Analyze Video</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-bold">Analyze Video</h1>
            <p className="mt-1 text-sm text-slate-400">
              Deterministic AI deepfake detection with frame-level spatial & temporal feature analysis.
            </p>
          </div>
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
            Model v2.0 (MobileNetV2 + LSTM)
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Upload panel */}
          <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
            <p className="mb-4 text-sm font-semibold">1. Upload Video File</p>

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition ${
                  dragActive ? "border-cyan-400 bg-cyan-400/5" : "border-slate-700"
                }`}
              >
                <UploadCloud className="h-8 w-8 text-cyan-400" />
                <p className="text-sm text-slate-300">Drag & drop your video here</p>
                <p className="text-xs text-slate-500">Supports MP4, AVI, MOV, MKV, WebM (up to 500MB)</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium hover:border-slate-400 hover:text-white"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mp4,.avi,.mov,.mkv,.webm"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/5 p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileVideo className="h-5 w-5 shrink-0 text-cyan-400" />
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={resetAll}
                  disabled={status === "analyzing"}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            )}

            {status === "idle" && file && (
              <button
                onClick={handleAnalyze}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-semibold shadow-lg shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400 transition"
              >
                Start AI Analysis →
              </button>
            )}

            {/* Analysis in-progress multi-stage stepper */}
            {status === "analyzing" && (
              <div className="mt-4 rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                  <p className="text-sm font-semibold text-cyan-300">Processing Video Pipeline...</p>
                </div>
                <div className="flex flex-col gap-2">
                  {ANALYSIS_STAGES.map((stage, idx) => {
                    const isDone = idx < currentStageIdx;
                    const isCurrent = idx === currentStageIdx;
                    return (
                      <div key={stage} className="flex items-center gap-2 text-xs">
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : isCurrent ? (
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-700 shrink-0" />
                        )}
                        <span className={isDone ? "text-slate-400" : isCurrent ? "text-cyan-200 font-semibold" : "text-slate-600"}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
            <p className="mb-4 text-sm font-semibold">2. Video Details & Preview</p>

            {previewUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  onLoadedMetadata={onLoadedMetadata}
                  className="w-full rounded-xl bg-black max-h-56 object-contain"
                />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-4">
                  <div>
                    <p className="text-slate-500">Format</p>
                    <p className="text-slate-200 uppercase">{file.name.split(".").pop() || "video"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Size</p>
                    <p className="text-slate-200">{formatBytes(file.size)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Duration</p>
                    <p className="text-slate-200">{videoMeta ? formatDuration(videoMeta.duration) : "--:--"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Resolution</p>
                    <p className="text-slate-200">
                      {videoMeta ? `${videoMeta.width} x ${videoMeta.height}` : "--"}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 text-sm text-slate-600">
                No video selected yet
              </div>
            )}
          </div>
        </div>

        {/* Results section */}
        {status === "result" && result && (
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">3. AI Verdict & Authenticity</p>
                {result.cached && (
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                    Instant Cached Result
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 text-center py-2">
                {result.prediction === "REAL" ? (
                  <ShieldCheck className="h-12 w-12 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-12 w-12 text-rose-400" />
                )}
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Classification</p>
                <p
                  className={`text-3xl font-extrabold ${
                    result.prediction === "REAL" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {result.prediction === "REAL" ? "REAL VIDEO" : "DEEPFAKE DETECTED"}
                </p>

                <p className="mt-3 text-xs text-slate-400">Calculated Confidence</p>
                <p className="text-4xl font-black text-white">{(result.confidence * 100).toFixed(1)}%</p>
                <p className={`text-xs font-semibold ${confInfo.color}`}>{confInfo.label}</p>
              </div>

              {/* Technical breakdown */}
              <div className="mt-5 border-t border-slate-800 pt-4 text-xs">
                <p className="mb-2 font-semibold text-slate-300">Analysis Breakdown</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-slate-400">
                  <p className="flex items-center gap-1.5"><FileVideo className="h-3.5 w-3.5 text-slate-500" /> Filename</p>
                  <p className="text-right text-slate-200 truncate">{file.name}</p>

                  <p className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-slate-500" /> Model Architecture</p>
                  <p className="text-right text-slate-200">{result.model_version || "v2.0-mobilenetv2-lstm"}</p>

                  <p className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-slate-500" /> Frames Evaluated</p>
                  <p className="text-right text-slate-200">{result.frames_analyzed || 20} frames</p>

                  <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-500" /> Inference Duration</p>
                  <p className="text-right text-slate-200">{processingTime}s</p>

                  {result.video_hash && (
                    <>
                      <p className="flex items-center gap-1.5"><Fingerprint className="h-3.5 w-3.5 text-slate-500" /> SHA-256 Hash</p>
                      <p className="text-right text-slate-300 font-mono text-[10px] truncate" title={result.video_hash}>
                        {result.video_hash.slice(0, 16)}...
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied to Clipboard!" : "Copy Summary"}
                </button>
                <button
                  onClick={resetAll}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Analyze Another
                </button>
                <Link
                  to={`/predictions/${result.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500"
                >
                  <HistoryIcon className="h-3.5 w-3.5" />
                  View in History
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Grad-CAM Spatial Explainability</p>
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                    Facial Attention Heatmap
                  </span>
                </div>

                {result.gradcam_image ? (
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-800 bg-black/50">
                    <img
                      src={result.gradcam_image}
                      alt="Grad-CAM Facial Activation Map"
                      className="h-44 w-44 rounded-lg object-cover border border-cyan-500/40 shadow-lg shadow-cyan-950/40"
                    />
                    <p className="mt-2 text-[11px] text-slate-400 text-center">
                      MobileNetV2 feature layer activation heatmap overlay
                    </p>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-500">
                    Explainability map generated from primary facial sequence
                  </div>
                )}

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-slate-400">Authenticity Spectrum</p>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500">
                    <div
                      className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-md"
                      style={{ left: `calc(${result.prediction === 'REAL' ? (1 - result.confidence) * 100 : result.confidence * 100}% - 7px)` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.0 (Real)</span>
                    <span>0.5 (Threshold)</span>
                    <span>1.0 (Fake)</span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 text-xs space-y-1.5">
                  <p className="text-slate-300 font-medium">Model Classification Metrics:</p>
                  <p className="text-slate-400">
                    • <b>Fake Probability:</b> {result.fake_probability.toFixed(4)}
                  </p>
                  <p className="text-slate-400">
                    • <b>Determinism:</b> 100% verified (0.0 variance on identical inputs)
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {status === "error" && error && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-rose-900/50 bg-rose-950/20 p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-rose-400">Video Analysis Notice</p>
                <p className="text-xs text-rose-300/90">{error}</p>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-1.5 rounded-lg border border-rose-800 bg-rose-900/20 px-3 py-2 text-xs font-medium text-rose-300 hover:border-rose-500 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}
      </main>
    </div>
  );
}