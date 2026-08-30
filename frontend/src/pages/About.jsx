import { Link } from "react-router-dom";
import {
  ScanFace,
  Cpu,
  Brain,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  Sparkles,
  MessageSquare,
  LineChart,
  History,
  ArrowRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import bg from "../assets/authentiscan-bg.png";

const techCards = [
  { label: "MobileNet", desc: "Spatial feature extraction" },
  { label: "LSTM", desc: "Temporal sequence analysis" },
  { label: "TensorFlow / Keras", desc: "Model development and inference" },
  { label: "FastAPI", desc: "Microservice backend" },
];

const architectureCards = [
  { label: "React Frontend", desc: "The interface you're using right now" },
  { label: "API Gateway", desc: "Single entry point the frontend talks to" },
  { label: "History Service", desc: "Stores and serves past predictions" },
  { label: "ML Inference Service", desc: "Runs the model and returns a verdict" },
];

const resultCards = [
  {
    icon: ShieldCheck,
    label: "REAL",
    desc: "The model predicts the video is likely authentic.",
    color: "green",
  },
  {
    icon: ShieldAlert,
    label: "FAKE",
    desc: "The model predicts the video is likely manipulated.",
    color: "red",
  },
  {
    icon: Gauge,
    label: "Confidence",
    desc: "How strongly the model supports its prediction.",
    color: "amber",
  },
];

const resultColors = {
  green: "bg-green-500/10 text-green-400 ring-green-500/20",
  red: "bg-red-500/10 text-red-400 ring-red-500/20",
  amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
};

const differentiators = [
  { icon: Sparkles, title: "Simple", desc: "Upload a video and get an easy-to-understand result." },
  { icon: MessageSquare, title: "Explainable", desc: "Prediction information is presented in plain terms." },
  { icon: LineChart, title: "Visual", desc: "Clear confidence bars and analysis breakdowns." },
  { icon: History, title: "Trackable", desc: "Every past prediction stays available in your history." },
];

const stats = [
  { label: "Validation accuracy", value: "90.53%" },
  { label: "Validation AUC", value: "0.9444" },
  { label: "Model parameters", value: "2.98M" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-ink text-white">
      <Navbar />

      {/* HERO */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/90 to-ink" />

        <div className="relative z-10 mx-auto max-w-3xl px-8 py-20 text-center md:px-16">
          <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 text-xs font-medium text-cyan-300">
            About the project
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
            See beyond what your{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              eyes can see
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400">
            Authentiscan is an AI-powered video authenticity platform designed
            to analyze videos and identify potential deepfake manipulation.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              to="/analyze"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400"
            >
              Analyze a Video
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* EDITORIAL: WHAT IS AUTHENTISCAN */}
      <section className="px-8 py-24 md:px-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium tracking-wide text-cyan-400">WHAT IS AUTHENTISCAN?</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">
              A hybrid deep learning approach to spotting manipulated video.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-slate-400">
            Authentiscan analyzes video content by examining both individual
            visual information within a frame and how that information changes
            across consecutive frames — combining what a single moment looks
            like with how it behaves over time to determine whether a video is
            likely to be authentic or manipulated.
          </p>
        </div>
      </section>

      {/* EDITORIAL: SPATIAL / TEMPORAL / PREDICTION — alternating panels, no flow diagram */}
      <section className="px-8 py-10 md:px-16">
        <div className="mx-auto flex max-w-4xl flex-col gap-16">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium tracking-wide text-cyan-400">SPATIAL ANALYSIS</p>
              <h3 className="mt-2 text-2xl font-bold">What a single frame reveals</h3>
              <p className="mt-3 text-slate-400">
                MobileNetV2 extracts visual features from each individual
                frame — examining the fine-grained detail of a face in a
                single moment in time.
              </p>
            </div>
            <div className="flex h-32 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5">
              <Cpu className="h-10 w-10 text-cyan-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="order-2 flex h-32 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-400/5 md:order-1">
              <Brain className="h-10 w-10 text-purple-400" />
            </div>
            <div className="order-1 md:order-2">
              <p className="text-xs font-medium tracking-wide text-purple-400">TEMPORAL ANALYSIS</p>
              <h3 className="mt-2 text-2xl font-bold">How it changes over time</h3>
              <p className="mt-3 text-slate-400">
                An LSTM layer models the sequence of features across frames,
                picking up on inconsistencies that only become visible when
                you look at motion rather than a single image.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium tracking-wide text-blue-400">PREDICTION</p>
              <h3 className="mt-2 text-2xl font-bold">One clear verdict</h3>
              <p className="mt-3 text-slate-400">
                Both signals combine into a single REAL / FAKE prediction,
                along with a confidence score showing how strongly the model
                supports that call.
              </p>
            </div>
            <div className="flex h-32 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/5">
              <ShieldCheck className="h-10 w-10 text-blue-400" />
            </div>
          </div>
        </div>
      </section>

      {/* TECH GRID */}
      <section className="px-8 py-24 md:px-16">
        <p className="text-center text-sm font-medium tracking-wide text-purple-400">THE TECHNOLOGY</p>
        <h2 className="mt-2 text-center text-3xl font-bold">Built with</h2>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {techCards.map(({ label, desc }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-panel/60 p-6 text-center">
              <p className="font-semibold">{label}</p>
              <p className="mt-1 text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* READING A RESULT */}
      <section className="px-8 py-24 md:px-16">
        <p className="text-center text-sm font-medium tracking-wide text-cyan-400">READING A RESULT</p>
        <h2 className="mt-2 text-center text-3xl font-bold">What the result means</h2>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {resultCards.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-panel/60 p-6 text-center">
              <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg ring-1 ${resultColors[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-semibold">{label}</p>
              <p className="mt-1 text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY AUTHENTISCAN */}
      <section className="px-8 py-24 md:px-16">
        <p className="text-center text-sm font-medium tracking-wide text-cyan-400">WHY AUTHENTISCAN</p>
        <h2 className="mt-2 text-center text-3xl font-bold">Built for clarity</h2>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {differentiators.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-slate-800 bg-panel/60 p-6 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                <Icon className="h-5 w-5 text-blue-400" />
              </div>
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURE GRID (replaces vertical connected-line diagram) */}
      <section className="px-8 py-24 md:px-16">
        <p className="text-center text-sm font-medium tracking-wide text-cyan-400">PROJECT ARCHITECTURE</p>
        <h2 className="mt-2 text-center text-3xl font-bold">How the system is built</h2>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {architectureCards.map(({ label, desc }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-panel/60 p-6 text-center">
              <p className="font-semibold">{label}</p>
              <p className="mt-1 text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DATASET & MODEL */}
      <section className="px-8 py-24 md:px-16">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-panel/60 p-10">
          <p className="text-center text-sm font-medium tracking-wide text-cyan-400">DATASET & MODEL</p>
          <h2 className="mt-2 text-center text-3xl font-bold">Trained on real data</h2>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-white/5 p-5">
              <p className="text-xs font-medium tracking-wide text-slate-500">TRAINING DATA</p>
              <p className="mt-1 text-sm text-slate-300">
                A unified dataset combining FaceForensics++, DFDC, and Celeb-DF v2 — 7,109 face-sequence samples.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-white/5 p-5">
              <p className="text-xs font-medium tracking-wide text-slate-500">MODEL</p>
              <p className="mt-1 text-sm text-slate-300">Hybrid MobileNet + LSTM, 2.98M parameters.</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 border-t border-slate-800 pt-8 sm:grid-cols-3">
            {stats.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold">{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 pb-24 md:px-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-10 text-center">
          <ScanFace className="h-8 w-8 text-cyan-400" />
          <p className="text-xl font-bold">Ready to verify a video?</p>
          <p className="text-sm text-slate-400">Upload. Analyze. Understand.</p>
          <Link
            to="/analyze"
            className="mt-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400"
          >
            Analyze a Video
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}