import {
  UserRound,
  Building2,
  GraduationCap,
  Users2,
} from "lucide-react";

const groups = [
  { icon: UserRound, label: "Researchers" },
  { icon: Building2, label: "Enterprises" },
  { icon: GraduationCap, label: "Educational Institutes" },
  { icon: Users2, label: "Individuals" },
];

export default function TrustStrip() {
  return (
    <div className="px-8 py-14 md:px-16">
      <p className="text-center text-sm text-slate-500">
        Trusted by researchers, organizations and individuals
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
        {groups.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-2 text-sm text-slate-400"
          >
            <Icon className="h-4 w-4" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}