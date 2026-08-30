import { useMemo, useState } from "react";
import { Download, FileText, FileSpreadsheet, ShieldCheck, ShieldAlert } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Sidebar from "../components/Sidebar";
import { usePredictions } from "../hooks/usePredictions";

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function ExportReport() {
  const { predictions, loading, error } = usePredictions();
  const [tab, setTab] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let rows = predictions || [];
    if (tab !== "all") rows = rows.filter((r) => r.prediction?.toLowerCase() === tab);
    if (dateFrom) {
      const from = new Date(dateFrom);
      rows = rows.filter((r) => new Date(r.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      rows = rows.filter((r) => new Date(r.created_at) <= to);
    }
    return [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [predictions, tab, dateFrom, dateTo]);

  const handleExportCSV = () => {
    const header = ["ID", "Filename", "Prediction", "Confidence (%)", "Fake Probability (%)", "Analyzed At"];
    const rows = filtered.map((r) => [
      r.id,
      `"${(r.filename || "").replace(/"/g, '""')}"`,
      r.prediction,
      (r.confidence * 100).toFixed(2),
      (r.fake_probability * 100).toFixed(2),
      r.created_at,
    ]);
    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `authentiscan-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("AuthentiScan — Prediction Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated ${new Date().toLocaleString()} · ${filtered.length} record(s)`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [["ID", "Filename", "Result", "Confidence", "Fake Prob.", "Analyzed At"]],
      body: filtered.map((r) => [
        r.id,
        r.filename,
        r.prediction,
        `${(r.confidence * 100).toFixed(1)}%`,
        `${(r.fake_probability * 100).toFixed(1)}%`,
        formatDate(r.created_at),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`authentiscan-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const realCount = filtered.filter((r) => r.prediction === "REAL").length;
  const fakeCount = filtered.filter((r) => r.prediction === "FAKE").length;

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex-1 p-8">
        <p className="text-xl font-bold">Export Report</p>
        <p className="text-sm text-slate-400">Download your prediction history as CSV or PDF.</p>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-panel/60 p-5">
          <p className="mb-4 text-sm font-semibold">Filters</p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-white/5 p-1">
              {["all", "real", "fake"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize ${
                    tab === t ? "bg-blue-500/20 text-blue-300" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-slate-700 bg-transparent px-3 py-1.5 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-slate-700 bg-transparent px-3 py-1.5 text-sm text-slate-200"
              />
            </div>
            {(tab !== "all" || dateFrom || dateTo) && (
              <button
                onClick={() => { setTab("all"); setDateFrom(""); setDateTo(""); }}
                className="text-xs text-slate-500 underline hover:text-slate-300"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-800 pt-5 text-sm text-slate-400">
            <span>{filtered.length} record(s) match</span>
            <span className="flex items-center gap-1 text-green-400"><ShieldCheck className="h-3.5 w-3.5" />{realCount} real</span>
            <span className="flex items-center gap-1 text-red-400"><ShieldAlert className="h-3.5 w-3.5" />{fakeCount} fake</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-400 disabled:opacity-40"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-panel/60 p-5">
          <p className="mb-4 text-sm font-semibold">Preview</p>

          {loading && <p className="text-sm text-slate-500">Loading predictions…</p>}
          {error && <p className="text-sm text-red-400">Couldn't load predictions. {error}</p>}

          {!loading && !error && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="pb-3 font-medium">Filename</th>
                  <th className="pb-3 font-medium">Result</th>
                  <th className="pb-3 font-medium">Confidence</th>
                  <th className="pb-3 font-medium">Analyzed At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-t border-slate-800/80 text-slate-300">
                    <td className="py-2.5">{r.filename}</td>
                    <td className="py-2.5">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        r.prediction === "REAL" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {r.prediction}
                      </span>
                    </td>
                    <td className="py-2.5">{(r.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                      No predictions match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {filtered.length > 8 && (
            <p className="mt-3 text-xs text-slate-500">
              Showing 8 of {filtered.length} — the full set is included in the export.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}