import { Video, FileText, ChevronRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  { to: "/analyze", icon: Video, title: "Analyze New Video", sub: "Upload a video and get AI analysis", tint: "bg-blue-500" },
  { to: "/history", icon: FileText, title: "View Prediction History", sub: "See all your previous predictions", tint: "bg-indigo-500" },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-panel/60 p-5">
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Zap className="h-4 w-4 text-cyan-400" />
        Quick Actions
      </p>
      <div className="flex flex-col gap-3">
        {actions.map(({ to, icon: Icon, title, sub, tint }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-white/5 p-3 hover:border-slate-600"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}