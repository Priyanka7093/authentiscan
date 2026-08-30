import { useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import Sidebar from "../components/Sidebar";
import { usePredictions } from "../hooks/usePredictions";

function fileExt(name = "") {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "UNKNOWN";
}

export default function Analytics() {
  const { predictions, loading, error } = usePredictions();

  const realFakeData = useMemo(() => {
    const real = predictions.filter((p) => p.prediction === "REAL").length;
    const fake = predictions.filter((p) => p.prediction === "FAKE").length;
    return [
      { name: "REAL", value: real, color: "#4ade80" },
      { name: "FAKE", value: fake, color: "#f87171" },
    ];
  }, [predictions]);

  const confidenceBuckets = useMemo(() => {
    const buckets = [
      { range: "50-60%", min: 0.5, max: 0.6, count: 0 },
      { range: "60-70%", min: 0.6, max: 0.7, count: 0 },
      { range: "70-80%", min: 0.7, max: 0.8, count: 0 },
      { range: "80-90%", min: 0.8, max: 0.9, count: 0 },
      { range: "90-100%", min: 0.9, max: 1.01, count: 0 },
    ];
    predictions.forEach((p) => {
      const b = buckets.find((b) => p.confidence >= b.min && p.confidence < b.max);
      if (b) b.count += 1;
    });
    return buckets;
  }, [predictions]);

  const fileTypeData = useMemo(() => {
    const counts = {};
    predictions.forEach((p) => {
      const ext = fileExt(p.filename);
      counts[ext] = (counts[ext] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [predictions]);

  const overTimeData = useMemo(() => {
    const counts = {};
    predictions.forEach((p) => {
      const d = new Date(p.created_at);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [predictions]);

  const pieColors = ["#60a5fa", "#a78bfa", "#f472b6", "#fbbf24", "#4ade80"];

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex-1 p-8">
        <p className="text-xl font-bold">Analytics</p>
        <p className="text-sm text-slate-400">Trends and breakdowns from your prediction history.</p>

        {loading && <p className="mt-6 text-sm text-slate-500">Loading analytics…</p>}
        {error && <p className="mt-6 text-sm text-red-400">Couldn't load analytics. {error}</p>}
        {!loading && !error && predictions.length === 0 && (
          <p className="mt-6 text-sm text-slate-500">
            No predictions yet — analyze a few videos and this page will populate.
          </p>
        )}

        {!loading && !error && predictions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
              <p className="mb-4 text-sm font-semibold">Real vs fake distribution</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={realFakeData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {realFakeData.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0B1526", border: "1px solid #1e293b", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
              <p className="mb-4 text-sm font-semibold">Confidence score distribution</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={confidenceBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0B1526", border: "1px solid #1e293b", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
              <p className="mb-4 text-sm font-semibold">File type breakdown</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={fileTypeData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {fileTypeData.map((d, i) => (
                      <Cell key={d.name} fill={pieColors[i % pieColors.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0B1526", border: "1px solid #1e293b", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
              <p className="mb-4 text-sm font-semibold">Predictions over time</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={overTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0B1526", border: "1px solid #1e293b", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}