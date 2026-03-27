"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  FaLink, FaCircleExclamation,
  FaDollarSign, FaSackDollar, FaGem,
  FaToilet, FaShower, FaBath, FaCrown,
} from "react-icons/fa6";
import { useWizardStore, useMoodboardStore, type BathroomScope, type BudgetTier, type MoodboardItem } from "@/lib/store";
import { BATHROOM_SIZES } from "@/lib/room-sizes/bathroom";
import type { PointedItem, Product } from "@/lib/moodboard/types";
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
  const searchParams = useSearchParams();
  const store = useWizardStore();

  const initialStep = useMemo(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const idx = STEPS.findIndex(s => s.id === stepParam);
      if (idx >= 0) return idx;
    }
    return 0;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [currentStep, setCurrentStep] = useState(initialStep);

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

  /* Moodboard state — lifted here so it persists across step navigation */
  const [moodboardPointedItems, setMoodboardPointedItems] = useState<Record<string, PointedItem[]>>({});
  const [moodboardManualProducts, setMoodboardManualProducts] = useState<Product[]>([]);
  const [moodboardDragPositions, setMoodboardDragPositions] = useState<Record<number, { x: number; y: number }>>({});

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
        <div className={`mx-auto px-8 py-10 ${currentStep === 1 || currentStep === 3 || currentStep === 4 ? "max-w-6xl" : "max-w-3xl"}`}>
          {currentStep === 0 && <GoalAndScopeStep />}
          {currentStep !== 0 && (
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5">
            {currentStep === 1 && <MustHavesStep />}
            {currentStep === 2 && <BudgetStep />}
            {currentStep === 3 && <MoodboardStep pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} />}
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

/* ── Must-Haves Gallery Items (ordered most→least commonly needed) ── */
const MUST_HAVE_GALLERY = [
  { label: "New tile (floor)",           slug: "new-tile-floor",          desc: "Replace worn flooring with fresh porcelain, ceramic, or natural stone tile." },
  { label: "New tile (shower walls)",    slug: "new-tile-shower-walls",   desc: "Waterproof wall tile for your shower — subway, mosaic, or large-format." },
  { label: "Single vanity",             slug: "single-vanity",           desc: "A standalone sink cabinet — ideal for smaller bathrooms or powder rooms." },
  { label: "Comfort-height toilet",     slug: "comfort-height-toilet",   desc: "ADA-height bowl (17-19 in.) that's easier to sit down on and stand up from." },
  { label: "Exhaust fan upgrade",       slug: "exhaust-fan-upgrade",     desc: "Powerful, quiet ventilation to prevent mold and moisture damage." },
  { label: "Recessed lighting",         slug: "recessed-lighting",       desc: "Flush ceiling fixtures that provide even, shadow-free illumination." },
  { label: "Walk-in shower",            slug: "walk-in-shower",          desc: "Curbless or low-threshold shower — spacious, modern, and accessible." },
  { label: "Bathtub",                   slug: "bathtub",                 desc: "Freestanding, alcove, or drop-in tub for soaking and relaxation." },
  { label: "Double vanity",             slug: "double-vanity",           desc: "Two-sink vanity for shared bathrooms — more counter space and storage." },
  { label: "Glass shower door",         slug: "glass-shower-door",       desc: "Frameless or semi-frameless glass enclosure that opens up the room." },
  { label: "Medicine cabinet",          slug: "medicine-cabinet",        desc: "Recessed or surface-mount mirrored cabinet for organized storage." },
  { label: "Rain showerhead",           slug: "rain-showerhead",         desc: "Oversized ceiling-mount head that mimics gentle rainfall." },
  { label: "LED mirror",                slug: "led-mirror",              desc: "Backlit or edge-lit vanity mirror with built-in LED lighting." },
  { label: "Dimmer switches",           slug: "dimmer-switches",         desc: "Adjustable light controls for mood lighting and energy savings." },
  { label: "Handheld showerhead",       slug: "handheld-showerhead",     desc: "Detachable head on a flexible hose — great for rinsing and cleaning." },
  { label: "Non-slip flooring",         slug: "non-slip-flooring",       desc: "Textured tile or slip-resistant finish for wet-area safety." },
  { label: "Grab bars",                 slug: "grab-bars",               desc: "Wall-mounted safety bars near shower, tub, and toilet areas." },
  { label: "Heated floors",             slug: "heated-floors",           desc: "Electric radiant mats under tile for warm feet on cold mornings." },
  { label: "Built-in shelving",         slug: "built-in-shelving",       desc: "Recessed niches or open shelves built into shower or vanity walls." },
  { label: "Towel warmer",              slug: "towel-warmer",            desc: "Wall-mounted heated rack that keeps towels warm and dry." },
  { label: "Bidet/bidet seat",          slug: "bidet-bidet-seat",        desc: "Add-on bidet seat or standalone bidet for improved hygiene." },
  { label: "Under-cabinet lighting",    slug: "under-cabinet-lighting",  desc: "LED strip or puck lights beneath the vanity for ambient glow." },
];

/* Image extension lookup (some downloads may be .webp or .png) */
function mustHaveImageSrc(slug: string) {
  // At build time Next.js will resolve whichever file exists.
  // We default to .jpg; the download script may have saved .webp for some.
  const EXT_OVERRIDES: Record<string, string> = { "double-vanity": "webp" };
  const ext = EXT_OVERRIDES[slug] || "jpg";
  return `/images/must-haves/${slug}.${ext}`;
}

/* ── Must-Haves Step ── */
function MustHavesStep() {
  const { mustHaves, setMustHaves, niceToHaves, setNiceToHaves } = useWizardStore();

  const cycle = (label: string) => {
    const isMust = mustHaves.includes(label);
    const isNice = niceToHaves.includes(label);

    if (!isMust && !isNice) {
      // unselected → must-have
      setMustHaves([...mustHaves, label]);
    } else if (isMust) {
      // must-have → nice-to-have
      setMustHaves(mustHaves.filter((i) => i !== label));
      setNiceToHaves([...niceToHaves, label]);
    } else {
      // nice-to-have → remove
      setNiceToHaves(niceToHaves.filter((i) => i !== label));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Must-Haves vs. Nice-to-Haves</h2>
      <p className="mt-1 text-base text-[#4a4a5a]">Tap each item to set its priority for your renovation.</p>

      {/* Instruction chips */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#2d5a3d] bg-[#2d5a3d]/10 px-3 py-1 text-sm font-semibold text-[#2d5a3d]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2d5a3d]" /> 1st click — Must-Have
          <span className="ml-1 rounded-full bg-[#2d5a3d] px-1.5 text-xs text-white">{mustHaves.length}</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#d4956a] bg-[#d4956a]/10 px-3 py-1 text-sm font-semibold text-[#d4956a]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4956a]" /> 2nd click — Nice-to-Have
          <span className="ml-1 rounded-full bg-[#d4956a] px-1.5 text-xs text-white">{niceToHaves.length}</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#d5d3cd] bg-[#f0efeb] px-3 py-1 text-sm font-medium text-[#6a6a7a]">
          3rd click — Remove
        </span>
      </div>

      {/* ── Gallery grid ── */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {MUST_HAVE_GALLERY.map((item) => {
          const isMust = mustHaves.includes(item.label);
          const isNice = niceToHaves.includes(item.label);
          return (
            <button
              key={item.slug}
              onClick={() => cycle(item.label)}
              className={`group relative flex flex-col overflow-hidden rounded-xl text-left transition-all ${
                isMust
                  ? "border-4 border-[#2d5a3d]"
                  : isNice
                    ? "border-4 border-[#d4956a]"
                    : "border-2 border-[#e8e6e1] hover:border-[#d5d3cd] hover:shadow-md"
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f0efeb]">
                <Image
                  src={mustHaveImageSrc(item.slug)}
                  alt={item.label}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Selection badge */}
                {(isMust || isNice) && (
                  <span className={`absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow ${
                    isMust ? "bg-[#2d5a3d] text-white" : "bg-[#d4956a] text-white"
                  }`}>
                    {isMust ? <><FaCheck className="text-[8px]" /> Must</> : "Nice"}
                  </span>
                )}
              </div>
              {/* Label */}
              <div className="px-3 py-2.5">
                <span className="text-sm font-semibold text-[#1a1a2e] leading-tight">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Budget Step ── */

const BREAKDOWN_COLORS = ["#2d5a3d", "#d4a24c", "#d4956a", "#5b8c6e", "#87CEEB"];

function PieChart({ segments, size = 180 }: { segments: { pct: number; color: string; label: string; amount?: string }[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - 4) / 2;
  const [hovered, setHovered] = useState<number | null>(null);

  // Build pie wedge paths
  let cumulativeAngle = -90; // start at 12 o'clock
  const wedges = segments.map((seg) => {
    const startAngle = cumulativeAngle;
    const sweepAngle = (seg.pct / 100) * 360;
    cumulativeAngle += sweepAngle;
    return { ...seg, startAngle, sweepAngle };
  });

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {wedges.map((w, i) => {
          const isHovered = hovered === i;
          const r = isHovered ? radius : radius - 2;
          const startRad = toRad(w.startAngle);
          const endRad = toRad(w.startAngle + w.sweepAngle);
          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          const largeArc = w.sweepAngle > 180 ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return (
            <path
              key={i}
              d={d}
              fill={w.color}
              stroke="#f8f7f4"
              strokeWidth={2}
              className="transition-all duration-150"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer", filter: isHovered ? "brightness(1.15)" : undefined }}
            />
          );
        })}
      </svg>
      {/* Tooltip on hover */}
      {hovered !== null && (
        <div
          className="pointer-events-none absolute rounded-md bg-[#1a1a2e]/90 px-2.5 py-1.5 text-white shadow-lg"
          style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        >
          <div className="text-[10px] text-white/70">{segments[hovered].label}</div>
          <div className="text-sm font-bold">
            {segments[hovered].amount ?? `${segments[hovered].pct}%`}
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetStep() {
  const { goal, scope, mustHaves, niceToHaves, budgetTier, setBudgetTier, bathroomSize, setBathroomSize, budgetAmounts, setBudgetAmounts } = useWizardStore();

  const [estimate, setEstimate] = useState<{
    estimatedLow: number;
    estimatedHigh: number;
    breakdown: { category: string; pct: number; lowAmount: number; highAmount: number }[];
    budgetWarning: string | null;
    rationale: string;
  } | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [includeNiceToHaves, setIncludeNiceToHaves] = useState(true);
  const estimateFetchedRef = useRef(false);

  const tiers: { id: BudgetTier; label: string; desc: string; color: string; icon: React.ReactNode }[] = [
    { id: "basic", label: "Basic", desc: "Builder-grade materials, standard fixtures", color: "#87CEEB", icon: <FaDollarSign className="text-base" /> },
    { id: "mid", label: "Mid-Range", desc: "Quality materials, ~1 statement piece", color: "#2d5a3d", icon: <FaSackDollar className="text-base" /> },
    { id: "high", label: "High-End", desc: "Premium materials, more statement pieces", color: "#d4956a", icon: <FaGem className="text-base" /> },
  ];

  const selectedAmount = budgetTier ? budgetAmounts[budgetTier] : null;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  // Fetch engine estimate
  const fetchEstimate = useCallback(async () => {
    setEstimateLoading(true);
    try {
      const res = await fetch("/api/ai/budget-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          scope,
          mustHaves,
          niceToHaves: includeNiceToHaves ? niceToHaves : [],
          bathroomSize,
          customerBudget: selectedAmount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEstimate(data);
      }
    } catch {
      // Silently fail — static breakdown still visible
    } finally {
      setEstimateLoading(false);
    }
  }, [goal, scope, mustHaves, niceToHaves, includeNiceToHaves, bathroomSize, selectedAmount]);

  // Auto-fetch when the user picks a budget tier
  useEffect(() => {
    if (budgetTier && !estimateFetchedRef.current) {
      estimateFetchedRef.current = true;
      fetchEstimate();
    }
  }, [budgetTier, fetchEstimate]);

  // Re-fetch on customer budget change (debounced)
  const prevAmountRef = useRef<number | null>(null);
  useEffect(() => {
    if (selectedAmount != null && prevAmountRef.current != null && selectedAmount !== prevAmountRef.current) {
      const timer = setTimeout(() => fetchEstimate(), 800);
      return () => clearTimeout(timer);
    }
    prevAmountRef.current = selectedAmount ?? null;
  }, [selectedAmount, fetchEstimate]);

  // Re-fetch when nice-to-haves toggle changes
  useEffect(() => {
    if (budgetTier) {
      fetchEstimate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeNiceToHaves]);

  const breakdownRows = estimate?.breakdown ?? [
    { category: "Materials", pct: 45, lowAmount: 0, highAmount: 0 },
    { category: "Labor", pct: 35, lowAmount: 0, highAmount: 0 },
    { category: "Permits & Fees", pct: 5, lowAmount: 0, highAmount: 0 },
    { category: "Contingency", pct: 10, lowAmount: 0, highAmount: 0 },
    { category: "Design & Planning", pct: 5, lowAmount: 0, highAmount: 0 },
  ];

  const pieSegments = breakdownRows.map((item, i) => {
    const midAmount = item.lowAmount > 0 ? Math.round((item.lowAmount + item.highAmount) / 2) : null;
    return {
      pct: item.pct,
      color: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length],
      label: item.category,
      amount: midAmount !== null ? formatCurrency(midAmount) : undefined,
    };
  });

  // Dynamic budget warning — recomputes on every render so switching tiers updates instantly
  const dynamicWarning = useMemo(() => {
    if (!estimate || selectedAmount == null || selectedAmount <= 0) return null;
    if (selectedAmount < estimate.estimatedLow) {
      const midpoint = (estimate.estimatedLow + estimate.estimatedHigh) / 2;
      const pctBelow = Math.round(((estimate.estimatedLow - selectedAmount) / midpoint) * 100);
      return (
        `Your budget of ${formatCurrency(selectedAmount)} is about ${pctBelow}% below our estimated range ` +
        `(${formatCurrency(estimate.estimatedLow)}–${formatCurrency(estimate.estimatedHigh)}). ` +
        `Consider increasing your budget or reducing scope to avoid mid-project cost surprises.`
      );
    }
    if (selectedAmount > estimate.estimatedHigh) {
      return (
        `Your budget of ${formatCurrency(selectedAmount)} exceeds our estimated range ` +
        `(${formatCurrency(estimate.estimatedLow)}–${formatCurrency(estimate.estimatedHigh)}). ` +
        `You have room to upgrade materials or add nice-to-haves.`
      );
    }
    return null;
  }, [estimate, selectedAmount]);

  return (
    <div className="space-y-10">
      {/* ── Question 1: Bathroom Size ── */}
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a2e]">What is the size?</h2>
        <p className="mt-2 text-sm text-[#6a6a7a]">
          Choose the category that best matches your space.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {BATHROOM_SIZES.map((s) => {
            const sizeIcon = {
              "half-bath": <FaToilet className="text-lg" />,
              "three-quarter": <FaShower className="text-lg" />,
              "full-bath": <FaBath className="text-lg" />,
              primary: <FaCrown className="text-lg" />,
            }[s.id];
            return (
              <button
                key={s.id}
                onClick={() => {
                  setBathroomSize(s.id);
                  estimateFetchedRef.current = false;
                }}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  bathroomSize === s.id
                    ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                    : "border-[#e8e6e1] hover:border-[#d5d3cd]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[#2d5a3d]">{sizeIcon}</span>
                    <div>
                      <div className="font-semibold text-[#1a1a2e]">{s.label}</div>
                      <div className="text-xs text-[#6a6a7a]">{s.desc}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-xs font-medium text-[#2d5a3d]">{s.sqft}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Question 2: Budget ── */}
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a2e]">What is your Budget?</h2>
        <p className="mt-2 text-sm text-[#6a6a7a]">
          Type a dollar amount for each tier, then pick the one you&apos;re aiming for.
        </p>

        <div className="mt-5 space-y-3">
          {tiers.map((t) => {
            const amount = budgetAmounts[t.id];
            return (
              <button
                key={t.id}
                onClick={() => setBudgetTier(t.id)}
                className={`flex w-full items-center gap-4 rounded-xl border-2 p-5 text-left transition ${
                  budgetTier === t.id
                    ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                    : "border-[#e8e6e1] hover:border-[#d5d3cd]"
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  budgetTier === t.id ? "border-[#2d5a3d]" : "border-[#d5d3cd]"
                }`}>
                  {budgetTier === t.id && <span className="h-2.5 w-2.5 rounded-full bg-[#2d5a3d]" />}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: t.color, color: '#fff' }}>
                  {t.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#1a1a2e]">{t.label}</div>
                  <div className="text-xs text-[#6a6a7a]">{t.desc}</div>
                </div>
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <FaDollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6a6a7a]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={amount != null ? amount.toLocaleString("en-US") : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      const val = raw === "" ? null : Math.max(0, Number(raw));
                      setBudgetAmounts(t.id, val);
                    }}
                    className="w-32 rounded-lg border border-[#d5d3cd] bg-white py-2 pl-7 pr-3 text-right text-sm font-semibold text-[#1a1a2e] outline-none focus:border-[#2d5a3d] focus:ring-1 focus:ring-[#2d5a3d]"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Estimated Breakdown (SmartAsset-style) ── */}
      {budgetTier && (
        <div className="rounded-xl bg-[#f8f7f4] p-6">
          {/* Header row: title + nice-to-haves toggle */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-bold text-[#1a1a2e]">Where is your money going?</h4>
              {estimateLoading && <FaSpinner className="animate-spin text-sm text-[#6a6a7a]" />}
            </div>
            {niceToHaves.length > 0 && (
              <button
                onClick={() => setIncludeNiceToHaves((v) => !v)}
                className="flex items-center gap-2 text-xs text-[#6a6a7a] hover:text-[#1a1a2e] transition"
              >
                <span>Include Nice-to-Haves</span>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${includeNiceToHaves ? "bg-[#2d5a3d]" : "bg-[#d5d3cd]"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${includeNiceToHaves ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>
            )}
          </div>

          {/* ── Our Estimate vs Your Budget header ── */}
          <div className="mb-5 flex items-stretch gap-3">
            {/* Our Estimate card */}
            <div className="flex-1 rounded-lg border border-[#2d5a3d]/20 bg-[#2d5a3d]/5 p-3">
              <div className="text-xs font-medium text-[#6a6a7a]">Our Estimated Range</div>
              <div className="mt-1 text-lg font-bold text-[#2d5a3d]">
                {estimate ? `${formatCurrency(estimate.estimatedLow)} – ${formatCurrency(estimate.estimatedHigh)}` : "—"}
              </div>
            </div>
            {/* Your Budget card */}
            {selectedAmount != null && (
              <div className={`flex-1 rounded-lg border p-3 ${
                estimate && selectedAmount < estimate.estimatedLow
                  ? "border-[#c0392b]/20 bg-[#c0392b]/5"
                  : estimate && selectedAmount > estimate.estimatedHigh
                    ? "border-[#2980b9]/20 bg-[#2980b9]/5"
                    : "border-[#e8e6e1] bg-white"
              }`}>
                <div className="text-xs font-medium text-[#6a6a7a]">Your Budget</div>
                <div className={`mt-1 text-lg font-bold ${
                  estimate && selectedAmount < estimate.estimatedLow
                    ? "text-[#c0392b]"
                    : estimate && selectedAmount > estimate.estimatedHigh
                      ? "text-[#2980b9]"
                      : "text-[#1a1a2e]"
                }`}>
                  {formatCurrency(selectedAmount)}
                </div>
                {estimate && selectedAmount < estimate.estimatedLow && (
                  <div className="mt-0.5 text-[10px] font-medium text-[#c0392b]">Below estimated range</div>
                )}
                {estimate && selectedAmount > estimate.estimatedHigh && (
                  <div className="mt-0.5 text-[10px] font-medium text-[#2980b9]">Above estimated range</div>
                )}
              </div>
            )}
          </div>

          {/* Budget warning — dynamically computed from current selectedAmount */}
          {dynamicWarning && (
            <div className={`mb-5 flex items-start gap-3 rounded-lg border p-3 ${
              selectedAmount != null && estimate && selectedAmount < estimate.estimatedLow
                ? "border-[#e8a838]/40 bg-[#fef9ee]"
                : "border-[#2980b9]/30 bg-[#eef6fc]"
            }`}>
              <FaCircleExclamation className={`mt-0.5 shrink-0 text-base ${
                selectedAmount != null && estimate && selectedAmount < estimate.estimatedLow
                  ? "text-[#d4956a]"
                  : "text-[#2980b9]"
              }`} />
              <p className="text-xs leading-relaxed text-[#4a4a5a]">{dynamicWarning}</p>
            </div>
          )}

          {/* ── Chart + Table layout ── */}
          <div className="flex items-start gap-6">
            {/* Table side */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center border-b-2 border-[#1a1a2e] pb-2 mb-1">
                <span className="flex-1 text-sm font-bold text-[#1a1a2e]">Estimated Budget</span>
                <span className="w-28 text-right text-sm font-bold text-[#1a1a2e]">
                  {estimate ? formatCurrency((estimate.estimatedLow + estimate.estimatedHigh) / 2) : "—"}
                </span>
              </div>

              {/* Breakdown rows */}
              {breakdownRows.map((item, i) => {
                const midAmount = item.lowAmount > 0
                  ? Math.round((item.lowAmount + item.highAmount) / 2)
                  : null;
                return (
                  <div key={item.category} className="flex items-center border-b border-[#e8e6e1] py-2.5 group hover:bg-[#e8e6e1]/40 -mx-2 px-2 rounded transition">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ backgroundColor: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }}
                      />
                      <span className="text-sm text-[#1a1a2e]">{item.category}</span>
                    </div>
                    <span className="w-16 text-right text-sm text-[#6a6a7a]">{item.pct}%</span>
                    <span className="w-28 text-right text-sm font-medium text-[#1a1a2e]">
                      {midAmount !== null ? formatCurrency(midAmount) : "—"}
                    </span>
                  </div>
                );
              })}

              {/* Total row */}
              <div className="flex items-center pt-3 mt-1">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="h-3 w-3 shrink-0" />
                  <span className="text-sm font-bold text-[#2d5a3d]">Estimated Total</span>
                </div>
                <span className="w-16" />
                <span className="w-28 text-right text-sm font-bold text-[#2d5a3d]">
                  {estimate
                    ? `${formatCurrency(estimate.estimatedLow)} – ${formatCurrency(estimate.estimatedHigh)}`
                    : "—"}
                </span>
              </div>
            </div>

            {/* Pie chart side */}
            <div className="hidden sm:flex shrink-0 items-center justify-center">
              <PieChart segments={pieSegments} size={180} />
            </div>
          </div>

          {/* Engine rationale */}
          {estimate?.rationale && (
            <p className="mt-4 text-xs leading-relaxed text-[#6a6a7a] italic border-t border-[#e8e6e1] pt-3">{estimate.rationale}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Moodboard Step (discover items + moodboard view) ── */

function MoodboardStep({ pointedItems, setPointedItems, manualProducts, setManualProducts, dragPositions, setDragPositions }: {
  pointedItems: Record<string, PointedItem[]>;
  setPointedItems: React.Dispatch<React.SetStateAction<Record<string, PointedItem[]>>>;
  manualProducts: Product[];
  setManualProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  dragPositions: Record<number, { x: number; y: number }>;
  setDragPositions: React.Dispatch<React.SetStateAction<Record<number, { x: number; y: number }>>>;
}) {
  const { items, removeItem } = useMoodboardStore();
  const [activeSection, setActiveSection] = useState<"discover" | "moodboard">("discover");
  const [selectingImageId, setSelectingImageId] = useState<string | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Manual product link input state
  const [manualLinkUrl, setManualLinkUrl] = useState("");
  const [manualLinkLoading, setManualLinkLoading] = useState(false);
  const [manualLinkError, setManualLinkError] = useState<string | null>(null);

  // Draggable moodboard canvas state
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const getDefaultPosition = (idx: number, total: number, cw: number, ch: number) => {
    const cols = total <= 2 ? total : total <= 4 ? 2 : 3;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cellW = cw / cols;
    const cellH = ch / Math.ceil(total / cols);
    return { x: col * cellW + (cellW - 180) / 2, y: row * cellH + (cellH - 180) / 2 };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pos = dragPositions[idx] || getDefaultPosition(idx, selectedProducts.length, rect.width, rect.height);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setDraggingIdx(idx);
  };

  useEffect(() => {
    if (draggingIdx === null) return;
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - 180, e.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(rect.height - 180, e.clientY - dragOffset.current.y));
      setDragPositions(prev => ({ ...prev, [draggingIdx]: { x, y } }));
    };
    const handleUp = () => setDraggingIdx(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [draggingIdx]);

  const totalFoundItems = Object.values(pointedItems).flat().filter(p => !p.loading).length;
  const selectedProducts = [
    ...Object.values(pointedItems).flat()
      .filter(p => p.selectedProductIdx !== null && p.products[p.selectedProductIdx!])
      .map(p => p.products[p.selectedProductIdx!]),
    ...manualProducts,
  ];

  /* ── Drawing handlers for bounding-box selection ── */
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, imageId: string) => {
    if (selectingImageId !== imageId) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDrawStart({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
    setDrawCurrent(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawStart || !selectingImageId) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDrawCurrent({
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    });
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLDivElement>, imageId: string, imageUrl: string) => {
    if (!drawStart || !drawCurrent || selectingImageId !== imageId) return;
    e.preventDefault();
    const box = {
      x: Math.min(drawStart.x, drawCurrent.x),
      y: Math.min(drawStart.y, drawCurrent.y),
      w: Math.abs(drawCurrent.x - drawStart.x),
      h: Math.abs(drawCurrent.y - drawStart.y),
    };
    setDrawStart(null);
    setDrawCurrent(null);
    setSelectingImageId(null);

    if (box.w < 0.03 || box.h < 0.03) return; // skip accidental clicks

    const pointedId = `${imageId}-${Date.now()}`;
    const newItem: PointedItem = { id: pointedId, cropBox: box, label: "Identifying...", loading: true, products: [], selectedProductIdx: null };
    setPointedItems(prev => ({ ...prev, [imageId]: [...(prev[imageId] || []), newItem] }));

    try {
      const res = await fetch("/api/ai/identify-and-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, cropBox: box }),
      });
      const data = await res.json();
      setPointedItems(prev => ({
        ...prev,
        [imageId]: (prev[imageId] || []).map(item =>
          item.id === pointedId ? { ...item, label: data.label || "Unknown item", loading: false, products: data.products || [] } : item
        ),
      }));
    } catch {
      setPointedItems(prev => ({
        ...prev,
        [imageId]: (prev[imageId] || []).map(item =>
          item.id === pointedId ? { ...item, label: "Could not identify", loading: false, products: [] } : item
        ),
      }));
    }
  };

  const removePointedItem = (imageId: string, pointedId: string) => {
    setPointedItems(prev => ({ ...prev, [imageId]: (prev[imageId] || []).filter(item => item.id !== pointedId) }));
  };

  const toggleProductSelection = (imageId: string, pointedId: string, productIdx: number) => {
    setPointedItems(prev => ({
      ...prev,
      [imageId]: (prev[imageId] || []).map(item =>
        item.id === pointedId
          ? { ...item, selectedProductIdx: item.selectedProductIdx === productIdx ? null : productIdx }
          : item
      ),
    }));
  };

  const handleManualLinkSubmit = async () => {
    if (!manualLinkUrl.trim()) return;
    setManualLinkLoading(true);
    setManualLinkError(null);
    try {
      const res = await fetch("/api/ai/fetch-product-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: manualLinkUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setManualLinkError(data.error || "Could not pull the item from the link. There is an error.");
      } else {
        setManualProducts(prev => [...prev, data]);
        setManualLinkUrl("");
      }
    } catch {
      setManualLinkError("Could not pull the item from the link. There is an error.");
    } finally {
      setManualLinkLoading(false);
    }
  };

  const removeManualProduct = (idx: number) => {
    setManualProducts(prev => prev.filter((_, i) => i !== idx));
  };

  const selectionRect = drawStart && drawCurrent ? {
    left: `${Math.min(drawStart.x, drawCurrent.x) * 100}%`,
    top: `${Math.min(drawStart.y, drawCurrent.y) * 100}%`,
    width: `${Math.abs(drawCurrent.x - drawStart.x) * 100}%`,
    height: `${Math.abs(drawCurrent.y - drawStart.y) * 100}%`,
  } : null;

  return (
    <div>
      {/* Section switcher */}
      <div className="flex gap-1 rounded-xl bg-[#f8f7f4] p-1">
        <button
          onClick={() => setActiveSection("discover")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeSection === "discover" ? "bg-white text-[#2d5a3d] shadow-sm" : "text-[#6a6a7a] hover:text-[#4a4a5a]"
          }`}
        >
          <FaCrosshairs className="text-xs" />
          Discover Items You Want
        </button>
        <button
          onClick={() => setActiveSection("moodboard")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeSection === "moodboard" ? "bg-white text-[#2d5a3d] shadow-sm" : "text-[#6a6a7a] hover:text-[#4a4a5a]"
          }`}
        >
          <FaImages className="text-xs" />
          Moodboard
          {totalFoundItems > 0 && (
            <span className="rounded-full bg-[#2d5a3d]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#2d5a3d]">{totalFoundItems}</span>
          )}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-[#e8e6e1] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#1a1a2e]">Remove from Moodboard?</h3>
            <p className="mt-2 text-sm text-[#6a6a7a]">This will also remove any identified items for this image.</p>
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
                  setPointedItems(prev => { const next = { ...prev }; delete next[confirmDeleteId]; return next; });
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

      {/* ── SECTION: Discover Items You Want ── */}
      {activeSection === "discover" && (
        <div className="mt-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a2e]">Discover the Items You Want</h2>
              <p className="mt-2 text-sm text-[#6a6a7a]">
                Draw a box around any item in your inspiration photos. We&apos;ll identify it and find where to buy it online.
              </p>
            </div>
            {items.length > 0 && (
              <Link
                href="/explore?from=moodboard"
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2d5a3d] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#234a31]"
              >
                <FaPlus className="text-[10px]" /> Add More from Explore
              </Link>
            )}
          </div>

          {items.length === 0 ? (
            <Link
              href="/explore?from=moodboard"
              className="mt-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#d5d3cd] p-10 transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5"
            >
              <FaImages className="text-3xl text-[#9a9aaa]" />
              <span className="text-sm font-medium text-[#6a6a7a]">No images saved yet &mdash; go to Explore to build your moodboard</span>
              <span className="flex items-center gap-1.5 rounded-lg bg-[#2d5a3d] px-4 py-2 text-xs font-semibold text-white">
                <FaCompass className="text-[10px]" /> Open Explore
              </span>
            </Link>
          ) : (
            <div className="mt-6 space-y-6">
              {items.map((item) => {
                const pointed = pointedItems[item.id] || [];
                const isSelecting = selectingImageId === item.id;

                return (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-[#e8e6e1]">
                    {/* Action bar */}
                    <div className="flex items-center justify-end border-b border-[#e8e6e1] bg-[#faf9f6] px-5 py-3">
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-[#9a9aaa] transition hover:bg-red-50 hover:text-red-500"
                      >
                        <FaTrash className="text-[10px]" /> Remove
                      </button>
                    </div>

                    <div className="flex">
                      {/* LEFT: Image + Point-out button */}
                      <div className="w-1/2 border-r border-[#e8e6e1] p-4">
                        <div
                          className={`relative select-none overflow-hidden rounded-xl ${isSelecting ? "cursor-crosshair ring-2 ring-[#2d5a3d] ring-offset-2" : ""}`}
                          onMouseDown={(e) => handleMouseDown(e, item.id)}
                          onMouseMove={handleMouseMove}
                          onMouseUp={(e) => handleMouseUp(e, item.id, item.imageUrl)}
                          onMouseLeave={() => { if (isSelecting) { setDrawStart(null); setDrawCurrent(null); } }}
                        >
                          <Image
                            src={item.imageUrl}
                            alt={item.title || "Inspiration"}
                            width={600}
                            height={450}
                            className="h-auto w-full rounded-xl object-cover"
                            unoptimized
                            draggable={false}
                          />

                          {/* Active drawing rectangle */}
                          {isSelecting && selectionRect && (
                            <div
                              className="pointer-events-none absolute border-2 border-dashed border-[#2d5a3d] bg-[#2d5a3d]/15"
                              style={selectionRect}
                            />
                          )}

                          {/* Existing bounding boxes */}
                          {pointed.map((pi, idx) => (
                            <div
                              key={pi.id}
                              className="pointer-events-none absolute border-2 border-[#2d5a3d] bg-[#2d5a3d]/10"
                              style={{
                                left: `${pi.cropBox.x * 100}%`,
                                top: `${pi.cropBox.y * 100}%`,
                                width: `${pi.cropBox.w * 100}%`,
                                height: `${pi.cropBox.h * 100}%`,
                              }}
                            >
                              <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-[#2d5a3d] px-1.5 py-0.5 text-[9px] font-medium text-white shadow-sm">
                                {pi.loading ? "Identifying..." : `${idx + 1}. ${pi.label}`}
                              </span>
                            </div>
                          ))}

                          {/* Selection mode hint overlay */}
                          {isSelecting && !drawStart && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/5">
                              <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-[#2d5a3d] shadow-md">
                                Click &amp; drag to select an item
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectingImageId(isSelecting ? null : item.id)}
                          className={`mt-3 flex w-fit items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                            isSelecting
                              ? "bg-[#2d5a3d] text-white shadow-md"
                              : "border-2 border-[#2d5a3d] text-[#2d5a3d] hover:bg-[#2d5a3d]/5"
                          }`}
                        >
                          <FaMagnifyingGlass className="text-xs" />
                          {isSelecting ? "Drawing mode \u2014 cancel" : "Point out the Item"}
                        </button>
                      </div>

                      {/* RIGHT: Found items & products */}
                      <div className="w-1/2 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">
                          Items to Buy
                          {pointed.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-[#6a6a7a]">({pointed.length} found)</span>
                          )}
                        </h4>

                        {pointed.length === 0 ? (
                          <div className="flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8e6e1] text-center">
                            <FaCartShopping className="mb-2 text-2xl text-[#d5d3cd]" />
                            <p className="text-xs text-[#9a9aaa]">
                              Point out items in the image<br />to find them online
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
                            {pointed.map((pi, idx) => (
                              <div key={pi.id} className="rounded-xl border border-[#e8e6e1] p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2d5a3d] text-[9px] font-bold text-white">{idx + 1}</span>
                                    {pi.loading ? (
                                      <span className="flex items-center gap-1.5 text-xs text-[#6a6a7a]">
                                        <FaSpinner className="animate-spin text-[10px]" /> Identifying...
                                      </span>
                                    ) : pi.label === "Unknown item" || pi.label === "Could not identify" ? (
                                      <span className="text-xs text-red-400">Could not identify this item. Try a tighter selection.</span>
                                    ) : (
                                      <span className="text-sm font-medium text-[#1a1a2e]">{pi.label}</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removePointedItem(item.id, pi.id)}
                                    className="text-[10px] text-[#9a9aaa] transition hover:text-red-500"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>

                                {!pi.loading && pi.products.length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    {pi.products.slice(0, 4).map((p, i) => {
                                      const isSelected = pi.selectedProductIdx === i;
                                      return (
                                        <div
                                          key={i}
                                          onClick={() => toggleProductSelection(item.id, pi.id, i)}
                                          className={`flex cursor-pointer gap-2 rounded-lg border p-2 transition ${
                                            isSelected
                                              ? "border-[#2d5a3d] bg-[#2d5a3d]/5 ring-1 ring-[#2d5a3d]/20"
                                              : "border-[#e8e6e1] hover:bg-[#f8f7f4]"
                                          }`}
                                        >
                                          {/* Radio circle */}
                                          <div className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                            isSelected
                                              ? "border-[#2d5a3d] bg-[#2d5a3d]"
                                              : "border-[#d5d3cd]"
                                          }`}>
                                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                          </div>
                                          {p.thumbnail && (
                                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-[#f8f7f4]">
                                              <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="40px" unoptimized />
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-[11px] font-medium text-[#1a1a2e]">{p.title}</p>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-[#6a6a7a]">{p.source}</span>
                                              {p.price && <span className="text-[11px] font-semibold text-[#2d5a3d]">{p.price}</span>}
                                            </div>
                                          </div>
                                          <a
                                            href={p.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-1 shrink-0 text-[9px] text-[#9a9aaa] transition hover:text-[#2d5a3d]"
                                          >
                                            <FaArrowUpRightFromSquare />
                                          </a>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {!pi.loading && pi.products.length === 0 && (
                                  <p className="mt-1 text-[11px] text-[#9a9aaa]">No matching products found.</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Manual product link input */}
              <div className="rounded-2xl border border-[#e8e6e1] p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
                  <FaLink className="text-xs text-[#2d5a3d]" />
                  Add an Item by Link
                </h3>
                <p className="mt-1 text-xs text-[#9a9aaa]">Paste a product URL to add it directly to your moodboard.</p>

                <div className="mt-3 flex gap-2">
                  <input
                    type="url"
                    value={manualLinkUrl}
                    onChange={(e) => { setManualLinkUrl(e.target.value); setManualLinkError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleManualLinkSubmit(); }}
                    placeholder="https://www.example.com/product..."
                    className="min-w-0 flex-1 rounded-lg border border-[#d5d3cd] px-3 py-2 text-sm text-[#1a1a2e] placeholder:text-[#c5c3bd] focus:border-[#2d5a3d] focus:outline-none focus:ring-1 focus:ring-[#2d5a3d]"
                  />
                  <button
                    onClick={handleManualLinkSubmit}
                    disabled={manualLinkLoading || !manualLinkUrl.trim()}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2d5a3d] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#234a31] disabled:opacity-50"
                  >
                    {manualLinkLoading ? <FaSpinner className="animate-spin text-xs" /> : <FaPlus className="text-[10px]" />}
                    {manualLinkLoading ? "Fetching..." : "Add"}
                  </button>
                </div>

                {manualLinkError && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                    <FaCircleExclamation className="text-[10px]" />
                    {manualLinkError}
                  </div>
                )}

                {manualProducts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-[#6a6a7a]">Added Items ({manualProducts.length})</p>
                    {manualProducts.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-[#e8e6e1] p-3">
                        {p.thumbnail && (
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f8f7f4]">
                            <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="48px" unoptimized />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-[#1a1a2e]">{p.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#6a6a7a]">{p.source}</span>
                            {p.price && <span className="text-xs font-semibold text-[#2d5a3d]">{p.price}</span>}
                          </div>
                        </div>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[10px] text-[#9a9aaa] transition hover:text-[#2d5a3d]"
                        >
                          <FaArrowUpRightFromSquare />
                        </a>
                        <button
                          onClick={() => removeManualProduct(i)}
                          className="shrink-0 text-[10px] text-[#9a9aaa] transition hover:text-red-500"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit to moodboard */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setActiveSection("moodboard")}
                  className="flex items-center gap-2.5 rounded-xl bg-[#2d5a3d] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2d5a3d]/20 transition hover:bg-[#234a31] hover:shadow-xl"
                >
                  <FaImages className="text-sm" />
                  View Moodboard
                  {totalFoundItems > 0 && (
                    <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">{totalFoundItems} items</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION: Moodboard ── */}
      {activeSection === "moodboard" && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a2e]">Your Moodboard</h2>
              <p className="mt-1 text-sm text-[#6a6a7a]">Your selected items arranged on a style board.</p>
            </div>
            <button
              onClick={() => setActiveSection("discover")}
              className="flex items-center gap-1.5 rounded-lg border border-[#d5d3cd] px-3 py-1.5 text-xs font-medium text-[#4a4a5a] transition hover:bg-[#f8f7f4]"
            >
              <FaArrowLeft className="text-[9px]" /> Back to Discover
            </button>
          </div>

          {/* White canvas moodboard */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white shadow-sm">
            {selectedProducts.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center text-center">
                <FaImages className="mb-3 text-4xl text-[#e8e6e1]" />
                <p className="text-sm font-medium text-[#9a9aaa]">No items selected yet</p>
                <p className="mt-1 text-xs text-[#c5c3bd]">
                  Go to Discover, point out items, and select a product for each.
                </p>
                <button
                  onClick={() => setActiveSection("discover")}
                  className="mt-4 flex items-center gap-1.5 rounded-lg bg-[#2d5a3d] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#234a31]"
                >
                  <FaCrosshairs className="text-[10px]" /> Start Discovering
                </button>
              </div>
            ) : (
              <div
                ref={canvasRef}
                className="relative h-[520px] select-none"
                style={{ cursor: draggingIdx !== null ? "grabbing" : "default" }}
              >
                {selectedProducts.map((p, i) => {
                  const canvas = canvasRef.current;
                  const pos = dragPositions[i] || (canvas
                    ? getDefaultPosition(i, selectedProducts.length, canvas.clientWidth, canvas.clientHeight)
                    : { x: 30 + i * 200, y: 30 });

                  return (
                    <div
                      key={i}
                      className={`absolute transition-shadow duration-150 ${draggingIdx === i ? "z-20 shadow-lg" : "z-10 hover:shadow-md"}`}
                      style={{ left: pos.x, top: pos.y, cursor: draggingIdx === i ? "grabbing" : "grab" }}
                      onMouseDown={(e) => handleCanvasMouseDown(e, i)}
                    >
                      {p.thumbnail ? (
                        <div className="relative h-[180px] w-[180px]">
                          <Image
                            src={p.thumbnail}
                            alt={p.title}
                            fill
                            className="object-contain"
                            sizes="180px"
                            draggable={false}
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-[180px] w-[180px] items-center justify-center rounded-lg bg-[#f8f7f4]">
                          <FaCartShopping className="text-2xl text-[#d5d3cd]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shopping List */}
          {selectedProducts.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1a1a2e]">
                <FaCartShopping className="text-[#2d5a3d]" /> Your Shopping List
                <span className="rounded-full bg-[#2d5a3d]/10 px-2 py-0.5 text-xs font-medium text-[#2d5a3d]">{selectedProducts.length}</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedProducts.map((p, i) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 rounded-xl border border-[#e8e6e1] p-3 transition hover:border-[#2d5a3d]/30 hover:shadow-sm"
                  >
                    {p.thumbnail && (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f8f7f4]">
                        <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="56px" unoptimized />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium text-[#1a1a2e]">{p.title}</p>
                      <p className="mt-0.5 text-[10px] text-[#6a6a7a]">{p.source}</p>
                      {p.price && <p className="mt-0.5 text-sm font-semibold text-[#2d5a3d]">{p.price}</p>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Browse more */}
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
        <SummaryRow label="Size" value={BATHROOM_SIZES.find(s => s.id === store.bathroomSize)?.label || store.bathroomSize} />
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
