import { Video, ShieldCheck, ShieldAlert, Gauge } from "lucide-react";
import { usePredictions } from "../hooks/usePredictions";

const tints = {
  blue: {
    icon: "bg-blue-500/10 text-blue-400 ring-blue-400/20",
    glow: "group-hover:shadow-blue-500/10",
  },
  green: {
    icon: "bg-green-500/10 text-green-400 ring-green-400/20",
    glow: "group-hover:shadow-green-500/10",
  },
  red: {
    icon: "bg-red-500/10 text-red-400 ring-red-400/20",
    glow: "group-hover:shadow-red-500/10",
  },
  indigo: {
    icon: "bg-indigo-500/10 text-indigo-400 ring-indigo-400/20",
    glow: "group-hover:shadow-indigo-500/10",
  },
};

export default function StatCards() {
  const { predictions, loading, error } = usePredictions();

  const total = predictions.length;

  const realCount = predictions.filter(
    (p) => p.prediction === "REAL"
  ).length;

  const fakeCount = predictions.filter(
    (p) => p.prediction === "FAKE"
  ).length;

  const avgConfidence =
    total > 0
      ? (
          (predictions.reduce(
            (sum, p) => sum + p.confidence,
            0
          ) /
            total) *
          100
        ).toFixed(1)
      : "0.0";

  const stats = [
    {
      icon: Video,
      label: "TOTAL SCANS",
      value: total,
      tint: "blue",
    },
    {
      icon: ShieldCheck,
      label: "REAL DETECTED",
      value: realCount,
      tint: "green",
    },
    {
      icon: ShieldAlert,
      label: "FAKE DETECTED",
      value: fakeCount,
      tint: "red",
    },
    {
      icon: Gauge,
      label: "AVG. CONFIDENCE",
      value: `${avgConfidence}%`,
      tint: "indigo",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/10 backdrop-blur-xl"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-950/20 p-5 text-sm text-red-400 shadow-xl shadow-red-950/10 backdrop-blur-xl">
        Couldn't load stats: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, tint }) => (
        <div
          key={label}
          className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07] hover:shadow-2xl ${tints[tint].glow}`}
        >
          {/* Subtle background glow */}
          <div
            className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100 ${
              tint === "blue"
                ? "bg-blue-500/20"
                : tint === "green"
                ? "bg-green-500/20"
                : tint === "red"
                ? "bg-red-500/20"
                : "bg-indigo-500/20"
            }`}
          />

          {/* Icon */}
          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${tints[tint].icon}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Label */}
          <p className="relative mt-4 text-[11px] font-medium tracking-[0.08em] text-slate-500">
            {label}
          </p>

          {/* Value */}
          <p className="relative mt-1 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>

          {/* Bottom glass highlight */}
          <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      ))}
    </div>
  );
}