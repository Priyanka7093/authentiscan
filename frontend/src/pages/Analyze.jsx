import { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileVideo,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Copy,
  RefreshCw,
  History as HistoryIcon,
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
  if (pct >= 85) return { label: "High confidence", color: "text-green-400" };
  if (pct >= 60) return { label: "Moderate confidence", color: "text-yellow-400" };
  return { label: "Low confidence", color: "text-red-400" };
}

export default function Analyze() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | analyzing | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const resetAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setVideoMeta(null);
    setStatus("idle");
    setResult(null);
    setError(null);
    setProcessingTime(null);
  };

  const handleFile = useCallback(
    (selected) => {
      if (!selected) return;
      if (!selected.type.startsWith("video/")) {
        setError("Please select a valid video file.");
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
      setProcessingTime(((performance.now() - start) / 1000).toFixed(1));
      setResult(data);
      setStatus("result");
    } catch (err) {
      setError(err.message || "Unable to connect to the analysis service. Please try again.");
      setStatus("error");
    }
  };

  const handleCopySummary = () => {
    if (!result || !file) return;
    const text = `AuthentiScan classified "${file.name}" as ${result.prediction} with ${(
      result.confidence * 100
    ).toFixed(1)}% confidence.`;
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
        <h1 className="mt-1 text-2xl font-bold">Analyze Video</h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload a video file to analyze and detect potential deepfake content.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Upload panel */}
          <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
            <p className="mb-4 text-sm font-semibold">1. Upload Video</p>

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
                <p className="text-xs text-slate-500">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium hover:border-slate-400"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
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
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-red-400 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            )}

            {status === "idle" && file && (
              <button
                onClick={handleAnalyze}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-semibold shadow-lg shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400"
              >
                Analyze Video
              </button>
            )}

            {status === "analyzing" && (
              <button
                disabled
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600/50 px-5 py-3 text-sm font-semibold text-slate-200"
              >
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </button>
            )}
          </div>

          {/* Preview panel */}
          <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
            <p className="mb-4 text-sm font-semibold">2. Video Preview & Details</p>

            {previewUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  onLoadedMetadata={onLoadedMetadata}
                  className="w-full rounded-xl bg-black"
                />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-4">
                  <div>
                    <p className="text-slate-500">Type</p>
                    <p className="text-slate-200">{file.type || "video"}</p>
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

        {status === "result" && result && (
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
              <p className="mb-4 text-sm font-semibold">3. Analysis Result</p>

              <div className="flex flex-col items-center gap-1 text-center">
                {result.prediction === "REAL" ? (
                  <ShieldCheck className="h-10 w-10 text-green-400" />
                ) : (
                  <ShieldAlert className="h-10 w-10 text-red-400" />
                )}
                <p className="text-xs font-medium tracking-wide text-slate-500">VERDICT</p>
                <p
                  className={`text-3xl font-extrabold ${
                    result.prediction === "REAL" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {result.prediction}
                </p>

                <p className="mt-4 text-xs text-slate-500">Confidence Score</p>
                <p className="text-4xl font-bold">{(result.confidence * 100).toFixed(1)}%</p>
                <p className={`text-xs font-semibold ${confInfo.color}`}>{confInfo.label}</p>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-4 text-xs">
                <p className="mb-2 font-semibold text-slate-300">Summary</p>
                <div className="grid grid-cols-2 gap-y-1 text-slate-400">
                  <p>Video</p>
                  <p className="text-right text-slate-200">{file.name}</p>
                  <p>Fake Probability</p>
                  <p className="text-right text-slate-200">{result.fake_probability.toFixed(3)}</p>
                  <p>Model</p>
                  <p className="text-right text-slate-200">MobileNet + LSTM</p>
                  {processingTime && (
                    <>
                      <p>Processing Time</p>
                      <p className="text-right text-slate-200">{processingTime}s</p>
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
                  {copied ? "Copied!" : "Copy Summary"}
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

            <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
              <p className="mb-4 text-sm font-semibold">Confidence Interpretation</p>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow"
                  style={{ left: `calc(${confidencePct}% - 8px)` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <p className={`mt-4 text-sm font-semibold ${confInfo.color}`}>{confInfo.label}</p>
              <p className="mt-1 text-xs text-slate-500">
                The model reported {confidencePct.toFixed(1)}% confidence in its {result.prediction} prediction.
              </p>
            </div>
          </div>
        )}

        {status === "error" && error && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-red-900/50 bg-red-950/20 p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-400">Failed to analyze video</p>
                <p className="text-xs text-red-300/80">{error}</p>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-1.5 rounded-lg border border-red-800 px-3 py-2 text-xs font-medium text-red-300 hover:border-red-500"
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