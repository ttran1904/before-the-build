"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { FaClipboardList, FaBookOpen, FaArrowRight, FaXmark } from "react-icons/fa6";

const STORAGE_KEY = "btb:welcome:dismissed:v1";

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = () => cb();
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}
function getDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}
function getServerSnapshot(): boolean {
  return true;
}
function setDismissedExternal() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, "1");
  }
  listeners.forEach((cb) => cb());
}

const slides = [
  {
    icon: <FaClipboardList className="text-3xl text-[#c08a5a]" />,
    tag: "Step 1 — Talk to your contractor",
    title: "Groundwork Scope",
    body: "A short, guided interview that produces a contractor-ready brief. We capture what is changing, what is staying, plumbing & electrical flags, and a realistic cost range — so every contractor bids the same project.",
    accent: "#c08a5a",
  },
  {
    icon: <FaBookOpen className="text-3xl text-[#2d5a3d]" />,
    tag: "Step 2 — Decide the design",
    title: "Build Book",
    body: "Pin inspiration, generate a real-photo mockup of your room, and assemble a moodboard with an items checklist. The final shareable Build Book is what your designer or contractor builds from.",
    accent: "#2d5a3d",
  },
  {
    icon: <FaArrowRight className="text-3xl text-[#1a1a2e]" />,
    tag: "You can do them in any order",
    title: "Where do you want to start?",
    body: "Most people start with Groundwork Scope to get clear on the project, then move into Build Book once they know the budget and constraints. But Build Book is great on its own if you already know the scope.",
    accent: "#1a1a2e",
  },
];

export function WelcomeModal() {
  const router = useRouter();
  const dismissed = useSyncExternalStore(subscribe, getDismissed, getServerSnapshot);
  const [step, setStep] = useState(0);

  function dismiss() {
    setDismissedExternal();
  }

  if (dismissed) return null;
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#faf8f3] shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-[#9a9aaa] transition hover:text-[#1a1a2e]"
        >
          <FaXmark />
        </button>

        <div className="px-8 pb-6 pt-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
            {slide.icon}
          </div>
          <p
            className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: slide.accent }}
          >
            {slide.tag}
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#1a1a2e]">{slide.title}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6a6a7a]">{slide.body}</p>
        </div>

        <div className="flex justify-center gap-2 pb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-[#1a1a2e]" : "w-1.5 bg-[#d5d3cd]"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[#ece9e3] bg-white px-6 py-4">
          <button
            onClick={dismiss}
            className="text-sm text-[#6a6a7a] transition hover:text-[#1a1a2e]"
          >
            Skip
          </button>
          {isLast ? (
            <div className="flex gap-2">
              <button
                onClick={dismiss}
                className="rounded-lg border border-[#d5d3cd] bg-white px-4 py-2 text-sm font-medium text-[#1a1a2e] transition hover:border-[#1a1a2e]"
              >
                Explore on my own
              </button>
              <button
                onClick={() => {
                  dismiss();
                  router.push("/start");
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1a1a2e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
              >
                Start a project <FaArrowRight className="text-xs" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(s + 1, slides.length - 1))}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a1a2e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
            >
              Next <FaArrowRight className="text-xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}