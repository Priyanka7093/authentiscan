import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCards from "../components/StatCards";
import PredictionOverview from "../components/PredictionOverview";
import QuickActions from "../components/QuickActions";
import RecentPredictions from "../components/RecentPredictions";

export default function Dashboard() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#050816] text-slate-100">
      {/* Dashboard background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute right-[-120px] top-[120px] h-[420px] w-[420px] rounded-full bg-blue-600/15 blur-[100px]" />
        <div className="absolute bottom-[-100px] left-[-100px] h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-[90px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "55px 55px",
            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8">
          <Topbar />

          <div className="mt-6">
            <StatCards />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <RecentPredictions />
            </div>

            <div className="flex flex-col gap-6">
              <PredictionOverview />
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}