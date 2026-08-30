import {
  ScanFace,
  LayoutDashboard,
  Video,
  FileText,
  BarChart3,
  Download,
  ArrowLeft,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/analyze", icon: Video, label: "Analyze Video" },
  { to: "/predictions", icon: FileText, label: "Prediction History" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/export", icon: Download, label: "Export Report" },
];

export default function Sidebar() {
  return (
    <aside className="relative flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-slate-900/70 px-4 py-6 shadow-2xl backdrop-blur-2xl">
      {/* Subtle glass glow */}
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Logo */}
      <div className="relative mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 shadow-lg shadow-cyan-950/30">
          <ScanFace className="h-5 w-5 text-cyan-400" />
        </div>

        <div>
          <p className="text-sm font-bold tracking-wide text-white">
            AUTHENTISCAN
          </p>

          <p className="-mt-0.5 text-[10px] text-slate-400">
            AI Authenticity Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex flex-1 flex-col gap-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "border-blue-400/15 bg-blue-500/15 text-blue-300 shadow-lg shadow-blue-950/20 backdrop-blur-md"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator */}
                <span
                  className={`absolute left-0 h-5 w-0.5 rounded-r-full bg-cyan-400 transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />

                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />

                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Back to Home */}
      <NavLink
        to="/"
        className="relative flex items-center gap-2 rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </NavLink>
    </aside>
  );
}
