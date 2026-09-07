import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Database, ExternalLink, RefreshCw, Terminal, Table } from "lucide-react";

export default function DatabaseConsole() {
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:8001").replace(/\/$/, "");
  const h2ConsoleUrl = `${apiBase}/h2-console`;
  const [iframeKey, setIframeKey] = useState(Date.now());

  const refreshConsole = () => {
    setIframeKey(Date.now());
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />

        <main className="flex flex-1 flex-col p-6 overflow-hidden">
          {/* Header section */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <Database className="h-4 w-4 text-emerald-400" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  H2 Database Console
                </h1>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  Live & Connected
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Direct interactive SQL workbench to view tables, execute queries, and inspect detection records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={refreshConsole}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Console
              </button>
              <a
                href={h2ConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500 transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Full Screen Console
              </a>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <Table className="h-4 w-4 text-cyan-400" />
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Target Table</p>
                <p className="text-xs font-bold text-white font-mono">predictions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Default SQL</p>
                <p className="text-xs font-bold text-slate-300 font-mono">SELECT * FROM predictions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <Database className="h-4 w-4 text-indigo-400" />
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Database Engine</p>
                <p className="text-xs font-bold text-slate-300 font-mono">SQLite / Render Storage</p>
              </div>
            </div>
          </div>

          {/* Embedded Interactive Console Frame */}
          <div className="relative flex-1 rounded-xl border border-slate-800 overflow-hidden bg-slate-950 shadow-2xl">
            <iframe
              key={iframeKey}
              src={h2ConsoleUrl}
              title="H2 Database Console"
              className="h-full w-full border-0"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
