"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaWandMagicSparkles,
  FaBullseye, FaRulerCombined, FaClipboardList, FaCoins, FaImages, FaListCheck,
  FaChartLine, FaUpRightAndDownLeftFromCenter, FaLeaf, FaPaintRoller,
  FaChildReaching, FaWheelchair, FaWrench, FaBox, FaSpa,
  FaPaintbrush, FaScrewdriverWrench, FaHammer, FaRuler,
  FaCompass, FaTrash, FaPlus,
  FaCalendarDays, FaHelmetSafety, FaStar, FaStarHalfStroke,
  FaCircleCheck, FaThumbsUp, FaClock, FaDiamond,
  FaArrowUpRightFromSquare, FaLocationDot, FaShieldHalved, FaMagnifyingGlass,
} from "react-icons/fa6";
import { useWizardStore, useMoodboardStore, type BathroomScope, type BudgetTier } from "@/lib/store";
import Link from "next/link";
import type { DesignStyle } from "@before-the-build/shared";

/* ── Step definitions ── */
const STEPS = [
  { id: "goal", label: "Goal", icon: FaBullseye },
  { id: "scope", label: "Scope", icon: FaRulerCombined },
  { id: "must-haves", label: "Must-Haves", icon: FaClipboardList },
  { id: "budget", label: "Budget", icon: FaCoins },
  { id: "moodboard", label: "Moodboard", icon: FaImages },
  { id: "timeline", label: "Timeline", icon: FaCalendarDays },
  { id: "contractor", label: "Contractor", icon: FaHelmetSafety },
  { id: "summary", label: "Summary", icon: FaListCheck },
];

/* ── Dirty-check: build a hash string of inputs that drive AI calls ── */
function wizardInputHash(s: { goal: string; scope: BathroomScope | null; mustHaves: string[]; niceToHaves: string[]; budgetTier: BudgetTier | null; bathroomSize: string; style: DesignStyle | null }) {
  return [s.goal, s.scope, s.mustHaves.join(","), s.niceToHaves.join(","), s.budgetTier, s.bathroomSize, s.style].join("|");
}

/* ── Types for AI data ── */
interface TimelineTask {
  id: number; name: string; phase: string; startDay: number; duration: number;
  dependencies: number[]; assignee: string; milestone: boolean;
}
interface Contractor {
  name: string; rating: number; reviewCount: number; specialty: string;
  location: string; price: string; thumbtackUrl: string; hiredCount: string;
  responseTime: string; verified: boolean; thumbnail?: string;
}

