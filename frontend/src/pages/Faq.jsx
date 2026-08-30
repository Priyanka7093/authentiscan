import { useState } from "react";
import {
  ScanFace,
  HelpCircle,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import bg from "../assets/authentiscan-bg.png";

const faqs = [
  {
    q: "What is deepfake detection?",
    a: "Deepfake detection is the process of analyzing video content to identify whether faces or footage have been artificially generated or manipulated using AI.",
  },
  {
    q: "How does our AI detect manipulated videos?",
    a: "The system extracts faces from video frames and analyzes both spatial patterns (what each frame looks like) and temporal patterns (how the face changes across frames) to flag inconsistencies typical of manipulated content.",
  },
  {
    q: "What models are used?",
    a: "A hybrid architecture: MobileNetV2 extracts spatial features from each frame, and an LSTM layer analyzes how those features change over time across the sequence.",
    tags: ["MobileNet", "LSTM", "Spatial + Temporal"],
  },
  {
    q: "How accurate is the system?",
    a: "The model reached about 90.5% validation accuracy on a curated benchmark combining FaceForensics++, DFDC, and Celeb-DF. Real-world footage (like a phone or webcam video) can behave differently from these lab-quality datasets, so accuracy on arbitrary uploads may vary.",
  },
  {
    q: "What types of videos can be analyzed?",
    a: "MP4 video files containing a visible face work best, since the model relies on detecting and analyzing facial regions.",
  },
  {
    q: "Why can AI detection sometimes be uncertain?",
    a: "Confidence can drop with poor lighting, low resolution, unusual camera angles, or footage that looks different from the datasets the model was trained on — this is a known limitation of any deepfake detector, not just ours.",
  },
  {
    q: "What happens to my uploaded video?",
    a: "The video is sent to the analysis service for prediction, and the result (filename, verdict, and confidence score) is saved to your prediction history so you can review it later.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="min-h-screen bg-ink text-white">
      <Navbar />

      {/* HERO */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/90 to-ink" />

        <div className="relative z-10 mx-auto max-w-3xl px-8 py-14 text-center md:px-16">
          <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 text-xs font-medium text-cyan-300">
            Frequently Asked Questions
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              know
            </span>
          </h1>

          <p className="mt-6 text-slate-400">
            Answers about how Authentiscan works, what it can analyze, and how
            to read its results.
          </p>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="px-8 py-10 md:px-16">
        <div className="mx-auto max-w-3xl">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={item.q}
                className={`mb-4 rounded-2xl border bg-panel/60 transition ${
                  isOpen ? "border-cyan-400/40" : "border-slate-800"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle
                      className={`h-4 w-4 shrink-0 ${
                        isOpen ? "text-cyan-400" : "text-slate-500"
                      }`}
                    />
                    <span className="text-sm font-medium text-slate-200">{item.q}</span>
                  </span>
                  {isOpen ? (
                    <Minus className="h-4 w-4 shrink-0 text-cyan-400" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-slate-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-slate-800/70 px-6 pb-6 pt-4">
                    <p className="text-sm leading-relaxed text-slate-400">{item.a}</p>
                    {item.tags && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-cyan-400/30 bg-cyan-400/5 px-2.5 py-1 text-[11px] text-cyan-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 pb-24 md:px-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-10 text-center">
          <ScanFace className="h-8 w-8 text-cyan-400" />
          <p className="text-xl font-bold">Still have questions?</p>
          <p className="text-sm text-slate-400">
            The best way to understand Authentiscan is to try it.
          </p>
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