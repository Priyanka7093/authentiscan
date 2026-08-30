import {
  ScanLine,
  Info,
  Globe2,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";
import bg from "../assets/authentiscan-bg.png";

const badges = [
  { icon: Globe2, label: "AI-Powered" },
  { icon: ShieldCheck, label: "Secure & Private" },
  { icon: Zap, label: "Lightning Fast" },
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Dark overlay - will not block clicks */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />

      <div className="relative z-10 grid grid-cols-1 items-center gap-10 px-8 py-20 md:grid-cols-2 md:px-16 md:py-28">
        
        {/* Left content */}
        <div>
          <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 text-xs font-medium text-cyan-300">
            AI-Powered. Fast. Accurate. Reliable.
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-5xl">
            Detect Deepfake Videos
            <br />
            with{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AI-Powered Intelligence
            </span>
          </h1>

          <p className="mt-6 max-w-md text-slate-400">
            Authentiscan uses advanced Deep Learning models to analyze videos
            and determine whether the content is{" "}
            <span className="font-semibold text-green-400">REAL</span> or{" "}
            <span className="font-semibold text-red-400">FAKE</span> with high
            accuracy.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 font-semibold shadow-lg shadow-blue-900/40 transition hover:from-blue-500 hover:to-blue-400"
            >
              <ScanLine className="h-5 w-5" />
              Analyze a Video →
            </Link>

            <Link
              to="/about"
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-400"
            >
              <Info className="h-5 w-5" />
              Learn More
            </Link>
          </div>

          {/* Badges */}
          <div className="mt-8 flex flex-wrap gap-3">
            {badges.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
              >
                <Icon className="h-3.5 w-3.5 text-cyan-400" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right side — artwork comes from background */}
        <div className="hidden md:block" />
      </div>
    </section>
  );
}