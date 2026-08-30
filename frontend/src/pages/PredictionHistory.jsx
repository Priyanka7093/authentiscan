import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, SlidersHorizontal, Calendar, Video, ShieldCheck, ShieldAlert,
  TrendingUp, FileVideo, Eye, MoreVertical, X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { usePredictions } from "../hooks/usePredictions";

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function fileExt(name = "") {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "—";
}

export default function PredictionHistory() {
  const { predictions, loading, error } = usePredictions();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minConfidence, setMinConfidence] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const now = new Date();

  const activeFilterCount =
    (minConfidence > 0 ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const clearFilters = () => {
    setMinConfidence(0);
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const filtered = useMemo(() => {
    let rows = predictions || [];
    if (tab !== "all") rows = rows.filter((r) => r.prediction?.toLowerCase() === tab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((r) => r.filename?.toLowerCase().includes(q));
    }
    if (minConfidence > 0) {
      rows = rows.filter((r) => (r.confidence || 0) * 100 >= minConfidence);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      rows = rows.filter((r) => new Date(r.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      rows = rows.filter((r) => new Date(r.created_at) <= to);
    }
    rows = [...rows].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return rows;
  }, [predictions, tab, query, sort, minConfidence, dateFrom, dateTo]);

  const total = predictions?.length || 0;
  const realCount = predictions?.filter((p) => p.prediction === "REAL").length || 0;
  const fakeCount = predictions?.filter((p) => p.prediction === "FAKE").length || 0;
  const avgConfidence = total
    ? (predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / total) * 100
    : 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = [
    { icon: Video, label: "TOTAL ANALYZED", value: `${total}`, sub: "videos", tint: "blue" },
    { icon: ShieldCheck, label: "REAL VIDEOS", value: `${realCount}`, sub: total ? `${((realCount / total) * 100).toFixed(1)}%` : "—", tint: "green" },
    { icon: ShieldAlert, label: "FAKE VIDEOS", value: `${fakeCount}`, sub: total ? `${((fakeCount / total) * 100).toFixed(1)}%` : "—", tint: "red" },
    { icon: TrendingUp, label: "AVG. CONFIDENCE", value: `${avgConfidence.toFixed(1)}%`, sub: null, tint: "indigo" },
  ];
  const tints = {
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    green: "bg-green-500/10 text-green-400 ring-green-500/20",
    red: "bg-red-500/10 text-red-400 ring-red-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
  };

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-bold">Prediction History</p>
            <p className="text-sm text-slate-400">View and manage all your video analysis history.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-white/5 px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search videos..."
                className="w-40 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  activeFilterCount > 0
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                    : "border-slate-700/70 bg-white/5 text-slate-300"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-bold text-ink">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {filtersOpen && (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-800 bg-panel p-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-200">Filters</p>
                    <button onClick={() => setFiltersOpen(false)} className="text-slate-500 hover:text-slate-300">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs text-slate-400">
                      Minimum confidence: {minConfidence}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={minConfidence}
                      onChange={(e) => { setMinConfidence(Number(e.target.value)); setPage(1); }}
                      className="mt-2 w-full"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="text-xs text-slate-400">Date range</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                        className="w-full rounded-md border border-slate-700 bg-transparent px-2 py-1.5 text-xs text-slate-300"
                      />
                      <span className="text-slate-600">to</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                        className="w-full rounded-md border border-slate-700 bg-transparent px-2 py-1.5 text-xs text-slate-300"
                      />
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 w-full rounded-lg border border-slate-700 py-1.5 text-xs text-slate-300 hover:border-slate-500"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-white/5 px-4 py-2 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5" />
              <div>
                <p>{now.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
                <p className="text-slate-500">{now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, sub, tint }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${tints[tint]}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-[11px] font-medium tracking-wide text-slate-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
              {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-panel/60 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-white/5 p-1">
              {["all", "real", "fake"].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setPage(1); }}
                  className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize ${
                    tab === t ? "bg-blue-500/20 text-blue-300" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-md border border-slate-700 bg-transparent px-3 py-1.5 text-xs text-slate-300"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {loading && <p className="mt-6 text-sm text-slate-500">Loading predictions…</p>}
          {error && <p className="mt-6 text-sm text-red-400">Couldn't load prediction history. {String(error)}</p>}

          {!loading && !error && (
            <>
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="pb-3 font-medium">Video</th>
                    <th className="pb-3 font-medium">Result</th>
                    <th className="pb-3 font-medium">Confidence</th>
                    <th className="pb-3 font-medium">Analyzed At</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => {
                    const confPct = (r.confidence || 0) * 100;
                    const isReal = r.prediction === "REAL";
                    return (
                      <tr key={r.id} className="border-t border-slate-800/80 text-slate-300">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-slate-700">
                              <FileVideo className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-slate-200">{r.filename}</p>
                              <p className="text-xs text-slate-500">{fileExt(r.filename)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                            isReal ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {isReal ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                            {r.prediction}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-slate-800">
                              <div
                                className={`h-1.5 rounded-full ${isReal ? "bg-green-400" : "bg-red-400"}`}
                                style={{ width: `${confPct}%` }}
                              />
                            </div>
                            <span className="text-xs">{confPct.toFixed(1)}%</span>
                            {confPct < 80 && (
                              <span className="text-[11px] text-amber-400">Moderate</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-xs text-slate-500">{formatDate(r.created_at)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Link to={`/predictions/${r.id}`} className="flex items-center gap-1 text-xs font-medium text-blue-400">
                              <Eye className="h-3.5 w-3.5" />
                              View Details
                            </Link>
                            <MoreVertical className="h-4 w-4 text-slate-600" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                        No predictions match this filter yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <p>
                  Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}
                  {" "}to {Math.min(page * pageSize, filtered.length)} of {filtered.length} results
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-md border border-slate-700 px-2 py-1 disabled:opacity-30"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`h-7 w-7 rounded-md ${p === page ? "bg-blue-500/20 text-blue-300" : "hover:bg-white/5"}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-md border border-slate-700 px-2 py-1 disabled:opacity-30"
                    >
                      ›
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                      className="rounded-md border border-slate-700 bg-transparent px-2 py-1"
                    >
                      {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}