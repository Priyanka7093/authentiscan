import { FileVideo, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { usePredictions } from "../hooks/usePredictions";

function formatDate(iso) {
  const d = new Date(iso);

  return (
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
  );
}

export default function RecentPredictions({ limit = 5 }) {
  const { predictions, loading, error } = usePredictions();

  const recent = [...predictions]
    .sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    )
    .slice(0, limit);

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/10 backdrop-blur-xl" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-950/20 p-5 text-sm text-red-400 shadow-xl shadow-red-950/10 backdrop-blur-xl">
        Couldn't load recent predictions: {error}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative mb-5 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          Recent Predictions
        </p>

        <Link
          to="/predictions"
          className="group flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.025] px-4 py-8 text-center">
          <FileVideo className="mx-auto mb-2 h-6 w-6 text-slate-600" />
          <p className="text-sm text-slate-500">
            No predictions yet.
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-3">
          {recent.map((p) => (
            <div
              key={p.id}
              className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.035] p-3 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.07]"
            >
              {/* File icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/10 ring-1 ring-slate-500/20 transition-colors group-hover:bg-cyan-500/10 group-hover:ring-cyan-400/20">
                <FileVideo className="h-4 w-4 text-slate-300 transition-colors group-hover:text-cyan-400" />
              </div>

              {/* File information */}
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-slate-200">
                  {p.filename}
                </p>

                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {formatDate(p.created_at)}
                </p>
              </div>

              {/* Prediction result */}
              <div className="shrink-0 text-right">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                    p.prediction === "REAL"
                      ? "bg-green-500/10 text-green-400 ring-green-400/20"
                      : "bg-red-500/10 text-red-400 ring-red-400/20"
                  }`}
                >
                  {p.prediction}
                </span>

                <p className="mt-1 text-xs text-slate-500">
                  {(p.confidence * 100).toFixed(1)}% confidence
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}