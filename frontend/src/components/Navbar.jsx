import { ScanFace } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="relative z-20 flex items-center justify-between px-8 py-5 md:px-16">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-cyan-400/40">
          <ScanFace className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-wide">AUTHENTISCAN</p>
          <p className="-mt-1 text-[11px] text-slate-400">
            AI-Powered Video Authenticity Analysis
          </p>
        </div>
      </div>

      <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
        {navLinks.map(({ to, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={
                isActive
                  ? "border-b-2 border-cyan-400 pb-1 text-white"
                  : "hover:text-white"
              }
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        to="/dashboard"
        className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400"
      >
        Get Started →
      </Link>
    </header>
  );
}