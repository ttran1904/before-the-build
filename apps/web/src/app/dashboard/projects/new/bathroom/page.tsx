"use client";

import { useState, useRef, useCallback, useMemo } from "react";
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
  FaArrowUpRightFromSquare, FaLocationDot, FaShieldHalved,
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
  responseTime: string; verified: boolean;
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
  }, [currentHash, store, timelineTasks.length]);

  /* Fetch contractors — only if inputs changed */
  const fetchContractors = useCallback(async () => {
    if (currentHash === contractorHashRef.current && contractors.length > 0) return;
    setContractorLoading(true);
    try {
      const params = new URLSearchParams({ scope: store.scope || "full", zip: "94103" });
      const res = await fetch(`/api/ai/search-contractors?${params}`);
      const data = await res.json();
      setContractors(data.contractors || []);
      contractorHashRef.current = currentHash;
    } catch { /* keep existing data */ }
    setContractorLoading(false);
  }, [currentHash, store.scope, contractors.length]);

  const next = () => {
    const nextIdx = Math.min(currentStep + 1, STEPS.length - 1);
    // Trigger AI when entering Timeline or Contractor steps
    if (STEPS[nextIdx]?.id === "timeline") fetchTimeline();
    if (STEPS[nextIdx]?.id === "contractor") fetchContractors();
    setCurrentStep(nextIdx);
  };
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="border-b border-[#e8e6e1] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/explore" className="flex items-center gap-2 text-sm text-[#6a6a7a] hover:text-[#1a1a2e]">
            <FaArrowLeft className="text-xs" /> Back to Explore
          </Link>
          <span className="text-sm font-medium text-[#4a4a5a]">
            Bathroom Renovation • Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-[#e8e6e1]">
          <div className="h-full bg-[#2d5a3d] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Horizontal step bar */}
      <div className="mx-auto mt-6 max-w-5xl overflow-x-auto px-6">
        <div className="flex items-center min-w-max">
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.id} className="contents">
                <button
                  onClick={() => done && setCurrentStep(i)}
                  className={`group flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition ${
                    active
                      ? "border-[#2d5a3d] bg-[#2d5a3d] text-white shadow-md shadow-[#2d5a3d]/20"
                      : done
                        ? "cursor-pointer border-[#2d5a3d]/20 bg-[#2d5a3d]/10 text-[#2d5a3d] hover:bg-[#2d5a3d]/20"
                        : "border-[#d5d3cd] text-[#b0b0ba]"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                    active ? "bg-white/20" : done ? "bg-[#2d5a3d] text-white" : "bg-[#e8e6e1]"
                  }`}>
                    {done ? <FaCheck /> : <step.icon />}
                  </span>
                  <span className="text-xs font-semibold">{step.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`mx-2 h-[2px] min-w-[20px] flex-1 rounded-full transition-colors ${
                    done ? "bg-[#2d5a3d]" : "bg-[#d5d3cd]"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className={`rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5 ${
          currentStep === 5 ? "max-w-none !mx-0" : ""
        }`}>
          {currentStep === 0 && <GoalStep />}
          {currentStep === 1 && <ScopeStep />}
          {currentStep === 2 && <MustHavesStep />}
          {currentStep === 3 && <BudgetStep />}
          {currentStep === 4 && <MoodboardStep />}
          {currentStep === 5 && <TimelineStep tasks={timelineTasks} loading={timelineLoading} />}
          {currentStep === 6 && <ContractorStep contractors={contractors} loading={contractorLoading} />}
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
              onClick={() => router.push("/dashboard/projects/new/bathroom/visualize")}
              className="flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
            >
              <FaWandMagicSparkles className="text-xs" /> See Your Design
            </button>
          )}
        </div>
      </div>
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
  const { style, setStyle } = useWizardStore();
  const { items, removeItem } = useMoodboardStore();

  const STYLES: { id: DesignStyle; label: string; desc: string }[] = [
    { id: "modern", label: "Modern", desc: "Floating vanity, large-format tile, frameless glass" },
    { id: "minimalist", label: "Minimalist", desc: "Clean lines, neutral palette, zero clutter" },
    { id: "farmhouse", label: "Farmhouse", desc: "Shiplap, clawfoot tub, reclaimed wood" },
    { id: "coastal", label: "Coastal", desc: "Light blues, natural textures, breezy feel" },
    { id: "industrial", label: "Industrial", desc: "Exposed pipe, concrete, matte black fixtures" },
    { id: "scandinavian", label: "Scandinavian", desc: "White + wood, functional, warm minimal" },
    { id: "mid_century_modern", label: "Mid-Century Modern", desc: "Retro tile, bold color, organic shapes" },
    { id: "japandi", label: "Japandi", desc: "Japanese minimalism + Scandinavian warmth" },
    { id: "traditional", label: "Traditional", desc: "Classic fixtures, marble, ornate details" },
    { id: "bohemian", label: "Bohemian", desc: "Colorful tile, eclectic mix, bold patterns" },
    { id: "art_deco", label: "Art Deco", desc: "Gold accents, geometric tile, glamour" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Your Moodboard</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Review your saved inspiration images, add more from Explore, and pick your preferred style.
      </p>

      {/* Saved moodboard images */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1a1a2e]">
            Saved Inspiration ({items.length})
          </h3>
          <Link
            href="/explore"
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
                    onClick={() => removeItem(item.id)}
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
              href="/explore"
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d5d3cd] text-[#9a9aaa] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5 hover:text-[#2d5a3d]"
            >
              <FaPlus className="text-lg" />
              <span className="text-[11px] font-medium">Add More</span>
            </Link>
          </div>
        ) : (
          <Link
            href="/explore"
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

      {/* Style picker */}
      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-[#1a1a2e]">Design Style</h3>
        <p className="mb-4 text-xs text-[#6a6a7a]">
          Pick a style to guide AI visualizations and product recommendations.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                style === s.id
                  ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                  : "border-[#e8e6e1] hover:border-[#d5d3cd]"
              }`}
            >
              <div className="font-semibold text-[#1a1a2e]">{s.label}</div>
              <div className="mt-0.5 text-xs text-[#6a6a7a]">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Timeline Step (Bryntum-inspired Gantt chart) ── */