export default function BathroomWizardPage() {
  const router = useRouter();
  const store = useWizardStore();
  const [currentStep, setCurrentStep] = useState(0);

  /* AI data for Timeline step */
  const [timelineTasks, setTimelineTasks] = useState<TimelineTask[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const timelineHashRef = useRef("");

  /* AI data for Contractor step */
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorLoading, setContractorLoading] = useState(false);
  const contractorHashRef = useRef("");
  const [contractorZip, setContractorZip] = useState("");

  const currentHash = useMemo(() => wizardInputHash(store), [store.goal, store.scope, store.mustHaves, store.niceToHaves, store.budgetTier, store.bathroomSize, store.style]);

  /* Fetch timeline — only if inputs changed */
  const fetchTimeline = useCallback(async () => {
    if (currentHash === timelineHashRef.current && timelineTasks.length > 0) return;
    setTimelineLoading(true);
    try {
      const res = await fetch("/api/ai/generate-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: store.goal, scope: store.scope, budgetTier: store.budgetTier,
          bathroomSize: store.bathroomSize, mustHaves: store.mustHaves, style: store.style,
        }),
      });
      const data = await res.json();
      setTimelineTasks(data.tasks || []);
      timelineHashRef.current = currentHash;
    } catch { /* keep existing data */ }
    setTimelineLoading(false);
  }, [currentHash, store.goal, store.scope, store.budgetTier, store.bathroomSize, store.mustHaves, store.style, timelineTasks.length]);

  /* Fetch contractors — user-triggered with zip code */
  const fetchContractors = useCallback(async (zip: string) => {
    const contractorKey = `${currentHash}|${zip}`;
    if (contractorKey === contractorHashRef.current && contractors.length > 0) return;
    setContractorLoading(true);
    try {
      const params = new URLSearchParams({ scope: store.scope || "full", zip });
      const res = await fetch(`/api/ai/search-contractors?${params}`);
      const data = await res.json();
      setContractors(data.contractors || []);
      contractorHashRef.current = contractorKey;
    } catch { /* keep existing data */ }
    setContractorLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHash, store.scope, contractors.length]);

  const needsTimelineRefresh = currentHash !== timelineHashRef.current || timelineTasks.length === 0;

  const next = () => {
    const nextIdx = Math.min(currentStep + 1, STEPS.length - 1);
    if (STEPS[nextIdx]?.id === "timeline" && needsTimelineRefresh) fetchTimeline();
    setCurrentStep(nextIdx);
  };
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen bg-[#f8f7f4]">
      {/* ── Green left sidebar ── */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[#2d5a3d]">
        {/* Brand */}
        <div className="px-6 pt-6 pb-2">
          <h1 className="text-lg font-bold text-white">Before The Build</h1>
          <p className="mt-1 text-xs text-white/60">Bathroom Renovation</p>
        </div>

        {/* Progress bar */}
        <div className="mx-6 mt-4 h-1 rounded-full bg-white/15">
          <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mx-6 mt-2 text-[10px] text-white/50">Step {currentStep + 1} of {STEPS.length}</p>

        {/* Step list */}
        <nav className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <button
                key={step.id}
                onClick={() => done && setCurrentStep(i)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  active
                    ? "bg-white/15 text-white"
                    : done
                      ? "cursor-pointer text-white/80 hover:bg-white/10"
                      : "text-white/35"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs transition ${
                  active
                    ? "bg-white text-[#2d5a3d]"
                    : done
                      ? "bg-white/25 text-white"
                      : "bg-white/10 text-white/40"
                }`}>
                  {done ? <FaCheck className="text-[10px]" /> : <step.icon className="text-[11px]" />}
                </span>
                <span className="text-sm font-medium">{step.label}</span>
                {done && (
                  <FaCircleCheck className="ml-auto text-xs text-white/40" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Back to explore link */}
        <div className="border-t border-white/10 px-6 py-4">
          <Link href="/explore" className="flex items-center gap-2 text-xs text-white/50 transition hover:text-white/80">
            <FaArrowLeft className="text-[10px]" /> Back to Explore
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className={`mx-auto px-8 py-10 ${currentStep === 5 ? "max-w-6xl" : "max-w-3xl"}`}>
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5">
            {currentStep === 0 && <GoalStep />}
            {currentStep === 1 && <ScopeStep />}
            {currentStep === 2 && <MustHavesStep />}
            {currentStep === 3 && <BudgetStep />}
            {currentStep === 4 && <MoodboardStep />}
            {currentStep === 5 && <TimelineStep tasks={timelineTasks} loading={timelineLoading} />}
            {currentStep === 6 && <ContractorStep contractors={contractors} loading={contractorLoading} zip={contractorZip} onZipChange={setContractorZip} onSearch={fetchContractors} />}
            {currentStep === 7 && <SummaryStep tasks={timelineTasks} contractors={contractors} />}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={back}
              disabled={currentStep === 0}
              className="flex items-center gap-2 rounded-lg border border-[#d5d3cd] px-6 py-2.5 text-sm font-medium text-[#4a4a5a] transition hover:bg-white disabled:opacity-30"
            >
              <FaArrowLeft className="text-xs" /> Back
            </button>
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
              >
                Next <FaArrowRight className="text-xs" />
              </button>
            ) : (
              <button
                onClick={() => router.push("/renovate/bathroom/visualize")}
                className="flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
              >
                <FaWandMagicSparkles className="text-xs" /> See Your Design
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Goal Step ── */
function GoalStep() {
  const { goal, setGoal } = useWizardStore();

  const GOALS = [
    { id: "increase_value", label: "Increase Home Value", desc: "Focus on ROI upgrades — vanity, tile, fixtures", icon: FaChartLine },
    { id: "more_space", label: "Create More Space", desc: "Reconfigure layout, remove tub for walk-in shower", icon: FaUpRightAndDownLeftFromCenter },
    { id: "energy_efficient", label: "Energy Efficient", desc: "Low-flow fixtures, LED lighting, better ventilation", icon: FaLeaf },
    { id: "update_style", label: "Update the Style", desc: "Change aesthetic — modern, farmhouse, spa-like", icon: FaPaintRoller },
    { id: "family_friendly", label: "Family / Kid-Friendly", desc: "Non-slip floors, tub, storage, durability", icon: FaChildReaching },
    { id: "accessibility", label: "Improve Accessibility", desc: "Walk-in shower, grab bars, ADA compliance", icon: FaWheelchair },
    { id: "fix_problems", label: "Fix Existing Problems", desc: "Leaks, mold, outdated plumbing, broken tiles", icon: FaWrench },
    { id: "more_storage", label: "Increase Storage", desc: "Vanity with drawers, medicine cabinet, shelving", icon: FaBox },
    { id: "luxury_spa", label: "Create a Spa Experience", desc: "Soaking tub, rain shower, heated floors", icon: FaSpa },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">
        What&apos;s the main goal of your bathroom renovation?
      </h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        This helps us tailor recommendations, budget estimates, and product suggestions.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
              goal === g.id
                ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                : "border-[#e8e6e1] hover:border-[#d5d3cd]"
            }`}
          >
            <span className="mt-0.5 text-lg text-[#2d5a3d]"><g.icon /></span>
            <div>
              <div className="font-semibold text-[#1a1a2e]">{g.label}</div>
              <div className="mt-0.5 text-xs text-[#6a6a7a]">{g.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Scope Step ── */
function ScopeStep() {
  const { scope, setScope } = useWizardStore();

  const SCOPES: { id: BathroomScope; label: string; desc: string; price: string; icon: typeof FaPaintbrush }[] = [
    { id: "cosmetic", label: "Cosmetic Refresh", desc: "Paint, fixtures, hardware, accessories. Minimal disruption.", price: "$1,000 – $5,000", icon: FaPaintbrush },
    { id: "partial", label: "Partial Remodel", desc: "New vanity, flooring, paint. Keep existing layout.", price: "$5,000 – $20,000", icon: FaScrewdriverWrench },
    { id: "full", label: "Full Remodel", desc: "Gut everything and rebuild. New layout possible.", price: "$15,000 – $50,000", icon: FaHammer },
    { id: "addition", label: "Addition / Expansion", desc: "Expand bathroom footprint. Structural changes.", price: "$30,000 – $100,000+", icon: FaRuler },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">What&apos;s the scope of work?</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        This determines the complexity, timeline, and budget range.
      </p>
      <div className="mt-6 space-y-3">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-5 text-left transition ${
              scope === s.id
                ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                : "border-[#e8e6e1] hover:border-[#d5d3cd]"
            }`}
          >
            <span className="text-xl text-[#2d5a3d]"><s.icon /></span>
            <div className="flex-1">
              <div className="font-semibold text-[#1a1a2e]">{s.label}</div>
              <div className="mt-0.5 text-sm text-[#6a6a7a]">{s.desc}</div>
            </div>
            <span className="shrink-0 rounded-full bg-[#f8f7f4] px-3 py-1 text-sm font-medium text-[#2d5a3d]">
              {s.price}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Must-Haves Step ── */
function MustHavesStep() {
  const { mustHaves, setMustHaves, niceToHaves, setNiceToHaves } = useWizardStore();

  const ALL_ITEMS = [
    "Walk-in shower", "Bathtub", "Double vanity", "Single vanity", "Heated floors",
    "Rain showerhead", "Handheld showerhead", "Grab bars", "Non-slip flooring",
    "Medicine cabinet", "LED mirror", "Towel warmer", "Built-in shelving",
    "Comfort-height toilet", "Bidet/bidet seat", "Exhaust fan upgrade",
    "New tile (floor)", "New tile (shower walls)", "Glass shower door",
    "Recessed lighting", "Dimmer switches", "Under-cabinet lighting",
  ];

  const toggleMustHave = (item: string) => {
    if (mustHaves.includes(item)) {
      setMustHaves(mustHaves.filter((i) => i !== item));
    } else {
      setNiceToHaves(niceToHaves.filter((i) => i !== item));
      setMustHaves([...mustHaves, item]);
    }
  };

  const toggleNiceToHave = (item: string) => {
    if (niceToHaves.includes(item)) {
      setNiceToHaves(niceToHaves.filter((i) => i !== item));
    } else {
      setMustHaves(mustHaves.filter((i) => i !== item));
      setNiceToHaves([...niceToHaves, item]);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">What do you need?</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Click once for <span className="font-semibold text-[#2d5a3d]">Must-Have</span>,
        twice for <span className="font-semibold text-[#d4956a]">Nice-to-Have</span>,
        three times to remove.
      </p>

      <div className="mt-4 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#2d5a3d]" /> Must-Have ({mustHaves.length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#d4956a]" /> Nice-to-Have ({niceToHaves.length})
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {ALL_ITEMS.map((item) => {
          const isMust = mustHaves.includes(item);
          const isNice = niceToHaves.includes(item);
          return (
            <button
              key={item}
              onClick={() => {
                if (!isMust && !isNice) toggleMustHave(item);
                else if (isMust) {
                  setMustHaves(mustHaves.filter((i) => i !== item));
                  toggleNiceToHave(item);
                }
                else toggleNiceToHave(item); // removes
              }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isMust
                  ? "border-[#2d5a3d] bg-[#2d5a3d] text-white"
                  : isNice
                    ? "border-[#d4956a] bg-[#d4956a]/10 text-[#d4956a]"
                    : "border-[#e8e6e1] text-[#4a4a5a] hover:border-[#d5d3cd]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Budget Step ── */
function BudgetStep() {
  const { budgetTier, setBudgetTier, bathroomSize, setBathroomSize } = useWizardStore();

  const BUDGET_DATA: Record<string, Record<BudgetTier, string>> = {
    small: { basic: "$5,000 – $10,000", mid: "$10,000 – $20,000", high: "$20,000 – $40,000" },
    medium: { basic: "$10,000 – $20,000", mid: "$20,000 – $35,000", high: "$35,000 – $60,000" },
    large: { basic: "$15,000 – $30,000", mid: "$30,000 – $50,000", high: "$50,000 – $100,000+" },
  };

  const tiers: { id: BudgetTier; label: string; desc: string; color: string }[] = [
    { id: "basic", label: "Basic", desc: "Builder-grade materials, standard fixtures", color: "#87CEEB" },
    { id: "mid", label: "Mid-Range", desc: "Quality materials, upgraded fixtures", color: "#2d5a3d" },
    { id: "high", label: "High-End", desc: "Premium materials, luxury fixtures", color: "#d4956a" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">What&apos;s your budget?</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Select your bathroom size and budget tier. We&apos;ll auto-add 10% for contingency.
      </p>

      {/* Size selector */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-[#4a4a5a]">Bathroom Size</label>
        <div className="flex gap-3">
          {([
            { id: "small" as const, label: "Small", sqft: "35-45 sqft" },
            { id: "medium" as const, label: "Medium", sqft: "45-75 sqft" },
            { id: "large" as const, label: "Large/Master", sqft: "75+ sqft" },
          ]).map((s) => (
            <button
              key={s.id}
              onClick={() => setBathroomSize(s.id)}
              className={`flex-1 rounded-xl border-2 p-4 text-center transition ${
                bathroomSize === s.id
                  ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                  : "border-[#e8e6e1] hover:border-[#d5d3cd]"
              }`}
            >
              <div className="font-semibold text-[#1a1a2e]">{s.label}</div>
              <div className="text-xs text-[#6a6a7a]">{s.sqft}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Budget tier */}
      <div className="mt-6 space-y-3">
        {tiers.map((t) => (
          <button
            key={t.id}
            onClick={() => setBudgetTier(t.id)}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-5 text-left transition ${
              budgetTier === t.id
                ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                : "border-[#e8e6e1] hover:border-[#d5d3cd]"
            }`}
          >
            <div className="h-4 w-4 rounded-full" style={{ background: t.color }} />
            <div className="flex-1">
              <div className="font-semibold text-[#1a1a2e]">{t.label}</div>
              <div className="text-xs text-[#6a6a7a]">{t.desc}</div>
            </div>
            <span className="shrink-0 text-lg font-bold text-[#2d5a3d]">
              {BUDGET_DATA[bathroomSize][t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Breakdown preview */}
      {budgetTier && (
        <div className="mt-6 rounded-xl bg-[#f8f7f4] p-4">
          <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">Estimated Breakdown</h4>
          <div className="space-y-2">
            {[
              { label: "Materials (40-50%)", pct: 45 },
              { label: "Labor (30-40%)", pct: 35 },
              { label: "Permits & Fees (5%)", pct: 5 },
              { label: "Contingency (10%)", pct: 10 },
              { label: "Design & Planning (5%)", pct: 5 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-40 text-xs text-[#4a4a5a]">{item.label}</span>
                <div className="h-2 flex-1 rounded-full bg-[#e8e6e1]">
                  <div
                    className="h-full rounded-full bg-[#2d5a3d]"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-medium text-[#4a4a5a]">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Moodboard Step ── */
function MoodboardStep() {
  const { items, removeItem } = useMoodboardStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Your Moodboard</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Review your saved inspiration images — these will guide your renovation design.
      </p>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-[#e8e6e1] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#1a1a2e]">Remove from Moodboard?</h3>
            <p className="mt-2 text-sm text-[#6a6a7a]">
              Are you sure you want to remove this image from your moodboard?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-[#d5d3cd] px-4 py-2 text-sm font-medium text-[#4a4a5a] transition hover:bg-[#f8f7f4]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeItem(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved moodboard images */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1a1a2e]">
            Saved Inspiration ({items.length})
          </h3>
          <Link
            href="/explore?from=moodboard"
            className="flex items-center gap-1.5 rounded-lg bg-[#2d5a3d]/10 px-3 py-1.5 text-xs font-semibold text-[#2d5a3d] transition hover:bg-[#2d5a3d]/20"
          >
            <FaCompass className="text-[10px]" /> Browse Explore
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-xl border border-[#e8e6e1]">
                <div className="relative aspect-square">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Moodboard image"}
                    fill
                    className="object-cover"
                    sizes="160px"
                    unoptimized
                  />
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                  >
                    <FaTrash className="text-[9px]" />
                  </button>
                </div>
                {item.title && (
                  <div className="px-2 py-1.5">
                    <p className="truncate text-[11px] text-[#4a4a5a]">{item.title}</p>
                  </div>
                )}
              </div>
            ))}
            {/* Add more card */}
            <Link
              href="/explore?from=moodboard"
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d5d3cd] text-[#9a9aaa] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5 hover:text-[#2d5a3d]"
            >
              <FaPlus className="text-lg" />
              <span className="text-[11px] font-medium">Add More</span>
            </Link>
          </div>
        ) : (
          <Link
            href="/explore?from=moodboard"
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#d5d3cd] p-10 transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5"
          >
            <FaImages className="text-3xl text-[#9a9aaa]" />
            <span className="text-sm font-medium text-[#6a6a7a]">
              No images saved yet — go to Explore to build your moodboard
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-[#2d5a3d] px-4 py-2 text-xs font-semibold text-white">
              <FaCompass className="text-[10px]" /> Open Explore
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Timeline Step (frappe-gantt) ── */
const TIMELINE_PHASE_COLORS: Record<string, string> = {
  Planning: "#3b82f6",
  Demolition: "#ef4444",
  "Rough-In": "#f97316",
  Installation: "#22c55e",
  Finishing: "#a855f7",
};

function TimelineStep({ tasks, loading }: { tasks: TimelineTask[]; loading: boolean }) {
  const PHASE_COLORS = TIMELINE_PHASE_COLORS;

  const totalDays = tasks.length > 0
    ? Math.max(...tasks.map((t) => t.startDay + t.duration))
    : 0;
  const totalWeeks = Math.ceil(totalDays / 7);
  const milestones = tasks.filter((t) => t.milestone);
  const phases = [...new Set(tasks.map((t) => t.phase))];

  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const ganttInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!ganttContainerRef.current || tasks.length === 0) return;

    const baseDate = new Date();
    const frappeTaskList = tasks.map((task) => {
      const startDate = new Date(baseDate);
      startDate.setDate(startDate.getDate() + task.startDay);
      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + task.startDay + task.duration);

      // Format as YYYY-MM-DD strings for frappe-gantt v1.x
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      return {
        id: `task-${task.id}`,
        name: task.name,
        start: fmt(startDate),
        end: fmt(endDate),
        progress: 0,
        dependencies: task.dependencies
          .map((depId) => `task-${depId}`)
          .join(", "),
        custom_class: `gantt-phase-${task.phase.toLowerCase().replace(/[\s-]+/g, "-")}`,
      };
    });

    // Build a map of task id → phase for direct coloring
    const taskPhaseMap = new Map(
      tasks.map((t) => [`task-${t.id}`, t.phase])
    );

    import("frappe-gantt").then((mod) => {
      const Gantt = mod.default;
      if (!ganttContainerRef.current) return;

      // Inject frappe-gantt CSS if not already loaded
      if (!document.getElementById("frappe-gantt-css")) {
        const link = document.createElement("link");
        link.id = "frappe-gantt-css";
        link.rel = "stylesheet";
        link.href = "/frappe-gantt.css";
        document.head.appendChild(link);
      }

      ganttContainerRef.current.innerHTML = "";

      ganttInstanceRef.current = new Gantt(ganttContainerRef.current, frappeTaskList, {
        view_mode: "Day",
        bar_height: 26,
        bar_corner_radius: 4,
        arrow_curve: 6,
        padding: 16,
        language: "en",
        on_click: () => {},
        on_date_change: () => {},
        on_progress_change: () => {},
        on_view_change: () => {},
      });

      // Directly color bars by phase after render
      requestAnimationFrame(() => {
        if (!ganttContainerRef.current) return;
        const barWrappers = ganttContainerRef.current.querySelectorAll(".bar-wrapper");
        barWrappers.forEach((wrapper) => {
          const dataId = wrapper.getAttribute("data-id");
          if (!dataId) return;
          const phase = taskPhaseMap.get(dataId);
          const color = phase ? PHASE_COLORS[phase] : "#2d5a3d";
          if (color) {
            const bar = wrapper.querySelector(".bar") as SVGRectElement | null;
            if (bar) bar.setAttribute("fill", color);
            const progress = wrapper.querySelector(".bar-progress") as SVGRectElement | null;
            if (progress) progress.setAttribute("fill", color);
          }
        });
      });
    });
  }, [tasks, PHASE_COLORS]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Project Timeline</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Your AI-generated renovation schedule. Phases are color-coded with dependencies shown.
      </p>

      {loading ? (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2d5a3d] border-t-transparent" />
          <span className="text-sm text-[#6a6a7a]">Generating your timeline with AI...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-10 text-center text-sm text-[#6a6a7a]">No timeline data available.</div>
      ) : (
        <>
          {/* Stats bar */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#f8f7f4] p-4 text-center">
              <div className="text-2xl font-bold text-[#2d5a3d]">{totalDays}</div>
              <div className="text-xs text-[#6a6a7a]">Total Days</div>
            </div>
            <div className="rounded-xl bg-[#f8f7f4] p-4 text-center">
              <div className="text-2xl font-bold text-[#2d5a3d]">{tasks.length}</div>
              <div className="text-xs text-[#6a6a7a]">Tasks</div>
            </div>
            <div className="rounded-xl bg-[#f8f7f4] p-4 text-center">
              <div className="text-2xl font-bold text-[#2d5a3d]">{milestones.length}</div>
              <div className="text-xs text-[#6a6a7a]">Milestones</div>
            </div>
          </div>

          {/* Phase legend */}
          <div className="mt-6 flex flex-wrap gap-3">
            {phases.map((phase) => (
              <span key={phase} className="flex items-center gap-1.5 text-xs font-medium text-[#4a4a5a]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PHASE_COLORS[phase] || "#94a3b8" }} />
                {phase}
              </span>
            ))}
          </div>

          {/* Frappe-gantt chart */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#e8e6e1]">
            <div ref={ganttContainerRef} className="gantt-container min-w-[700px]" />
          </div>

          {/* Phase color overrides */}
          <style jsx global>{`
            .gantt-container {
              --g-bar-color: #2d5a3d;
              --g-bar-border: #2d5a3d;
            }
            .gantt-container .grid-header { background-color: #f8f7f4; }
            .gantt-container .gantt .grid-row { fill: #fff; }
            .gantt-container .gantt .grid-row:nth-child(even) { fill: #fdfcfa; }
            .gantt-container .gantt .row-line { stroke: #e8e6e1; }
            .gantt-container .gantt .tick { stroke: #f0efeb; }
            .gantt-container .gantt .today-highlight { fill: rgba(45, 90, 61, 0.06); }
            .gantt-container .gantt .arrow { stroke: #6a6a7a; stroke-width: 1.8; }
            .gantt-container .gantt .bar-label { font-size: 11px; font-weight: 600; fill: #fff; }
            .gantt-container .gantt .bar-wrapper .bar-label.big { font-size: 11px; fill: #1a1a2e; }
            .gantt-container .lower-text,
            .gantt-container .upper-text { font-size: 11px; color: #9a9aaa; font-weight: 500; }
            .gantt-container .gantt .lower-text,
            .gantt-container .gantt .upper-text { font-size: 11px; fill: #9a9aaa; font-weight: 500; }
            .gantt .bar-wrapper.gantt-phase-planning .bar { fill: #3b82f6 !important; }
            .gantt .bar-wrapper.gantt-phase-demolition .bar { fill: #ef4444 !important; }
            .gantt .bar-wrapper.gantt-phase-rough-in .bar { fill: #f97316 !important; }
            .gantt .bar-wrapper.gantt-phase-installation .bar { fill: #22c55e !important; }
            .gantt .bar-wrapper.gantt-phase-finishing .bar { fill: #a855f7 !important; }
          `}</style>
        </>
      )}
    </div>
  );
}

/* ── Contractor Step (Thumbtack search) ── */
function ContractorStep({ contractors, loading, zip, onZipChange, onSearch }: {
  contractors: Contractor[]; loading: boolean; zip: string;
  onZipChange: (z: string) => void; onSearch: (zip: string) => void;
}) {
  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <span className="flex items-center gap-0.5 text-[#d4956a]">
        {Array.from({ length: full }, (_, i) => <FaStar key={i} className="text-[10px]" />)}
        {half && <FaStarHalfStroke className="text-[10px]" />}
      </span>
    );
  };

  const isValidZip = /^\d{5}$/.test(zip);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1a1a2e]">Find Contractors</h2>
        <span className="text-[11px] text-[#9a9aaa]">
          Powered by{" "}
          <a href="https://www.thumbtack.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#009fd9] hover:underline">Thumbtack</a>
        </span>
      </div>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Enter your zip code to find top-rated bathroom contractors near you.
      </p>

      {/* Zip code input + search button */}
      <div className="mt-6 flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <label htmlFor="zip" className="mb-1.5 block text-sm font-medium text-[#4a4a5a]">Zip Code</label>
          <input
            id="zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zip}
            onChange={(e) => onZipChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="e.g. 94103"
            className="w-full rounded-xl border-2 border-[#e8e6e1] bg-white px-4 py-2.5 text-sm text-[#1a1a2e] placeholder:text-[#9a9aaa] transition focus:border-[#2d5a3d] focus:outline-none"
          />
        </div>
        <button
          onClick={() => onSearch(zip)}
          disabled={!isValidZip || loading}
          className="flex items-center gap-2 rounded-xl bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaMagnifyingGlass className="text-xs" /> Search Contractors
        </button>
      </div>

      {loading ? (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2d5a3d] border-t-transparent" />
          <span className="text-sm text-[#6a6a7a]">Searching for contractors near you...</span>
        </div>
      ) : contractors.length > 0 ? (
        <div className="mt-6 space-y-4">
          {contractors.map((c, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#e8e6e1] p-5 transition hover:border-[#d5d3cd] hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                {c.thumbnail && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f8f7f4]">
                    <Image src={c.thumbnail} alt={c.name} fill className="object-cover" sizes="64px" unoptimized />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#1a1a2e]">{c.name}</h3>
                    {c.verified && (
                      <span className="flex items-center gap-1 rounded-full bg-[#2d5a3d]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2d5a3d]">
                        <FaShieldHalved className="text-[8px]" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#6a6a7a]">{c.specialty}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#4a4a5a]">
                    <span className="flex items-center gap-1">
                      {renderStars(c.rating)}
                      <span className="ml-1 font-medium">{c.rating}</span>
                      <span className="text-[#9a9aaa]">({c.reviewCount} reviews)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FaLocationDot className="text-[10px] text-[#9a9aaa]" /> {c.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock className="text-[10px] text-[#9a9aaa]" /> {c.responseTime}
                    </span>
                  </div>

                  {c.hiredCount && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[#2d5a3d]">
                      <FaThumbsUp className="text-[10px]" /> {c.hiredCount} hires
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold text-[#2d5a3d]">{c.price}</div>
                  <div className="text-[10px] text-[#9a9aaa]">estimated</div>
                  {c.thumbtackUrl && (
                    <a
                      href={c.thumbtackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#2d5a3d] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#234a31]"
                    >
                      View <FaArrowUpRightFromSquare className="text-[8px]" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── Summary Step ── */
function SummaryStep({ tasks, contractors }: { tasks: TimelineTask[]; contractors: Contractor[] }) {
  const store = useWizardStore();
  const moodboardCount = useMoodboardStore.getState().items.length;

  const GOAL_LABELS: Record<string, string> = {
    increase_value: "Increase Home Value",
    more_space: "Create More Space",
    energy_efficient: "Energy Efficient",
    update_style: "Update the Style",
    family_friendly: "Family / Kid-Friendly",
    accessibility: "Improve Accessibility",
    fix_problems: "Fix Existing Problems",
    more_storage: "Increase Storage",
    luxury_spa: "Spa Experience",
  };

  const SCOPE_LABELS: Record<string, string> = {
    cosmetic: "Cosmetic Refresh",
    partial: "Partial Remodel",
    full: "Full Remodel",
    addition: "Addition / Expansion",
  };

  const totalDays = tasks.length > 0
    ? Math.max(...tasks.map((t) => t.startDay + t.duration))
    : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Your Renovation Plan</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Everything&apos;s set! Here&apos;s your bathroom renovation summary.
      </p>

      <div className="mt-6 space-y-4">
        <SummaryRow label="Goal" value={GOAL_LABELS[store.goal] || store.goal} />
        <SummaryRow label="Scope" value={store.scope ? SCOPE_LABELS[store.scope] : "—"} />
        <SummaryRow label="Size" value={`${store.bathroomSize.charAt(0).toUpperCase() + store.bathroomSize.slice(1)} bathroom`} />
        <SummaryRow label="Budget Tier" value={store.budgetTier ? store.budgetTier.charAt(0).toUpperCase() + store.budgetTier.slice(1) : "—"} />
        <SummaryRow label="Style" value={store.style || "—"} />
        <SummaryRow label="Moodboard" value={`${moodboardCount} saved images`} />
        <SummaryRow label="Must-Haves" value={store.mustHaves.join(", ") || "None selected"} />
        <SummaryRow label="Nice-to-Haves" value={store.niceToHaves.join(", ") || "None selected"} />
        <SummaryRow label="Timeline" value={tasks.length > 0 ? `${tasks.length} tasks over ${totalDays} days` : "—"} />
        <SummaryRow label="Contractors" value={contractors.length > 0 ? `${contractors.length} matched pros` : "—"} />
      </div>

      {/* Ready banner */}
      <div className="mt-6 rounded-xl border border-[#2d5a3d]/20 bg-[#2d5a3d]/5 p-5">
        <div className="flex items-center gap-2">
          <FaCircleCheck className="text-[#2d5a3d]" />
          <span className="text-sm font-semibold text-[#2d5a3d]">Ready to Visualize</span>
        </div>
        <p className="mt-2 text-sm text-[#4a4a5a]">
          Your plan is complete with timeline and contractor matches. Click &quot;See Your Design&quot; to generate an AI visualization of your new bathroom.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 rounded-lg bg-[#f8f7f4] px-4 py-3">
      <span className="w-28 shrink-0 text-sm font-medium text-[#6a6a7a]">{label}</span>
      <span className="text-sm font-medium text-[#1a1a2e]">{value}</span>
    </div>
  );
}
