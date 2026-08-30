import { Video, ShieldCheck, Zap, Users } from "lucide-react";

const stats = [
  {
    icon: Video,
    value: "1,248+",
    label: "Videos Analyzed",
    sub: "Across all users",
  },
  {
    icon: ShieldCheck,
    value: "90.5%",
    label: "Detection Accuracy",
    sub: "Validated performance",
  },
  {
    icon: Zap,
    value: "20 sec",
    label: "Average Analysis Time",
    sub: "Per video",
  },
  {
    icon: Users,
    value: "500+",
    label: "Trusted Users",
    sub: "And growing",
  },
];

export default function StatsBar() {
  return (
    <div className="relative z-10 -mt-10 px-8 md:px-16">
      <div className="grid grid-cols-2 gap-6 rounded-2xl border border-slate-800 bg-panel/60 p-8 backdrop-blur md:grid-cols-4">
        {stats.map(({ icon: Icon, value, label, sub }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/20">
              <Icon className="h-5 w-5 text-cyan-400" />
            </div>

            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-sm font-medium text-slate-200">{label}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}