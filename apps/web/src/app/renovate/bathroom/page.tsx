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
  FaExpand, FaSwatchbook, FaCartShopping, FaSpinner, FaCrosshairs,
} from "react-icons/fa6";
import { useWizardStore, useMoodboardStore, type BathroomScope, type BudgetTier, type MoodboardItem } from "@/lib/store";
import Link from "next/link";
import type { DesignStyle } from "@before-the-build/shared";

/* ── Step definitions ── */
const STEPS = [
  { id: "goal", label: "Goal", icon: FaBullseye },
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
  location: string; url: string; hiredCount: string;
  responseTime: string; verified: boolean; thumbnail?: string; snippet?: string;
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
  const [thumbtackResults, setThumbtackResults] = useState<Contractor[]>([]);
  const [googleResults, setGoogleResults] = useState<Contractor[]>([]);
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
    if (contractorKey === contractorHashRef.current && thumbtackResults.length > 0) return;
    setContractorLoading(true);
    try {
      const params = new URLSearchParams({ scope: store.scope || "full", zip });
      const res = await fetch(`/api/ai/search-contractors?${params}`);
      const data = await res.json();
      setThumbtackResults(data.thumbtack || []);
      setGoogleResults(data.google || []);
      contractorHashRef.current = contractorKey;
    } catch { /* keep existing data */ }
    setContractorLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHash, store.scope, thumbtackResults.length]);

  const needsTimelineRefresh = currentHash !== timelineHashRef.current || timelineTasks.length === 0;

  const next = () => {
    const nextIdx = Math.min(currentStep + 1, STEPS.length - 1);
    if (STEPS[nextIdx]?.id === "timeline" && needsTimelineRefresh) fetchTimeline();
    if (STEPS[nextIdx]?.id === "contractor") { /* contractor step */ }
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
        <div className={`mx-auto px-8 py-10 ${currentStep === 3 || currentStep === 4 ? "max-w-6xl" : "max-w-3xl"}`}>
          {currentStep === 0 && <GoalAndScopeStep />}
          {currentStep !== 0 && (
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5">
            {currentStep === 1 && <MustHavesStep />}
            {currentStep === 2 && <BudgetStep />}
            {currentStep === 3 && <MoodboardStep />}
            {currentStep === 4 && <TimelineStep tasks={timelineTasks} loading={timelineLoading} />}
            {currentStep === 5 && <ContractorStep thumbtack={thumbtackResults} google={googleResults} loading={contractorLoading} zip={contractorZip} onZipChange={setContractorZip} onSearch={fetchContractors} />}
            {currentStep === 6 && <SummaryStep tasks={timelineTasks} contractorCount={thumbtackResults.length + googleResults.length} />}
          </div>
          )}

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

/* ── Goal + Scope Step (combined, TurboTax-style) ── */
function GoalAndScopeStep() {
  const { goal, setGoal, scope, setScope } = useWizardStore();
  const scopeRef = useRef<HTMLDivElement>(null);
  const prevGoalRef = useRef(goal);

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

  const SCOPES: { id: BathroomScope; label: string; desc: string; icon: typeof FaPaintbrush }[] = [
    { id: "cosmetic", label: "Cosmetic Refresh", desc: "Paint, fixtures, hardware, accessories. Minimal disruption.", icon: FaPaintbrush },
    { id: "partial", label: "Partial Remodel", desc: "New vanity, flooring, paint. Keep existing layout.", icon: FaScrewdriverWrench },
    { id: "full", label: "Full Remodel", desc: "Gut everything and rebuild. New layout possible.", icon: FaHammer },
    { id: "addition", label: "Addition / Expansion", desc: "Expand bathroom footprint. Structural changes.", icon: FaRuler },
  ];

  /* Auto-scroll to Scope when a goal is first selected and scope is still empty */
  useEffect(() => {
    if (goal && !prevGoalRef.current && !scope) {
      setTimeout(() => {
        scopeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
    prevGoalRef.current = goal;
  }, [goal, scope]);

  const handleGoalSelect = (id: string) => {
    const wasEmpty = !goal;
    setGoal(id);
    if (wasEmpty && !scope) {
      setTimeout(() => {
        scopeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Goal Card ── */}
      <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5">
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
              onClick={() => handleGoalSelect(g.id)}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                goal === g.id
                  ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                  : "border-[#e8e6e1] hover:border-[#d5d3cd]"
              }`}
            >
              <span className="mt-0.5 text-2xl text-[#2d5a3d]"><g.icon /></span>
              <div>
                <div className="font-semibold text-[#1a1a2e]">{g.label}</div>
                <div className="mt-0.5 text-xs text-[#6a6a7a]">{g.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Scope Card ── */}
      <div
        ref={scopeRef}
        className={`rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5 transition-all duration-500 ${
          !goal ? "opacity-40 pointer-events-none" : "opacity-100"
        }`}
      >
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
              <span className="text-2xl text-[#2d5a3d]"><s.icon /></span>
              <div className="flex-1">
                <div className="font-semibold text-[#1a1a2e]">{s.label}</div>
                <div className="mt-0.5 text-sm text-[#6a6a7a]">{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
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

/* ── Moodboard Step (discover items + moodboard view) ── */

interface PointedItem {
  id: string;
  cropBox: { x: number; y: number; w: number; h: number };
  label: string;
  loading: boolean;
  products: { title: string; price: string; source: string; url: string; thumbnail: string }[];
}

function MoodboardStep() {
  const { items, removeItem } = useMoodboardStore();
  const [activeSection, setActiveSection] = useState<"discover" | "moodboard">("discover");
  const [pointedItems, setPointedItems] = useState<Record<string, PointedItem[]>>({});
  const [selectingImageId, setSelectingImageId] = useState<string | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"select" | "products" | "styleboard">("select");
  const [productResults, setProductResults] = useState<Record<string, { title: string; price: string; source: string; url: string; thumbnail: string }[]>>({});
  const [searchingId, setSearchingId] = useState<string | null>(null);
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [generatingCollage, setGeneratingCollage] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const selectedItems = items.filter((i) => selectedIds.has(i.id));

  const searchProducts = async (item: MoodboardItem) => {
    setSearchingId(item.id);
    try {
      const res = await fetch("/api/ai/search-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: item.imageUrl, title: item.title }),
      });
      const data = await res.json();
      setProductResults((prev) => ({ ...prev, [item.id]: data.products || [] }));
    } catch {
      setProductResults((prev) => ({ ...prev, [item.id]: [] }));
    }
    setSearchingId(null);
  };

  const generateCollage = async () => {
    setGeneratingCollage(true);
    try {
      const imageUrls = selectedItems.map((i) => i.imageUrl);
      const res = await fetch("/api/ai/generate-styleboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls, products: Object.values(productResults).flat() }),
      });
      const data = await res.json();
      setCollageUrl(data.imageUrl || null);
    } catch { /* keep null */ }
    setGeneratingCollage(false);
  };

  const TABS = [
    { id: "select" as const, label: "Select Photos", icon: FaImages },
    { id: "products" as const, label: "Find Products", icon: FaCartShopping },
    { id: "styleboard" as const, label: "Style Board", icon: FaSwatchbook },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Your Moodboard</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Curate your inspiration, find matching products, and generate your style board &mdash; all in one place.
      </p>

      {/* Preview modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreviewItem(null)}>
          <div className="relative mx-4 max-h-[85vh] max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            >
              ✕
            </button>
            <div className="relative" style={{ minHeight: "300px", maxHeight: "75vh" }}>
              <Image
                src={previewItem.imageUrl}
                alt={previewItem.title || "Preview"}
                width={800}
                height={600}
                className="h-auto max-h-[75vh] w-full object-contain"
                unoptimized
              />
            </div>
            {previewItem.title && (
              <div className="border-t border-[#e8e6e1] px-6 py-3">
                <p className="text-sm font-medium text-[#1a1a2e]">{previewItem.title}</p>
              </div>
            )}
          </div>
        </div>
      )}

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
                  setSelectedIds((prev) => { const next = new Set(prev); next.delete(confirmDeleteId); return next; });
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

      {/* Tab navigation */}
      <div className="mt-5 flex gap-1 rounded-xl bg-[#f8f7f4] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-white text-[#2d5a3d] shadow-sm"
                : "text-[#6a6a7a] hover:text-[#4a4a5a]"
            }`}
          >
            <tab.icon className="text-xs" />
            {tab.label}
            {tab.id === "select" && items.length > 0 && (
              <span className="rounded-full bg-[#2d5a3d]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#2d5a3d]">{selectedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Select Photos ── */}
      {activeTab === "select" && (
        <div className="mt-5">
          {/* Selection summary bar */}
          {items.length > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#f8f7f4] px-4 py-2.5">
              <span className="text-sm text-[#4a4a5a]">
                <span className="font-semibold text-[#2d5a3d]">{selectedCount}</span> of {items.length} selected
              </span>
              <button
                onClick={() => setSelectedIds(selectedCount === items.length ? new Set() : new Set(items.map((i) => i.id)))}
                className="ml-auto text-xs font-medium text-[#2d5a3d] transition hover:underline"
              >
                {selectedCount === items.length ? "Deselect All" : "Select All"}
              </button>
            </div>
          )}

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
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                      isSelected ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/20" : "border-[#e8e6e1] hover:border-[#d5d3cd]"
                    }`}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={item.imageUrl}
                        alt={item.title || "Moodboard image"}
                        fill
                        className="object-cover"
                        sizes="160px"
                        unoptimized
                      />
                      {/* Select checkmark */}
                      <div className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                        isSelected
                          ? "border-[#2d5a3d] bg-[#2d5a3d] text-white"
                          : "border-white/70 bg-black/30 text-transparent"
                      }`}>
                        <FaCheck className="text-[10px]" />
                      </div>
                      {/* Action buttons */}
                      <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                          title="View larger"
                        >
                          <FaExpand className="text-[9px]" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.id); }}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-red-500"
                          title="Remove"
                        >
                          <FaTrash className="text-[9px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

          {/* CTA to go to products tab */}
          {items.length > 0 && selectedCount > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setActiveTab("products")}
                className="flex items-center gap-2.5 rounded-xl bg-[#2d5a3d] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2d5a3d]/20 transition hover:bg-[#234a31] hover:shadow-xl"
              >
                <FaCartShopping className="text-sm" />
                Find Matching Products
                <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">{selectedCount}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Find Products ── */}
      {activeTab === "products" && (
        <div className="mt-5">
          {selectedItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#d5d3cd] p-10">
              <FaCartShopping className="text-3xl text-[#9a9aaa]" />
              <p className="text-sm text-[#6a6a7a]">Select images in the &quot;Select Photos&quot; tab first.</p>
              <button onClick={() => setActiveTab("select")} className="text-xs font-semibold text-[#2d5a3d] hover:underline">Go to Select Photos</button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#6a6a7a]">
                Click &quot;Find Products&quot; on any image to search for real products that match.
              </p>
              {selectedItems.map((item) => {
                const products = productResults[item.id];
                const isSearching = searchingId === item.id;

                return (
                  <div key={item.id} className="rounded-xl border border-[#e8e6e1] p-3">
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                        <Image src={item.imageUrl} alt={item.title || ""} fill className="object-cover" sizes="80px" unoptimized />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <p className="text-sm font-medium text-[#1a1a2e] line-clamp-2">{item.title || "Inspiration image"}</p>
                        <button
                          onClick={() => searchProducts(item)}
                          disabled={isSearching}
                          className="mt-1 flex w-fit items-center gap-1.5 rounded-lg bg-[#2d5a3d]/10 px-3 py-1.5 text-xs font-semibold text-[#2d5a3d] transition hover:bg-[#2d5a3d]/20 disabled:opacity-50"
                        >
                          {isSearching ? (
                            <><FaSpinner className="animate-spin text-[10px]" /> Searching...</>
                          ) : products ? (
                            <><FaMagnifyingGlass className="text-[10px]" /> Search Again</>
                          ) : (
                            <><FaMagnifyingGlass className="text-[10px]" /> Find Products</>
                          )}
                        </button>
                      </div>
                    </div>

                    {products && products.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {products.slice(0, 4).map((p, i) => (
                          <a
                            key={i}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex gap-2 rounded-lg border border-[#e8e6e1] p-2 transition hover:bg-[#f8f7f4]"
                          >
                            {p.thumbnail && (
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-[#f8f7f4]">
                                <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="48px" unoptimized />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-medium text-[#1a1a2e]">{p.title}</p>
                              <p className="text-[10px] text-[#6a6a7a]">{p.source}</p>
                              {p.price && <p className="text-[11px] font-semibold text-[#2d5a3d]">{p.price}</p>}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                    {products && products.length === 0 && (
                      <p className="mt-2 text-xs text-[#9a9aaa]">No matching products found.</p>
                    )}
                  </div>
                );
              })}

              {/* CTA to style board */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setActiveTab("styleboard")}
                  className="flex items-center gap-2 rounded-xl bg-[#2d5a3d] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#234a31]"
                >
                  <FaSwatchbook className="text-sm" /> Generate Style Board
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Style Board ── */}
      {activeTab === "styleboard" && (
        <div className="mt-5">
          <p className="mb-4 text-xs text-[#6a6a7a]">
            Generate a curated mood board collage from your selected images and matched products.
          </p>

          {collageUrl ? (
            <div className="overflow-hidden rounded-xl border border-[#e8e6e1] shadow-md">
              <Image
                src={collageUrl}
                alt="Generated style board"
                width={600}
                height={500}
                className="h-auto w-full"
                unoptimized
              />
              <div className="border-t border-[#e8e6e1] p-4">
                <button
                  onClick={generateCollage}
                  disabled={generatingCollage}
                  className="flex items-center gap-2 rounded-lg bg-[#2d5a3d]/10 px-4 py-2 text-xs font-semibold text-[#2d5a3d] transition hover:bg-[#2d5a3d]/20"
                >
                  <FaWandMagicSparkles className="text-[10px]" /> Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#d5d3cd] p-12">
              <FaSwatchbook className="text-4xl text-[#d5d3cd]" />
              <p className="text-center text-sm text-[#6a6a7a]">
                Your AI-generated style board will appear here.
              </p>
              <button
                onClick={generateCollage}
                disabled={generatingCollage || selectedCount === 0}
                className="flex items-center gap-2 rounded-xl bg-[#2d5a3d] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#234a31] disabled:opacity-50"
              >
                {generatingCollage ? (
                  <><FaSpinner className="animate-spin" /> Generating...</>
                ) : (
                  <><FaWandMagicSparkles /> Generate Style Board</>
                )}
              </button>
              {selectedCount === 0 && (
                <p className="text-xs text-[#9a9aaa]">Select images first to generate a style board.</p>
              )}
            </div>
          )}
        </div>
      )}
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

/* ── Contractor Step (Thumbtack vs Google side-by-side) ── */
function ContractorStep({ thumbtack, google, loading, zip, onZipChange, onSearch }: {
  thumbtack: Contractor[]; google: Contractor[]; loading: boolean; zip: string;
  onZipChange: (z: string) => void; onSearch: (zip: string) => void;
}) {
  const renderStars = (rating: number) => {
    if (rating === 0) return null;
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
  const hasResults = thumbtack.length > 0 || google.length > 0;

  const renderCard = (c: Contractor, i: number, showThumbtackMeta: boolean) => (
    <div
      key={i}
      className="rounded-xl border border-[#e8e6e1] p-4 transition hover:border-[#d5d3cd] hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {c.thumbnail && (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f8f7f4]">
            <Image src={c.thumbnail} alt={c.name} fill className="object-cover" sizes="48px" unoptimized />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#1a1a2e] truncate">{c.name}</h3>
            {c.verified && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#2d5a3d]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#2d5a3d]">
                <FaShieldHalved className="text-[7px]" /> Verified
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-[#6a6a7a]">{c.specialty}</p>

          {showThumbtackMeta && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#4a4a5a]">
              {c.rating > 0 && (
                <span className="flex items-center gap-1">
                  {renderStars(c.rating)}
                  <span className="ml-0.5 font-medium">{c.rating}</span>
                  <span className="text-[#9a9aaa]">({c.reviewCount})</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <FaLocationDot className="text-[9px] text-[#9a9aaa]" /> {c.location}
              </span>
              {c.responseTime && (
                <span className="flex items-center gap-1">
                  <FaClock className="text-[9px] text-[#9a9aaa]" /> {c.responseTime}
                </span>
              )}
            </div>
          )}

          {!showThumbtackMeta && c.snippet && (
            <p className="mt-1.5 text-[11px] text-[#6a6a7a] line-clamp-2">{c.snippet}</p>
          )}

          {showThumbtackMeta && c.hiredCount && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#2d5a3d]">
              <FaThumbsUp className="text-[9px]" /> {c.hiredCount} hires
            </div>
          )}
        </div>
      </div>

      {/* View button */}
      {c.url && (
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#2d5a3d] py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#234a31]"
        >
          View <FaArrowUpRightFromSquare className="text-[8px]" />
        </a>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Find Contractors</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Enter your zip code to compare contractor results side by side.
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
      ) : hasResults ? (
        <div className="mt-6 grid grid-cols-2 gap-6">
          {/* Left column: Thumbtack */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Thumbtack Results</h3>
              <span className="text-[10px] text-[#009fd9] font-medium">Powered by Thumbtack</span>
            </div>
            <div className="space-y-3">
              {thumbtack.map((c, i) => renderCard(c, i, true))}
            </div>
          </div>

          {/* Right column: Google */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Google Search Results</h3>
              <span className="text-[10px] text-[#4285f4] font-medium">Powered by Google</span>
            </div>
            <div className="space-y-3">
              {google.map((c, i) => renderCard(c, i, false))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Summary Step ── */
function SummaryStep({ tasks, contractorCount }: { tasks: TimelineTask[]; contractorCount: number }) {
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
        <SummaryRow label="Contractors" value={contractorCount > 0 ? `${contractorCount} matched pros` : "—"} />
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
