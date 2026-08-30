import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileVideo, ShieldCheck, ShieldAlert } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { usePrediction } from "../hooks/usePredictions";

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) +
    " at " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function PredictionDetail() {
  const { id } = useParams();
  const { prediction, loading, error } = usePrediction(id);

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex-1 p-8">
        <Link to="/predictions" className="flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" />
          Back to Prediction History
        </Link>

        {loading && <p className="mt-6 text-sm text-slate-500">Loading prediction…</p>}
        {error && <p className="mt-6 text-sm text-red-400">Couldn't load this prediction. {error}</p>}

        {!loading && !error && prediction && (
          <div className="mt-6 max-w-2xl rounded-2xl border border-slate-800 bg-panel/60 p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 ring-1 ring-slate-700">
                <FileVideo className="h-6 w-6 text-slate-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-100">{prediction.filename}</p>
                <p className="text-xs text-slate-500">Prediction #{prediction.id}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500">RESULT</p>
                <span
                  className={`mt-2 flex w-fit items-center gap-1.5 rounded-md px-3 py-1 text-sm font-semibold ${
                    prediction.prediction === "REAL"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {prediction.prediction === "REAL" ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <ShieldAlert className="h-4 w-4" />
                  )}
                  {prediction.prediction}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500">CONFIDENCE</p>
                <p className="mt-2 text-2xl font-bold">{(prediction.confidence * 100).toFixed(1)}%</p>
              </div>

              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500">FAKE PROBABILITY</p>
                <p className="mt-2 text-2xl font-bold">{(prediction.fake_probability * 100).toFixed(1)}%</p>
              </div>

              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500">ANALYZED AT</p>
                <p className="mt-2 text-sm text-slate-300">{formatDate(prediction.created_at)}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-6">
              <p className="text-xs font-medium tracking-wide text-slate-500">CONFIDENCE BREAKDOWN</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-2 ${prediction.prediction === "REAL" ? "bg-green-400" : "bg-red-400"}`}
                  style={{ width: `${prediction.confidence * 100}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}