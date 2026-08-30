import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { usePredictions } from "../hooks/usePredictions";

export default function PredictionOverview() {
  const { predictions, loading, error } = usePredictions();

  const realCount = predictions.filter((p) => p.prediction === "REAL").length;
  const fakeCount = predictions.filter((p) => p.prediction === "FAKE").length;
  const total = realCount + fakeCount;

  const data = [
    { name: "REAL", value: realCount, color: "#3b82f6" },
    { name: "FAKE", value: fakeCount, color: "#ef4444" },
  ];

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-panel/60" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5 text-sm text-red-400">
        Couldn't load prediction overview: {error}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5 text-sm text-slate-500">
        No predictions yet. Analyze a video to see your overview here.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">Prediction Overview</p>
        <select className="rounded-md border border-slate-700 bg-transparent px-2 py-1 text-xs text-slate-300">
          <option>All Time</option>
        </select>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={2}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-[11px] text-slate-500">Total</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-slate-500">
                  {d.value} ({total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0"}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}