function TimelineStep({ tasks, loading }: { tasks: TimelineTask[]; loading: boolean }) {
  const PHASE_COLORS: Record<string, string> = {
    Planning: "#3b82f6",
    Demolition: "#ef4444",
    "Rough-In": "#f97316",
    Installation: "#22c55e",
    Finishing: "#a855f7",
  };

  const totalDays = tasks.length > 0
    ? Math.max(...tasks.map((t) => t.startDay + t.duration))
    : 0;
  const totalWeeks = Math.ceil(totalDays / 7);
  const milestones = tasks.filter((t) => t.milestone);
  const phases = [...new Set(tasks.map((t) => t.phase))];

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

          {/* Gantt chart */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#e8e6e1]">
            <div className="min-w-[700px]">
              {/* Week headers */}
              <div className="flex border-b border-[#e8e6e1] bg-[#f8f7f4]">
                <div className="w-52 shrink-0 border-r border-[#e8e6e1] px-3 py-2 text-xs font-semibold text-[#4a4a5a]">
                  Task
                </div>
                <div className="flex flex-1">
                  {Array.from({ length: totalWeeks }, (_, i) => (
                    <div key={i} className="flex-1 border-r border-[#e8e6e1] px-1 py-2 text-center text-[10px] text-[#6a6a7a]">
                      Wk {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Task rows */}
              {tasks.map((task) => {
                const pct = totalDays > 0 ? 100 / totalDays : 0;
                const left = task.startDay * pct;
                const width = Math.max(task.duration * pct, 1.5);
                const color = PHASE_COLORS[task.phase] || "#94a3b8";

                return (
                  <div key={task.id} className="group flex border-b border-[#e8e6e1] last:border-b-0 hover:bg-[#f8f7f4]/50">
                    <div className="w-52 shrink-0 border-r border-[#e8e6e1] px-3 py-2">
                      <div className="flex items-center gap-2">
                        {task.milestone && <FaDiamond className="shrink-0 text-[8px] text-[#d4956a]" />}
                        <span className="truncate text-xs font-medium text-[#1a1a2e]">{task.name}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-[#9a9aaa]">{task.assignee}</div>
                    </div>
                    <div className="relative flex-1 py-2">
                      <div
                        className="absolute top-1/2 h-5 -translate-y-1/2 rounded transition-all group-hover:h-6"
                        style={{ left: `${left}%`, width: `${width}%`, background: color, opacity: 0.85 }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center overflow-hidden text-[9px] font-medium text-white">
                          {task.duration}d
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Contractor Step (Thumbtack search) ── */
function ContractorStep({ contractors, loading }: { contractors: Contractor[]; loading: boolean }) {
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Find Contractors</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Top-rated bathroom contractors from Thumbtack, matched to your project scope.
      </p>

      {loading ? (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2d5a3d] border-t-transparent" />
          <span className="text-sm text-[#6a6a7a]">Searching for contractors near you...</span>
        </div>
      ) : contractors.length === 0 ? (
        <div className="mt-10 text-center text-sm text-[#6a6a7a]">No contractors found.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {contractors.map((c, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#e8e6e1] p-5 transition hover:border-[#d5d3cd] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
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
                      <FaThumbsUp className="text-[10px]" /> Hired {c.hiredCount} times on Thumbtack
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
      )}
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
