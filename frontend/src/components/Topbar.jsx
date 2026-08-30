import { Bell, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

export default function Topbar() {
  const [now, setNow] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const date = now.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const time = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <header className="flex items-center justify-between">
      {/* Welcome text */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Welcome back! 👋
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Here's what's happening with your video analysis.
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-slate-300" />

          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-cyan-400 shadow shadow-cyan-400/50" />
        </button>

        {/* Date and time */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs shadow-lg shadow-black/10 backdrop-blur-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Calendar className="h-4 w-4 text-cyan-400" />
          </div>

          <div className="leading-tight">
            <p className="font-medium text-slate-200">{date}</p>
            <p className="mt-0.5 text-slate-500">{time}</p>
          </div>
        </div>
      </div>
    </header>
  );
}