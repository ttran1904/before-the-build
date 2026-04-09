"use client";

import { useState, useRef, useCallback, useMemo, useEffect, Suspense } from "react";
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
  FaExpand, FaSwatchbook, FaCartShopping, FaSpinner, FaCrosshairs, FaHandPointer,
  FaLink, FaCircleExclamation, FaXmark, FaChevronLeft, FaChevronRight, FaCircleInfo,
  FaDollarSign, FaSackDollar, FaGem,
  FaToilet, FaShower, FaBath, FaCrown,
  FaCamera, FaUpload, FaPhotoFilm, FaFilePdf,
  FaChevronDown, FaChevronUp, FaTableList, FaChartPie,
} from "react-icons/fa6";
import { useWizardStore, useMoodboardStore, type BathroomScope, type BudgetTier, type MoodboardItem } from "@/lib/store";
import { BATHROOM_SIZES } from "@/lib/room-sizes/bathroom";
import { computeBudgetGraph, type BudgetGraphResult } from "@/lib/budget-engine/budget-graph";
import type { PointedItem, Product } from "@/lib/moodboard/types";
import Link from "next/link";
import type { DesignStyle } from "@before-the-build/shared";
import CatalogueView from "@/components/CatalogueView";

/* ── Slot-machine animated number ──
 * Rules:
 *  1. Each digit animates independently with its own slide
 *  2. Digits slide vertically from below when they change
 *  3. Stagger delay: each position from left to right gets +50ms
 *  4. Duration: 400ms with ease-out for satisfying deceleration
 *  5. Only changed digits re-animate; unchanged digits stay still
 *  6. Non-digit chars ($, comma, spaces, –) don't animate
 */
function SlotNumber({ value, className = "" }: { value: string; className?: string }) {
  const prevRef = useRef(value);
  const chars = value.split("");
  const prevChars = prevRef.current.split("");

  useEffect(() => {
    prevRef.current = value;
  }, [value]);

  return (
    <span className={`inline-flex ${className}`}>
      {chars.map((char, i) => {
        const changed = prevChars[i] !== char;
        const isDigit = /\d/.test(char);
        return isDigit ? (
          <SlotDigit key={`pos-${i}`} char={char} delay={i * 50} animate={changed} />
        ) : (
          <span key={`pos-${i}`} className="inline-block">{char}</span>
        );
      })}
    </span>
  );
}

function SlotDigit({ char, delay, animate }: { char: string; delay: number; animate: boolean }) {
  const [sliding, setSliding] = useState(animate);
  const [show, setShow] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    setSliding(true);
    setShow(false);
    const t = setTimeout(() => {
      setShow(true);
      setSliding(false);
    }, delay + 10);
    return () => clearTimeout(t);
  }, [char, animate, delay]);

  return (
    <span className="inline-block overflow-hidden relative" style={{ width: "0.6em" }}>
      <span
        className="inline-block transition-all ease-out text-center w-full"
        style={{
          transitionDuration: "400ms",
          transform: show ? "translateY(0)" : "translateY(100%)",
          opacity: show ? 1 : 0,
        }}
      >
        {char}
      </span>
    </span>
  );
}

/* ── Step definitions ── */
const STEPS = [
  { id: "goal", label: "Goal", icon: FaBullseye },
  { id: "must-haves", label: "Must-Haves", icon: FaClipboardList },
  { id: "budget", label: "Budget", icon: FaCoins },
  { id: "items-pictures", label: "From Pictures", icon: FaCrosshairs, section: "items-materials" },
  { id: "catalogue", label: "From Catalogue", icon: FaSwatchbook, section: "items-materials" },
  { id: "moodboard", label: "Moodboard", icon: FaImages, section: "visualize" },
  { id: "mockup", label: "Real Mockup", icon: FaCamera, section: "visualize" },
  { id: "timeline", label: "Timeline", icon: FaCalendarDays },
  { id: "contractor", label: "Contractor", icon: FaHelmetSafety },
  { id: "summary", label: "Build Book", icon: FaListCheck },
];

const SECTION_HEADERS: Record<string, { label: string; icon: typeof FaBullseye }> = {
  "items-materials": { label: "Items & Materials", icon: FaCartShopping },
  visualize: { label: "Visualize", icon: FaPaintbrush },
};

/* ── Dirty-check: build a hash string of inputs that drive AI calls ── */
function wizardInputHash(s: { goals: string[]; scope: BathroomScope | null; mustHaves: string[]; niceToHaves: string[]; budgetTier: BudgetTier | null; bathroomSize: string; style: DesignStyle | null }) {
  return [s.goals.join(","), s.scope, s.mustHaves.join(","), s.niceToHaves.join(","), s.budgetTier, s.bathroomSize, s.style].join("|");
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
  yearsInBusiness?: string;
}

export default function BathroomWizardPage() {
  return (
    <Suspense>
      <BathroomWizardPageContent />
    </Suspense>
  );
}

function BathroomWizardPageContent() {
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

  /* Moodboard state — persisted in Zustand store */
  const moodboardPointedItems = store.moodboardPointedItems;
  const setMoodboardPointedItems = store.setMoodboardPointedItems;
  const moodboardManualProducts = store.moodboardManualProducts;
  const setMoodboardManualProducts = store.setMoodboardManualProducts;
  const moodboardDragPositions = store.moodboardDragPositions;
  const setMoodboardDragPositions = store.setMoodboardDragPositions;

  /* Budget sub-step: 0 = ideal budget, 1 = room size */
  const [budgetSubStep, setBudgetSubStep] = useState(0);

  /* Budget Builder — deterministic graph engine */
  const [budgetBuilderOpen, setBudgetBuilderOpen] = useState(false);
  const [includeNiceToHaves, setIncludeNiceToHaves] = useState(true);

  /* Items Checklist — computed from moodboard pointed items */
  const allPointedFlat = useMemo(() => Object.values(moodboardPointedItems).flat(), [moodboardPointedItems]);

  const matchedLabels = useMemo(() => {
    const set = new Set<string>();
    for (const pi of allPointedFlat) {
      if (pi.matchedItemLabel && pi.selectedProductIdx !== null) {
        set.add(pi.matchedItemLabel);
      }
    }
    return set;
  }, [allPointedFlat]);

  const unmatchedItems = useMemo(() =>
    allPointedFlat.filter((pi) => !pi.loading && !pi.matchedItemLabel && pi.selectedProductIdx !== null),
  [allPointedFlat]);

  /* Budget — nice-to-haves only included when matched in moodboard */
  const budgetGraph: BudgetGraphResult = useMemo(() => computeBudgetGraph({
    roomSize: store.bathroomSize,
    scope: store.scope,
    mustHaves: store.mustHaves,
    niceToHaves: store.niceToHaves.filter(nh => matchedLabels.has(nh)),
    includeNiceToHaves,
    customerBudget: store.budgetAmount,
    priceOverrides: store.priceOverrides,
  }), [store.bathroomSize, store.scope, store.mustHaves, store.niceToHaves, store.budgetAmount, store.priceOverrides, includeNiceToHaves, matchedLabels]);

  const currentHash = useMemo(() => wizardInputHash(store), [store.goals, store.scope, store.mustHaves, store.niceToHaves, store.budgetTier, store.bathroomSize, store.style]);

  /* Fetch timeline — only if inputs changed */
  const fetchTimeline = useCallback(async () => {
    if (currentHash === timelineHashRef.current && timelineTasks.length > 0) return;
    setTimelineLoading(true);
    try {
      const res = await fetch("/api/ai/generate-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: store.goals.join(", "), scope: store.scope, budgetTier: store.budgetTier,
          bathroomSize: store.bathroomSize, mustHaves: store.mustHaves, style: store.style,
        }),
      });
      const data = await res.json();
      setTimelineTasks(data.tasks || []);
      timelineHashRef.current = currentHash;
    } catch { /* keep existing data */ }
    setTimelineLoading(false);
  }, [currentHash, store.goals, store.scope, store.budgetTier, store.bathroomSize, store.mustHaves, store.style, timelineTasks.length]);

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
    // Budget step has 2 sub-steps: budget amount (0) then room size (1)
    if (currentStep === 2 && budgetSubStep === 0) {
      setBudgetSubStep(1);
      return;
    }
    const nextIdx = Math.min(currentStep + 1, STEPS.length - 1);
    if (STEPS[nextIdx]?.id === "timeline" && needsTimelineRefresh) fetchTimeline();
    if (STEPS[nextIdx]?.id === "contractor") { /* contractor step */ }
    if (currentStep === 2) setBudgetSubStep(0);
    setCurrentStep(nextIdx);
  };
  const back = () => {
    if (currentStep === 2 && budgetSubStep === 1) {
      setBudgetSubStep(0);
      return;
    }
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen bg-[#f8f7f4]">
      {/* ── Green left sidebar ── */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[#2d5a3d]">
        {/* Brand */}
        <div className="px-6 pt-6 pb-1">
          <h1 className="text-lg font-bold text-white">Before The Build</h1>
          <p className="mt-0.5 text-xs text-white/60">Bathroom Renovation</p>
        </div>

        {/* Progress bar */}
        <div className="mx-6 mt-3 h-1 rounded-full bg-white/15">
          <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mx-6 mt-1.5 text-[10px] text-white/50">Step {currentStep + 1} of {STEPS.length}</p>

        {/* Step list */}
        <nav className="mt-3 flex-1 space-y-0.5 px-3 overflow-y-auto">
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const isSubStep = "section" in step;
            // Show section heading before first sub-step of a section
            const showSectionHeading = isSubStep && (i === 0 || (STEPS[i - 1] as { section?: string }).section !== (step as { section: string }).section);
            return (
              <div key={step.id}>
                {showSectionHeading && (() => {
                  const sectionConfig = SECTION_HEADERS[(step as { section: string }).section];
                  const SectionIcon = sectionConfig?.icon || FaBullseye;
                  return (
                    <div className="mt-4 mb-1 flex items-center gap-2 px-3 py-1">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/10">
                        <SectionIcon className="text-[10px] text-white/60" />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">{sectionConfig?.label || "Section"}</span>
                    </div>
                  );
                })()}
                <button
                  onClick={() => { if (done) { setCurrentStep(i); if (i === 2) setBudgetSubStep(0); } }}
                  className={`group flex w-full items-center gap-3 rounded-lg ${isSubStep ? "pl-8" : "pl-3"} pr-3 py-2 text-left transition ${
                    active
                      ? "bg-white/15 text-white"
                      : done
                        ? "cursor-pointer text-white/80 hover:bg-white/10"
                        : "text-white/35"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition ${
                    active
                      ? "bg-white text-[#2d5a3d]"
                      : done
                        ? "bg-white/25 text-white"
                        : "bg-white/10 text-white/40"
                  }`}>
                    {done ? <FaCheck className="text-[10px]" /> : <step.icon className="text-[10px]" />}
                  </span>
                  <span className={`${isSubStep ? "text-xs" : "text-sm"} font-medium`}>{step.label}</span>
                  {done && (
                    <FaCircleCheck className="ml-auto text-xs text-white/40" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Back to explore link */}
        <div className="px-6 py-4">
          <Link href="/explore" className="flex items-center gap-2 text-xs text-white/50 transition hover:text-white/80">
            <FaArrowLeft className="text-[10px]" /> Back to Explore
          </Link>
        </div>
      </aside>

      {/* ── Budget Builder Popout ── */}
      {budgetBuilderOpen && (
        <BudgetBuilderPopout
          graph={budgetGraph}
          customerBudget={store.budgetAmount}
          includeNiceToHaves={includeNiceToHaves}
          setIncludeNiceToHaves={setIncludeNiceToHaves}
          niceToHaveCount={store.niceToHaves.length}
          onClose={() => setBudgetBuilderOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Budget Estimator – sticky top bar */}
        <div className="sticky top-0 z-30 border-b border-[#e8e6e1] bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex items-center px-8 py-2.5">
            <button
              onClick={() => setBudgetBuilderOpen((v) => !v)}
              className="group flex items-center gap-3 rounded-lg border border-[#d5d3cd] bg-white px-4 py-2 shadow-sm transition hover:border-[#d4a24c] hover:shadow-md"
            >
              <FaSackDollar className="text-sm text-[#d4a24c]" />
              <span className="text-sm font-semibold text-[#3d3d3d]">Budget Estimate</span>
              <span className="mx-1 h-4 w-px bg-[#d5d3cd]" />
              <span className="text-base font-extrabold text-[#2d5a3d] tracking-tight">
                <SlotNumber value={`$${budgetGraph.estimatedLow.toLocaleString()}\u00A0\u2013\u00A0$${budgetGraph.estimatedHigh.toLocaleString()}`} />
              </span>
              <FaArrowUpRightFromSquare className="text-[9px] text-[#3d3d3d]/30 group-hover:text-[#d4a24c] transition" />
            </button>
          </div>
        </div>
        <div className={`mx-auto flex flex-1 flex-col justify-center px-8 py-10 ${currentStep === 8 ? "max-w-5xl" : [3, 4, 5, 6].includes(currentStep) ? "max-w-[1400px]" : currentStep === 1 || currentStep === 7 ? "max-w-6xl" : "max-w-3xl"} w-full ${[3, 4, 5, 6].includes(currentStep) && (store.mustHaves.length > 0 || store.niceToHaves.length > 0) ? "pr-[200px]" : ""}`}>
          {currentStep === 0 && <GoalStep />}
          {currentStep > 0 && (
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5">
            {currentStep === 1 && <MustHavesStep />}
            {currentStep === 2 && <BudgetStep subStep={budgetSubStep} />}
            {currentStep === 3 && <MoodboardStep view="items-pictures" pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} />}
            {currentStep === 4 && <MoodboardStep view="catalogue" pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} />}
            {currentStep === 5 && <MoodboardStep view="moodboard" pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} />}
            {currentStep === 6 && <MoodboardStep view="mockup" pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} />}
            {currentStep === 7 && <TimelineStep tasks={timelineTasks} loading={timelineLoading} />}
            {currentStep === 8 && <ContractorStep thumbtack={thumbtackResults} google={googleResults} loading={contractorLoading} zip={contractorZip} onZipChange={setContractorZip} onSearch={fetchContractors} />}
            {currentStep === 9 && <SummaryStep tasks={timelineTasks} contractorCount={thumbtackResults.length + googleResults.length} budgetGraph={budgetGraph} pointedItems={moodboardPointedItems} manualProducts={moodboardManualProducts} dragPositions={moodboardDragPositions} thumbtackResults={thumbtackResults} googleResults={googleResults} />}
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
                onClick={() => router.push("/build-book")}
                className="flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
              >
                <FaFilePdf className="text-xs" /> View Build Book
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ── Right sidebar: Items Checklist (Moodboard step only) ── */}
      {[3, 4, 5, 6].includes(currentStep) && (store.mustHaves.length > 0 || store.niceToHaves.length > 0) && (
        <div
          className="fixed z-20 flex items-center"
          style={{ top: "52px", right: "-16px", width: "200px", height: "calc(100vh - 52px)" }}
        >
          <div className="max-h-full overflow-y-auto pl-3">
            <aside className="rounded-l-2xl rounded-tr-none rounded-br-none border border-r-0 border-[#e8e6e1] bg-white shadow-lg shadow-black/5">
              <div className="px-5 pt-5 pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#1a1a2e]">
                  <FaClipboardList className="text-xs text-[#2d5a3d]" />
                  Your Items
                </h3>
                <p className="mt-0.5 text-xs text-[#9a9aaa]">Find products for each item</p>
              </div>

            <div className="px-5 pb-5 space-y-5">
              {/* Must-Haves */}
              {store.mustHaves.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#2d5a3d] uppercase tracking-wide">
                    <FaStar className="text-[10px]" /> Must-Haves
                  </h4>
                  <div className="mt-2 space-y-1.5">
                    {store.mustHaves.map((label) => {
                      const found = matchedLabels.has(label);
                      return (
                        <div key={label} className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all duration-500 ${found ? "bg-[#2d5a3d]/5" : ""}`}>
                          {found ? (
                            <FaCheck className="shrink-0 text-[10px] text-[#2d5a3d]" />
                          ) : (
                            <span className="shrink-0 text-[10px] text-red-300">✕</span>
                          )}
                          <span className={`flex-1 transition-all duration-500 ${found ? "text-[#2d5a3d]/50 line-through decoration-[#2d5a3d]/60 decoration-2" : "text-[#4a4a5a]"}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nice-to-Haves */}
              {store.niceToHaves.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#d4a24c] uppercase tracking-wide">
                    <FaStarHalfStroke className="text-[10px]" /> Nice-to-Haves
                  </h4>
                  <div className="mt-2 space-y-1.5">
                    {store.niceToHaves.map((label) => {
                      const found = matchedLabels.has(label);
                      return (
                        <div key={label} className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all duration-500 ${found ? "bg-[#d4a24c]/5" : ""}`}>
                          {found ? (
                            <FaCheck className="shrink-0 text-[10px] text-[#d4a24c]" />
                          ) : (
                            <span className="shrink-0 text-[10px] text-[#c5c3bd]">○</span>
                          )}
                          <span className={`flex-1 transition-all duration-500 ${found ? "text-[#d4a24c]/50 line-through decoration-[#d4a24c]/60 decoration-2" : "text-[#9a9aaa]"}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Items (unmatched from moodboard) */}
              {unmatchedItems.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#6a6a7a] uppercase tracking-wide">
                    <FaPlus className="text-[10px]" /> New Items
                  </h4>
                  <div className="mt-2 space-y-1.5">
                    {unmatchedItems.map((pi) => (
                      <div key={pi.id} className="flex items-center gap-2 rounded-lg bg-[#2d5a3d]/5 px-3 py-1.5 text-sm">
                        <FaCheck className="shrink-0 text-[10px] text-[#5b8c6e]" />
                        <span className="flex-1 text-[#4a4a5a] truncate">{pi.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="border-t border-[#e8e6e1] px-5 py-3">
              <div className="flex items-center justify-between text-xs text-[#6a6a7a]">
                <span>{matchedLabels.size}/{store.mustHaves.length + store.niceToHaves.length}</span>
                <span className="font-semibold text-[#2d5a3d]">{Math.round((matchedLabels.size / (store.mustHaves.length + store.niceToHaves.length)) * 100)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-[#e8e6e1]">
                <div
                  className="h-full rounded-full bg-[#2d5a3d] transition-all duration-500"
                  style={{ width: `${(matchedLabels.size / (store.mustHaves.length + store.niceToHaves.length)) * 100}%` }}
                />
              </div>
            </div>
          </aside>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Budget Builder Popout (thought-bubble dialogue from sidebar) ── */

const POPOUT_BREAKDOWN_COLORS = ["#2d5a3d", "#d4a24c", "#d4956a", "#5b8c6e", "#87CEEB"];

function BudgetBuilderPopout({
  graph,
  customerBudget,
  includeNiceToHaves,
  setIncludeNiceToHaves,
  niceToHaveCount,
  onClose,
}: {
  graph: BudgetGraphResult;
  customerBudget: number | null;
  includeNiceToHaves: boolean;
  setIncludeNiceToHaves: React.Dispatch<React.SetStateAction<boolean>>;
  niceToHaveCount: number;
  onClose: () => void;
}) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const pieSegments = graph.breakdown.map((item, i) => ({
    pct: item.pct,
    color: POPOUT_BREAKDOWN_COLORS[i % POPOUT_BREAKDOWN_COLORS.length],
    label: item.category,
    amount: formatCurrency(item.amount),
  }));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Popout — drops down from the top-bar Budget Estimate button */}
      <div
        className="fixed z-50 flex flex-col"
        style={{ left: "264px", top: "56px", width: "520px", maxHeight: "calc(100vh - 80px)" }}
      >
        {/* Triangle pointing up toward the trigger button */}
        <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 rounded-sm bg-white border-l border-t border-[#e8e6e1]" />

        {/* Main card */}
        <div className="relative overflow-y-auto rounded-2xl border border-[#e8e6e1] bg-white shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8e6e1] bg-white px-6 py-4">
            <div className="flex items-center gap-2">
              <FaCoins className="text-[#2d5a3d]" />
              <h3 className="text-lg font-bold text-[#1a1a2e]">Budget Builder</h3>
            </div>
            <div className="flex items-center gap-3">
              {niceToHaveCount > 0 && (
                <button
                  onClick={() => setIncludeNiceToHaves((v) => !v)}
                  className="flex items-center gap-2 text-xs text-[#6a6a7a] hover:text-[#1a1a2e] transition"
                >
                  <span>Nice-to-Haves</span>
                  <div className={`relative h-5 w-9 rounded-full transition-colors ${includeNiceToHaves ? "bg-[#2d5a3d]" : "bg-[#d5d3cd]"}`}>
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${includeNiceToHaves ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#6a6a7a] transition hover:bg-[#f0efeb] hover:text-[#1a1a2e]"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Budget comparison cards */}
            <div className="flex items-stretch gap-3">
              {/* Market estimate */}
              <div className="flex-1 rounded-lg border border-[#2d5a3d]/20 bg-[#2d5a3d]/5 p-3">
                <div className="text-xs font-medium text-[#6a6a7a]">Total Estimate</div>
                <div className="mt-1 text-lg font-bold text-[#2d5a3d]">
                  {formatCurrency(graph.estimatedLow)} – {formatCurrency(graph.estimatedHigh)}
                </div>
              </div>
              {/* Your budget */}
              {customerBudget != null && customerBudget > 0 && (
                <div className={`flex-1 rounded-lg border p-3 ${
                  customerBudget < graph.estimatedLow
                    ? "border-[#c0392b]/20 bg-[#c0392b]/5"
                    : customerBudget > graph.estimatedHigh
                      ? "border-[#2980b9]/20 bg-[#2980b9]/5"
                      : "border-[#e8e6e1] bg-white"
                }`}>
                  <div className="text-xs font-medium text-[#6a6a7a]">Your Budget</div>
                  <div className={`mt-1 text-lg font-bold ${
                    customerBudget < graph.estimatedLow
                      ? "text-[#c0392b]"
                      : customerBudget > graph.estimatedHigh
                        ? "text-[#2980b9]"
                        : "text-[#1a1a2e]"
                  }`}>
                    {formatCurrency(customerBudget)}
                  </div>
                  {customerBudget < graph.estimatedLow && (
                    <div className="mt-0.5 text-[10px] font-medium text-[#c0392b]">Below estimated range</div>
                  )}
                  {customerBudget > graph.estimatedHigh && (
                    <div className="mt-0.5 text-[10px] font-medium text-[#2980b9]">Above estimated range</div>
                  )}
                </div>
              )}
            </div>

            {/* Warning */}
            {graph.budgetWarning && (
              <div className={`flex items-start gap-3 rounded-lg border p-3 ${
                customerBudget != null && customerBudget < graph.estimatedLow
                  ? "border-[#e8a838]/40 bg-[#fef9ee]"
                  : "border-[#2980b9]/30 bg-[#eef6fc]"
              }`}>
                <FaCircleExclamation className={`mt-0.5 shrink-0 text-base ${
                  customerBudget != null && customerBudget < graph.estimatedLow
                    ? "text-[#d4956a]"
                    : "text-[#2980b9]"
                }`} />
                <p className="text-xs leading-relaxed text-[#4a4a5a]">{graph.budgetWarning}</p>
              </div>
            )}

            {/* Breakdown table + pie chart */}
            <div className="flex items-start gap-6">
              {/* Table */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center border-b-2 border-[#1a1a2e] pb-2 mb-1">
                  <span className="flex-1 text-sm font-bold text-[#1a1a2e]">Cost Breakdown</span>
                  <span className="w-32 text-right text-sm font-bold text-[#1a1a2e]">
                    {formatCurrency(graph.estimatedMid)}
                  </span>
                </div>

                {graph.breakdown.map((item, i) => {
                  const isFixed = item.lowAmount === item.highAmount;
                  return (
                    <div key={item.category} className="flex items-center border-b border-[#e8e6e1] py-2.5 group hover:bg-[#e8e6e1]/40 -mx-2 px-2 rounded transition">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span
                          className="h-3 w-3 rounded-sm shrink-0"
                          style={{ backgroundColor: POPOUT_BREAKDOWN_COLORS[i % POPOUT_BREAKDOWN_COLORS.length] }}
                        />
                        <span className="text-sm text-[#1a1a2e]">{item.category}</span>
                      </div>
                      <span className="w-12 text-right text-sm text-[#6a6a7a]">{item.pct}%</span>
                      <span className="w-32 text-right text-sm font-medium text-[#1a1a2e]">
                        {isFixed ? formatCurrency(item.amount) : `${formatCurrency(item.lowAmount)}–${formatCurrency(item.highAmount)}`}
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
                  <span className="w-12" />
                  <span className="w-32 text-right text-sm font-bold text-[#2d5a3d]">
                    {formatCurrency(graph.estimatedLow)} – {formatCurrency(graph.estimatedHigh)}
                  </span>
                </div>
              </div>

              {/* Pie chart */}
              <div className="shrink-0 flex items-center justify-center">
                <PieChart segments={pieSegments} size={160} />
              </div>
            </div>

            {/* Rationale */}
            <p className="text-xs leading-relaxed text-[#6a6a7a] italic border-t border-[#e8e6e1] pt-3">
              {graph.rationale}
            </p>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 rounded-lg border border-[#d4a24c]/30 bg-[#fef9ee] px-4 py-3">
              <FaCircleExclamation className="mt-0.5 shrink-0 text-xs text-[#d4a24c]" />
              <p className="text-[11px] leading-relaxed text-[#6a6a7a]">
                <span className="font-semibold text-[#4a4a5a]">Disclaimer:</span> These figures are <span className="font-semibold">estimates only</span> based on typical market rates and may vary depending on your location, contractor, materials chosen, and project complexity. Always obtain multiple quotes before committing.
              </p>
            </div>

            {/* Item-level breakdown */}
            {graph.itemBreakdown.length > 0 && (
              <div className="border-t border-[#e8e6e1] pt-4">
                <h4 className="text-sm font-bold text-[#1a1a2e] mb-3">Item Breakdown</h4>
                <div className="space-y-1">
                  <div className="flex items-center text-[10px] font-semibold text-[#6a6a7a] uppercase tracking-wide pb-1 border-b border-[#e8e6e1]">
                    <span className="flex-1">Item</span>
                    <span className="w-20 text-right">Material</span>
                    <span className="w-20 text-right">Labor</span>
                    <span className="w-24 text-right">Total</span>
                  </div>
                  {graph.itemBreakdown.map((item) => {
                    const matFixed = item.materialLow === item.materialHigh;
                    const labFixed = item.laborLow === item.laborHigh;
                    const totFixed = item.totalLow === item.totalHigh;
                    return (
                      <div key={item.label} className="flex items-center py-2 border-b border-[#e8e6e1]/50 group hover:bg-[#e8e6e1]/30 -mx-2 px-2 rounded transition">
                        <div className="flex-1 min-w-0 flex items-center gap-1.5">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${item.source === "must-have" ? "bg-[#2d5a3d]" : "bg-[#d4a24c]"}`} />
                          <span className="text-xs text-[#1a1a2e] truncate">{item.label}</span>
                          {item.overridden && (
                            <span className="shrink-0 rounded bg-[#2d5a3d]/10 px-1 py-0.5 text-[8px] font-semibold text-[#2d5a3d]">REAL</span>
                          )}
                        </div>
                        <span className="w-20 text-right text-[11px] text-[#6a6a7a]">
                          {matFixed ? formatCurrency(item.materialLow) : `${formatCurrency(item.materialLow)}–${formatCurrency(item.materialHigh)}`}
                        </span>
                        <span className="w-20 text-right text-[11px] text-[#6a6a7a]">
                          {labFixed ? formatCurrency(item.laborLow) : `${formatCurrency(item.laborLow)}–${formatCurrency(item.laborHigh)}`}
                        </span>
                        <span className="w-24 text-right text-xs font-medium text-[#1a1a2e]">
                          {totFixed ? formatCurrency(item.totalLow) : `${formatCurrency(item.totalLow)}–${formatCurrency(item.totalHigh)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Goal Step (Priorities + Scope combined) ── */
function GoalStep() {
  const { goals, toggleGoal, scope, setScope } = useWizardStore();

  const GOALS = [
    { id: "update_style", label: "Update Style", icon: FaPaintRoller },
    { id: "fix_problems", label: "Fix Problems", icon: FaWrench },
    { id: "increase_value", label: "Increase Home Value", icon: FaChartLine },
    { id: "more_space", label: "More Space", icon: FaUpRightAndDownLeftFromCenter },
    { id: "energy_efficient", label: "Energy Efficient", icon: FaLeaf },
    { id: "accessibility", label: "Improve Accessibility", icon: FaWheelchair },
    { id: "family_friendly", label: "Family-Friendly", icon: FaChildReaching },
  ];

  const SCOPES: { id: BathroomScope; label: string; desc: string; icon: typeof FaPaintbrush }[] = [
    { id: "cosmetic", label: "Cosmetic Refresh", desc: "Paint, fixtures, hardware, accessories. Minimal disruption.", icon: FaPaintbrush },
    { id: "partial", label: "Partial Remodel", desc: "New vanity, flooring, paint. Keep existing layout.", icon: FaScrewdriverWrench },
    { id: "full", label: "Full Remodel", desc: "Gut everything and rebuild. New layout possible.", icon: FaHammer },
    { id: "addition", label: "Addition / Expansion", desc: "Expand bathroom footprint. Structural changes.", icon: FaRuler },
  ];

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-10">
        {/* Priorities */}
        <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5">
          <h2 className="text-2xl font-bold text-[#1a1a2e]">
            What&apos;s the main goal of your bathroom renovation?
          </h2>
          <p className="mt-2 text-sm text-[#6a6a7a]">Select all that apply</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                  goals.includes(g.id)
                    ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                    : "border-[#e8e6e1] hover:border-[#d5d3cd]"
                }`}
              >
                <span className="text-2xl text-[#2d5a3d]"><g.icon /></span>
                <div className="flex-1 font-semibold text-[#1a1a2e]">{g.label}</div>
                {goals.includes(g.id) && (
                  <FaCheck className="text-sm text-[#2d5a3d]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scope */}
        <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5">
          <h2 className="text-2xl font-bold text-[#1a1a2e]">What&apos;s the scope of work?</h2>
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
                {scope === s.id && (
                  <FaCheck className="text-sm text-[#2d5a3d]" />
                )}
              </button>
            ))}
          </div>
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

function BudgetStep({ subStep }: { subStep: number }) {
  const { budgetAmount, setBudgetAmount, bathroomSize, setBathroomSize } = useWizardStore();

  if (subStep === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a2e]">What&apos;s your ideal budget?</h2>

        <div className="mt-5">
          <div className="relative w-64">
            <FaDollarSign className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[#6a6a7a]" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={budgetAmount != null ? budgetAmount.toLocaleString("en-US") : ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                const val = raw === "" ? 0 : Math.max(0, Number(raw));
                setBudgetAmount(val);
              }}
              className="w-full rounded-xl border-2 border-[#e8e6e1] bg-white py-3 pl-10 pr-4 text-lg font-bold text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-1 focus:ring-[#2d5a3d]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">What is the room size?</h2>

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
              onClick={() => setBathroomSize(s.id)}
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
                <div className="shrink-0 text-right font-medium text-[#2d5a3d]">
                  <div className="text-sm">{s.sqft.replace(/ sqft$/, '')}</div>
                  <div className="text-[10px] uppercase tracking-wide">sqft</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Moodboard Step (discover items + moodboard view) ── */

function MoodboardStep({ view, pointedItems, setPointedItems, manualProducts, setManualProducts, dragPositions, setDragPositions }: {
  view: "items-pictures" | "catalogue" | "moodboard" | "mockup";
  pointedItems: Record<string, PointedItem[]>;
  setPointedItems: React.Dispatch<React.SetStateAction<Record<string, PointedItem[]>>>;
  manualProducts: Product[];
  setManualProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  dragPositions: Record<number, { x: number; y: number }>;
  setDragPositions: React.Dispatch<React.SetStateAction<Record<number, { x: number; y: number }>>>;
}) {
  const { items, removeItem } = useMoodboardStore();
  const { mustHaves, niceToHaves, setPriceOverride, removePriceOverride } = useWizardStore();
  const [selectingImageId, setSelectingImageId] = useState<string | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Manual product link input state
  const [manualLinkUrl, setManualLinkUrl] = useState("");
  const [manualLinkLoading, setManualLinkLoading] = useState(false);
  const [manualLinkError, setManualLinkError] = useState<string | null>(null);

  // Product detail modal state
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailImageIdx, setDetailImageIdx] = useState(0);

  // Draggable moodboard canvas state
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zOrders, setZOrders] = useState<Record<number, number>>({});
  const zCounter = useRef(1);

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
    zCounter.current += 1;
    setZOrders(prev => ({ ...prev, [idx]: zCounter.current }));
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

  // Build selectedProducts with source info for toggling from moodboard/mockup
  type SelectedProductEntry = {
    product: Product;
    source: "pointed";
    imageId: string;
    pointedId: string;
    productIdx: number;
  } | {
    product: Product;
    source: "manual";
    manualIdx: number;
  };

  const selectedEntries: SelectedProductEntry[] = [
    ...Object.entries(pointedItems).flatMap(([imageId, items]) =>
      items
        .filter(p => p.selectedProductIdx !== null && p.products[p.selectedProductIdx!])
        .map(p => ({
          product: p.products[p.selectedProductIdx!],
          source: "pointed" as const,
          imageId,
          pointedId: p.id,
          productIdx: p.selectedProductIdx!,
        })),
    ),
    ...manualProducts.map((product, i) => ({
      product,
      source: "manual" as const,
      manualIdx: i,
    })),
  ];

  const selectedProducts = selectedEntries.map(e => e.product);

  const deselectEntry = (entry: SelectedProductEntry) => {
    if (entry.source === "pointed") {
      toggleProductSelection(entry.imageId, entry.pointedId, entry.productIdx);
    } else {
      removeManualProduct(entry.manualIdx);
    }
  };

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
      const label = data.label || "Unknown item";
      const matched = autoMatchLabel(label);
      setPointedItems(prev => ({
        ...prev,
        [imageId]: (prev[imageId] || []).map(item =>
          item.id === pointedId ? { ...item, label, loading: false, products: data.products || [], matchedItemLabel: matched } : item
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
    // If removing an item that had a price override, clean it up
    const pi = (pointedItems[imageId] || []).find((p) => p.id === pointedId);
    if (pi?.selectedProductIdx !== null) {
      const overrideLabel = pi?.matchedItemLabel || pi?.label;
      if (overrideLabel) removePriceOverride(overrideLabel);
    }
    setPointedItems(prev => ({ ...prev, [imageId]: (prev[imageId] || []).filter(item => item.id !== pointedId) }));
  };

  // Auto-match an identified label to a must-have/nice-to-have
  const allWizardItems = useMemo(() => [...mustHaves, ...niceToHaves], [mustHaves, niceToHaves]);

  const autoMatchLabel = useCallback((identifiedLabel: string): string | undefined => {
    const lower = identifiedLabel.toLowerCase();
    // Keywords from must-have labels to fuzzy-match
    const MATCH_KEYWORDS: Record<string, string[]> = {
      "New tile (floor)": ["floor tile", "floor", "porcelain tile", "ceramic tile", "marble floor", "stone floor", "tile floor"],
      "New tile (shower walls)": ["shower tile", "wall tile", "subway tile", "shower wall", "marble tile", "marble wall", "stone tile", "green marble", "backsplash tile"],
      "Single vanity": ["vanity", "bathroom vanity", "single vanity", "sink cabinet"],
      "Double vanity": ["double vanity", "dual vanity", "two sink"],
      "Comfort-height toilet": ["toilet", "commode"],
      "Bidet/bidet seat": ["bidet"],
      "Exhaust fan upgrade": ["exhaust fan", "vent fan", "bathroom fan"],
      "Recessed lighting": ["recessed light", "can light", "downlight"],
      "Walk-in shower": ["walk-in shower", "shower enclosure", "curbless shower"],
      "Bathtub": ["bathtub", "tub", "soaking tub", "freestanding tub", "freestanding bath", "soaking bath", "oval bath"],
      "Glass shower door": ["shower door", "glass door", "frameless"],
      "Rain showerhead": ["rain showerhead", "rain shower", "rainfall"],
      "Handheld showerhead": ["handheld shower", "hand shower", "detachable"],
      "Medicine cabinet": ["medicine cabinet", "mirrored cabinet"],
      "LED mirror": ["led mirror", "lighted mirror", "backlit mirror"],
      "Heated floors": ["heated floor", "radiant floor", "floor heating"],
      "Towel warmer": ["towel warmer", "towel rack", "heated towel"],
      "Grab bars": ["grab bar", "safety bar"],
      "Built-in shelving": ["shelf", "shelving", "niche", "built-in"],
      "Non-slip flooring": ["non-slip", "anti-slip"],
      "Dimmer switches": ["dimmer", "light switch"],
      "Under-cabinet lighting": ["under-cabinet", "cabinet light", "vanity light"],
    };

    for (const wizardLabel of allWizardItems) {
      const keywords = MATCH_KEYWORDS[wizardLabel];
      if (keywords && keywords.some((kw) => lower.includes(kw))) return wizardLabel;
      // Also try if the wizard label itself is a substring
      if (lower.includes(wizardLabel.toLowerCase())) return wizardLabel;
    }
    return undefined;
  }, [allWizardItems]);

  // Re-evaluate matchedItemLabel whenever wizard items change (handles persisted items + late edits)
  useEffect(() => {
    let changed = false;
    const updated: Record<string, PointedItem[]> = {};
    for (const [imageId, items] of Object.entries(pointedItems)) {
      updated[imageId] = items.map((pi) => {
        if (pi.loading) return pi;
        const newMatch = autoMatchLabel(pi.label);
        if (newMatch !== pi.matchedItemLabel) {
          changed = true;
          return { ...pi, matchedItemLabel: newMatch };
        }
        return pi;
      });
    }
    if (changed) setPointedItems(updated);
  }, [allWizardItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse dollar price string → number (e.g., "$1,299.00" → 1299)
  const parsePrice = (priceStr: string): number | null => {
    const match = priceStr.replace(/[^0-9.]/g, "");
    const num = parseFloat(match);
    return isNaN(num) ? null : num;
  };

  // Labor estimate: ~55% of material cost for most bathroom items
  const estimateLabor = (materialCost: number): number => Math.round(materialCost * 0.55);

  const toggleProductSelection = (imageId: string, pointedId: string, productIdx: number) => {
    // First: update pointed items state
    setPointedItems(prev => ({
      ...prev,
      [imageId]: (prev[imageId] || []).map(item =>
        item.id === pointedId
          ? { ...item, selectedProductIdx: item.selectedProductIdx === productIdx ? null : productIdx }
          : item
      ),
    }));

    // Second: update budget price override
    const pi = (pointedItems[imageId] || []).find((p) => p.id === pointedId);
    if (!pi) return;

    // Use matchedItemLabel if available, otherwise use the identified label
    const overrideLabel = pi.matchedItemLabel || pi.label;
    if (!overrideLabel || overrideLabel === "Identifying..." || overrideLabel === "Could not identify") return;

    const isDeselecting = pi.selectedProductIdx === productIdx;
    if (isDeselecting) {
      removePriceOverride(overrideLabel);
    } else {
      const product = pi.products[productIdx];
      if (product) {
        const materialCost = parsePrice(product.price);
        if (materialCost !== null) {
          setPriceOverride({
            itemLabel: overrideLabel,
            materialCost,
            laborCost: estimateLabor(materialCost),
          });
        }
      }
    }
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

      {/* Product detail modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDetailProduct(null)}>
          <div className="relative mx-4 flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setDetailProduct(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#4a4a5a] shadow-md transition hover:bg-[#f8f7f4] hover:text-[#1a1a2e]"
            >
              <FaXmark className="text-sm" />
            </button>

            <div className="flex flex-col overflow-y-auto md:flex-row">
              {/* Left: Image gallery */}
              <div className="relative flex w-full flex-col bg-[#f8f7f4] md:w-1/2">
                {/* Main image with zoom */}
                <div className="relative aspect-square w-full overflow-hidden">
                  {((detailProduct.images ?? []).length > 0 ? detailProduct.images : [detailProduct.thumbnail]).filter(Boolean).map((img, i) => (
                    <Image
                      key={i}
                      src={img}
                      alt={`${detailProduct.title} - view ${i + 1}`}
                      fill
                      className={`object-contain transition-opacity duration-200 ${i === detailImageIdx ? "opacity-100" : "opacity-0"}`}
                      sizes="400px"
                      unoptimized
                    />
                  ))}

                  {/* Navigation arrows */}
                  {((detailProduct.images ?? []).length > 1) && (
                    <>
                      <button
                        onClick={() => setDetailImageIdx((prev) => (prev - 1 + (detailProduct.images ?? []).length) % (detailProduct.images ?? []).length)}
                        className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#4a4a5a] shadow transition hover:bg-white"
                      >
                        <FaChevronLeft className="text-xs" />
                      </button>
                      <button
                        onClick={() => setDetailImageIdx((prev) => (prev + 1) % (detailProduct.images ?? []).length)}
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#4a4a5a] shadow transition hover:bg-white"
                      >
                        <FaChevronRight className="text-xs" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail strip */}
                {(detailProduct.images ?? []).length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto p-3">
                    {(detailProduct.images ?? []).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setDetailImageIdx(i)}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          i === detailImageIdx ? "border-[#2d5a3d]" : "border-transparent hover:border-[#d5d3cd]"
                        }`}
                      >
                        <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" sizes="56px" unoptimized />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product info + specs */}
              <div className="flex w-full flex-col p-6 md:w-1/2">
                <h3 className="text-lg font-bold text-[#1a1a2e] leading-snug">{detailProduct.title}</h3>
                <div className="mt-2 flex items-center gap-3">
                  {detailProduct.price && (
                    <span className="text-xl font-bold text-[#2d5a3d]">{detailProduct.price}</span>
                  )}
                  <span className="rounded-full bg-[#f8f7f4] px-2.5 py-0.5 text-xs text-[#6a6a7a]">{detailProduct.source}</span>
                </div>

                {/* Specifications */}
                {Object.keys(detailProduct.specs ?? {}).length > 0 && (
                  <div className="mt-5">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9a9aaa]">Specifications</h4>
                    <div className="divide-y divide-[#f0eeea]">
                      {Object.entries(detailProduct.specs ?? {}).slice(0, 12).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4 py-2">
                          <span className="text-xs text-[#6a6a7a]">{key}</span>
                          <span className="text-right text-xs font-medium text-[#1a1a2e]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No specs available */}
                {Object.keys(detailProduct.specs ?? {}).length === 0 && (
                  <div className="mt-5 rounded-xl bg-[#f8f7f4] p-4 text-center">
                    <p className="text-xs text-[#9a9aaa]">Detailed specifications not available. Visit the product page for more info.</p>
                  </div>
                )}

                {/* Visit product page CTA */}
                <div className="mt-auto pt-5">
                  <a
                    href={detailProduct.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d5a3d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#234a31]"
                  >
                    <FaArrowUpRightFromSquare className="text-xs" />
                    View on {detailProduct.source || "Store"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: Look for Items from Pictures ── */}
      {view === "items-pictures" && (
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a2e]">Items from Pictures</h2>
              <p className="mt-2 text-sm text-[#6a6a7a]">
                Draw a box around any item. We&apos;ll find where to buy it online.
              </p>
            </div>
            {items.length > 0 && (
              <Link
                href="/explore?from=moodboard"
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2d5a3d] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#234a31]"
              >
                <FaPlus className="text-[10px]" /> Add Pictures
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

                    <div className="flex min-h-[500px]">
                      {/* LEFT: Image + Point-out button */}
                      <div className="flex w-1/2 flex-col items-center border-r border-[#e8e6e1] p-4">
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
                          <FaHandPointer className="text-xs" />
                          {isSelecting ? "Drawing mode \u2014 cancel" : "Point out the Item"}
                        </button>
                      </div>

                      {/* RIGHT: Found items & products */}
                      <div className="flex w-1/2 flex-col p-4">
                        <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">
                          Items to Buy
                          {pointed.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-[#6a6a7a]">({pointed.length} found)</span>
                          )}
                        </h4>

                        {pointed.length === 0 ? (
                          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8e6e1] text-center">
                            <FaCartShopping className="mb-2 text-2xl text-[#d5d3cd]" />
                            <p className="text-xs text-[#9a9aaa]">
                              Point out items in the image<br />to find them online
                            </p>
                          </div>
                        ) : (
                          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
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
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium text-[#1a1a2e]">{pi.label}</span>
                                        {pi.matchedItemLabel && (
                                          <span className="rounded bg-[#2d5a3d]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#2d5a3d]">
                                            → {pi.matchedItemLabel}
                                          </span>
                                        )}
                                      </div>
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
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    {pi.products.slice(0, 4).map((p, i) => {
                                      const isSelected = pi.selectedProductIdx === i;
                                      return (
                                        <div
                                          key={i}
                                          className={`relative rounded-xl border overflow-hidden transition ${
                                            isSelected
                                              ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/20"
                                              : "border-[#e8e6e1] hover:border-[#c5c3bd]"
                                          }`}
                                        >
                                          {/* Product image - large */}
                                          {p.thumbnail && (
                                            <div className="relative aspect-square w-full overflow-hidden bg-[#f8f7f4]">
                                              <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="200px" unoptimized />
                                              {/* Selection indicator overlay */}
                                              {isSelected && (
                                                <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2d5a3d] shadow">
                                                  <FaCheck className="text-[8px] text-white" />
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Product info */}
                                          <div className="p-2">
                                            <p className="line-clamp-2 text-[11px] leading-tight font-medium text-[#1a1a2e]">{p.title}</p>
                                            <div className="mt-1 flex items-center gap-1.5">
                                              <span className="text-[10px] text-[#6a6a7a]">{p.source}</span>
                                              {p.price && <span className="text-xs font-bold text-[#2d5a3d]">{p.price}</span>}
                                            </div>

                                            {/* Action buttons row */}
                                            <div className="mt-2 flex items-center gap-1">
                                              {/* Select / deselect button */}
                                              <button
                                                onClick={() => toggleProductSelection(item.id, pi.id, i)}
                                                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
                                                  isSelected
                                                    ? "bg-[#2d5a3d] text-white"
                                                    : "border border-[#2d5a3d] text-[#2d5a3d] hover:bg-[#2d5a3d]/5"
                                                }`}
                                              >
                                                {isSelected ? <><FaCheck className="text-[8px]" /> Selected</> : "Select"}
                                              </button>

                                              {/* Detail / expand button */}
                                              <button
                                                onClick={() => { setDetailProduct(p); setDetailImageIdx(0); }}
                                                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#d5d3cd] text-[#6a6a7a] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5 hover:text-[#2d5a3d]"
                                                title="View details"
                                              >
                                                <FaCircleInfo className="text-xs" />
                                              </button>

                                              {/* External link button */}
                                              <a
                                                href={p.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#d5d3cd] text-[#6a6a7a] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5 hover:text-[#2d5a3d]"
                                                title="Open product page"
                                              >
                                                <FaArrowUpRightFromSquare className="text-[10px]" />
                                              </a>
                                            </div>
                                          </div>
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

            </div>
          )}
        </div>
      )}

      {/* ── SECTION: Moodboard ── */}
      {view === "moodboard" && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a2e]">Your Moodboard</h2>
              <p className="mt-1 text-sm text-[#6a6a7a]">Your selected items arranged on a style board. Click the &times; to remove an item.</p>
            </div>
          </div>

          {/* White canvas moodboard */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white shadow-sm">
            {selectedProducts.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center text-center">
                <FaImages className="mb-3 text-4xl text-[#e8e6e1]" />
                <p className="text-sm font-medium text-[#9a9aaa]">No items selected yet</p>
                <p className="mt-1 text-xs text-[#c5c3bd]">
                  Go to Items from Pictures, point out items, and select a product for each.
                </p>
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
                      className={`group absolute transition-shadow duration-150 ${draggingIdx === i ? "shadow-lg" : "hover:shadow-md"}`}
                      style={{ left: pos.x, top: pos.y, cursor: draggingIdx === i ? "grabbing" : "grab", zIndex: draggingIdx === i ? 9999 : (zOrders[i] || 0) }}
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
                      {/* Remove button on hover */}
                      <button
                        onMouseDown={(e) => { e.stopPropagation(); deselectEntry(selectedEntries[i]); }}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#9a9aaa] opacity-0 shadow-md ring-1 ring-[#e8e6e1] transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        title="Remove from moodboard"
                      >
                        <FaXmark className="text-[10px]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shopping List — grid with big images */}
          {selectedProducts.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1a1a2e]">
                <FaCartShopping className="text-[#2d5a3d]" /> Your Shopping List
                <span className="rounded-full bg-[#2d5a3d]/10 px-2 py-0.5 text-xs font-medium text-[#2d5a3d]">{selectedProducts.length}</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {selectedEntries.map((entry, i) => {
                  const p = entry.product;
                  return (
                    <div key={i} className="group overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:border-[#2d5a3d]/30 hover:shadow-sm">
                      {p.thumbnail && (
                        <div className="relative aspect-square w-full overflow-hidden bg-[#f8f7f4]">
                          <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="200px" unoptimized />
                          <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2d5a3d] shadow">
                            <FaCheck className="text-[8px] text-white" />
                          </div>
                        </div>
                      )}
                      <div className="p-2.5">
                        <p className="line-clamp-2 text-[11px] leading-tight font-medium text-[#1a1a2e]">{p.title}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] text-[#6a6a7a]">{p.source}</span>
                          {p.price && <span className="text-xs font-bold text-[#2d5a3d]">{p.price}</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            onClick={() => deselectEntry(entry)}
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#2d5a3d] px-2 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#234a31]"
                          >
                            <FaCheck className="text-[8px]" /> Selected
                          </button>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#d5d3cd] text-[#6a6a7a] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5 hover:text-[#2d5a3d]"
                            title="Open product page"
                          >
                            <FaArrowUpRightFromSquare className="text-[10px]" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Browse more */}
        </div>
      )}

      {/* ── SECTION: Designer's Catalogue ── */}
      {view === "catalogue" && (
        <div className="mt-6">
          <CatalogueView
            selectedProducts={manualProducts}
            onToggleProduct={(product) => {
              const exists = manualProducts.some((mp) => mp.url === product.url || mp.title === product.title);
              if (exists) {
                setManualProducts((prev) => prev.filter((mp) => mp.url !== product.url && mp.title !== product.title));
              } else {
                setManualProducts((prev) => [...prev, product]);
              }
            }}
          />
        </div>
      )}

      {/* ── SECTION: Real Mockup ── */}
      {view === "mockup" && (
        <RealMockupSection selectedProducts={selectedProducts} />
      )}
    </div>
  );
}

/* ── Real Mockup Section ── */
function RealMockupSection({ selectedProducts }: { selectedProducts: Product[] }) {
  const store = useWizardStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());

  // Reset stale loading state on mount (e.g. if page was refreshed mid-generation)
  useEffect(() => {
    if (store.mockupLoading) store.setMockupLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleItem = (idx: number) => {
    setExcludedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const includedProducts = selectedProducts.filter((_, i) => !excludedIndices.has(i));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setError(null);

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload image files only (JPG, PNG, WebP).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be under 10 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          store.addMockupPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleGenerateMockup = async () => {
    if (store.mockupBathroomPhotos.length === 0) {
      setError("Please upload at least one photo of your bathroom.");
      return;
    }
    if (includedProducts.length === 0) {
      setError("Please include at least one item for the mockup.");
      return;
    }

    store.setMockupLoading(true);
    setError(null);
    store.setMockupGeneratedImages([]);

    try {
      const res = await fetch("/api/ai/generate-mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bathroomPhotos: store.mockupBathroomPhotos,
          products: includedProducts.map((p) => ({
            title: p.title,
            thumbnail: p.thumbnail,
            price: p.price,
            source: p.source,
          })),
        }),
      });
      const data = await res.json();
      // Store images if any were returned, even on partial failure
      if (data.images && data.images.length > 0) {
        store.setMockupGeneratedImages(data.images);
      }
      // Only show error if NO images came back
      if ((!data.images || data.images.length === 0) && (!res.ok || data.error)) {
        setError(data.error || "Failed to generate mockup. Please try again.");
      }
    } catch {
      if (store.mockupGeneratedImages.length === 0) {
        setError("Failed to generate mockup. Please try again.");
      }
    } finally {
      store.setMockupLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Real Mockup</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Upload photos of your current bathroom, then generate a realistic AI mockup with your selected items.
      </p>

      {/* ── Input section: photos + items side by side ── */}
      <div className="mt-6 rounded-2xl border border-[#e8e6e1] bg-[#fafaf8] p-5">
        <div className="grid gap-6 lg:grid-cols-[1fr_1px_1fr]">
          {/* ── Left: Upload bathroom photos (larger) ── */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
              <FaCamera className="text-xs text-[#2d5a3d]" />
              Your Bathroom Photos
            </h3>
            <p className="mt-1 text-xs text-[#9a9aaa]">
              Upload at least 1 angle. Multiple angles give better results.
            </p>

            {/* Upload area */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {store.mockupBathroomPhotos.map((photo, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[#e8e6e1] shadow-sm">
                  <Image src={photo} alt={`Bathroom angle ${i + 1}`} fill className="object-cover" sizes="300px" unoptimized />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
                  <button
                    onClick={() => store.removeMockupPhoto(i)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#9a9aaa] opacity-0 shadow transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <FaXmark className="text-[10px]" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                    Angle {i + 1}
                  </span>
                </div>
              ))}

              {/* Add photo button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#d5d3cd] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5"
              >
                <FaUpload className="text-lg text-[#9a9aaa]" />
                <span className="text-[10px] font-medium text-[#6a6a7a]">
                  {store.mockupBathroomPhotos.length === 0 ? "Upload Photo" : "Add Another"}
                </span>
              </button>
            </div>
          </div>

          {/* Vertical divider */}
          <div className="hidden bg-[#e8e6e1] lg:block" />

          {/* ── Right: Items with toggle checkboxes ── */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
              <FaCartShopping className="text-xs text-[#2d5a3d]" />
              Items to Include
              <span className="rounded-full bg-[#2d5a3d]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#2d5a3d]">
                {includedProducts.length}/{selectedProducts.length}
              </span>
            </h3>
            <p className="mt-1 text-xs text-[#9a9aaa]">
              Toggle items on or off for this mockup.
            </p>

            {selectedProducts.length === 0 ? (
              <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#d5d3cd] p-6 text-center">
                <FaCartShopping className="text-xl text-[#d5d3cd]" />
                <p className="text-xs text-[#9a9aaa]">No items selected yet.</p>
                <p className="text-[10px] text-[#c5c3bd]">Go to Items &amp; Materials to select products.</p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                {selectedProducts.map((p, i) => {
                  const included = !excludedIndices.has(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleItem(i)}
                      className={`group relative flex flex-col overflow-hidden rounded-xl border transition ${
                        included
                          ? "border-[#2d5a3d] bg-white shadow-sm"
                          : "border-[#e8e6e1] bg-[#f5f4f1] opacity-60"
                      }`}
                    >
                      {/* Checkbox indicator */}
                      <div className={`absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[9px] shadow ${
                        included ? "bg-[#2d5a3d] text-white" : "border border-[#c5c3bd] bg-white text-transparent"
                      }`}>
                        <FaCheck />
                      </div>
                      {p.thumbnail && (
                        <div className="relative aspect-square w-full overflow-hidden bg-[#f8f7f4]">
                          <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="200px" unoptimized />
                        </div>
                      )}
                      <div className="p-2 text-left">
                        <p className="line-clamp-2 text-[11px] font-medium leading-tight text-[#1a1a2e]">{p.title}</p>
                        {p.price && <p className="mt-0.5 text-[10px] font-semibold text-[#2d5a3d]">{p.price}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
            <FaCircleExclamation className="shrink-0 text-xs" />
            {error}
          </div>
        )}

        {/* Generate button */}
        <div className="mt-5 flex justify-center">
          <button
            onClick={handleGenerateMockup}
            disabled={store.mockupLoading || store.mockupBathroomPhotos.length === 0 || includedProducts.length === 0}
            className="flex items-center gap-2.5 rounded-xl bg-[#2d5a3d] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2d5a3d]/20 transition hover:bg-[#234a31] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {store.mockupLoading ? (
              <>
                <FaSpinner className="animate-spin text-sm" />
                Generating Mockup...
              </>
            ) : (
              <>
                <FaWandMagicSparkles className="text-sm" />
                Generate Mockup
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {store.mockupBathroomPhotos.length} photo{store.mockupBathroomPhotos.length !== 1 ? "s" : ""} + {includedProducts.length} item{includedProducts.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated results */}
      {store.mockupGeneratedImages.length > 0 && (
        <div className="mt-8">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[#1a1a2e]">
            <FaPhotoFilm className="text-[#2d5a3d]" />
            Your Mockup{store.mockupGeneratedImages.length > 1 ? "s" : ""}
          </h3>
          <p className="mt-1 text-xs text-[#9a9aaa]">
            AI-generated renovation preview based on your photos and selected items.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {store.mockupGeneratedImages.map((imgUrl, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white shadow-sm">
                <div className="relative aspect-[3/2] w-full">
                  <Image src={imgUrl} alt={`Mockup angle ${i + 1}`} fill className="object-cover" sizes="600px" unoptimized />
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#2d5a3d]">
                    <FaCircleCheck className="text-[10px]" />
                    Angle {i + 1}
                  </span>
                  <a
                    href={imgUrl}
                    download={`bathroom-mockup-angle-${i + 1}.png`}
                    className="flex items-center gap-1.5 rounded-lg border border-[#d5d3cd] px-3 py-1 text-xs font-medium text-[#4a4a5a] transition hover:bg-[#f8f7f4]"
                  >
                    <FaArrowUpRightFromSquare className="text-[9px]" /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
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
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week");

  const totalDays = tasks.length > 0
    ? Math.max(...tasks.map((t) => t.startDay + t.duration))
    : 0;
  const milestones = tasks.filter((t) => t.milestone);
  const phases = [...new Set(tasks.map((t) => t.phase))];

  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const ganttInstanceRef = useRef<unknown>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const BAR_HEIGHT = 20;
  const PADDING = 12;

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
        view_mode: viewMode,
        bar_height: BAR_HEIGHT,
        bar_corner_radius: 4,
        arrow_curve: 6,
        padding: PADDING,
        language: "en",
        on_click: () => {},
        on_date_change: () => {},
        on_progress_change: () => {},
        on_view_change: () => {},
      });

      // Color bars by phase + sync sidebar header height
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

        // Match sidebar header height to gantt header
        if (sidebarRef.current && ganttContainerRef.current) {
          const gridHeader = ganttContainerRef.current.querySelector(".grid-header") as HTMLElement;
          if (gridHeader) {
            const headerHeight = gridHeader.getBoundingClientRect().height;
            const spacer = sidebarRef.current.querySelector(".gantt-sidebar-header") as HTMLElement;
            if (spacer) spacer.style.height = `${headerHeight}px`;
          }
        }
      });
    });
  }, [tasks, viewMode, PHASE_COLORS]);

  // Sync vertical scroll between gantt and sidebar
  useEffect(() => {
    const ganttEl = ganttContainerRef.current;
    const sidebarEl = sidebarRef.current;
    if (!ganttEl || !sidebarEl) return;
    const handleScroll = () => { sidebarEl.scrollTop = ganttEl.scrollTop; };
    ganttEl.addEventListener("scroll", handleScroll);
    return () => ganttEl.removeEventListener("scroll", handleScroll);
  }, [tasks]);

  const VIEW_MODES = ["Day", "Week", "Month"] as const;

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

          {/* Phase legend + View mode toggle */}
          <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap gap-3">
              {phases.map((phase) => (
                <span key={phase} className="flex items-center gap-1.5 text-xs font-medium text-[#4a4a5a]">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PHASE_COLORS[phase] || "#94a3b8" }} />
                  {phase}
                </span>
              ))}
            </div>
            <div className="flex gap-1 rounded-lg bg-[#f8f7f4] p-1">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-[#2d5a3d] text-white shadow-sm"
                      : "text-[#6a6a7a] hover:text-[#4a4a5a]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Gantt chart with left sidebar */}
          <div className="mt-4 rounded-xl border border-[#e8e6e1] overflow-hidden">
            <div className="flex">
              {/* Left sidebar — task names */}
              <div
                ref={sidebarRef}
                className="flex-shrink-0 border-r border-[#e8e6e1] bg-white overflow-hidden"
                style={{ width: 200 }}
              >
                <div className="gantt-sidebar-header border-b border-[#e8e6e1] bg-[#f8f7f4]" />
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 px-3 text-[11px] text-[#4a4a5a] border-b border-[#f0efeb]"
                    style={{ height: BAR_HEIGHT + PADDING }}
                  >
                    <span
                      className="h-2 w-2 rounded-sm flex-shrink-0"
                      style={{ background: PHASE_COLORS[task.phase] || "#94a3b8" }}
                    />
                    <span className="truncate font-medium">{task.name}</span>
                  </div>
                ))}
              </div>
              {/* Gantt chart */}
              <div className="flex-1 min-w-0 overflow-x-auto">
                <div ref={ganttContainerRef} className="gantt-container" />
              </div>
            </div>
          </div>

          {/* Styles */}
          <style jsx global>{`
            .gantt-container {
              --g-bar-color: #2d5a3d;
              --g-bar-border: #2d5a3d;
              overflow-y: hidden !important;
            }
            .gantt-container .grid-header { background-color: #f8f7f4; }
            .gantt-container .gantt .grid-row { fill: #fff; }
            .gantt-container .gantt .grid-row:nth-child(even) { fill: #fdfcfa; }
            .gantt-container .gantt .row-line { stroke: #e8e6e1; }
            .gantt-container .gantt .tick { stroke: #f0efeb; }
            .gantt-container .gantt .today-highlight { fill: rgba(45, 90, 61, 0.06); }
            .gantt-container .gantt .arrow { stroke: #6a6a7a; stroke-width: 1.8; }
            /* Hide bar labels — task names shown in left sidebar */
            .gantt-container .gantt .bar-label { display: none; }
            /* Hide frappe-gantt built-in header controls */
            .gantt-container .side-header { display: none !important; }
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

  /* Thumbtack card — horizontal row with View button on the right */
  const renderThumbtackCard = (c: Contractor, i: number) => (
    <div
      key={i}
      className="flex items-center gap-4 rounded-xl border border-[#e8e6e1] p-4 transition hover:border-[#d5d3cd] hover:shadow-md"
    >
      {/* Thumbnail */}
      {c.thumbnail && (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f8f7f4]">
          <Image src={c.thumbnail} alt={c.name} fill className="object-cover" sizes="48px" unoptimized />
        </div>
      )}

      {/* Info */}
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

        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-[#4a4a5a]">
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

        {c.hiredCount && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#2d5a3d]">
            <FaThumbsUp className="text-[9px]" /> {c.hiredCount} hires
          </div>
        )}
      </div>

      {/* View button — right side */}
      {c.url && (
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2d5a3d] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-[#234a31]"
        >
          View <FaArrowUpRightFromSquare className="text-[8px]" />
        </a>
      )}
    </div>
  );

  /* Google Reviews card — name, then rating · type, years, location, View on right */
  const renderGoogleCard = (c: Contractor, i: number) => (
    <div
      key={i}
      className="flex items-center gap-4 rounded-xl border border-[#e8e6e1] p-4 transition hover:border-[#d5d3cd] hover:shadow-md"
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[#1a1a2e] truncate">{c.name}</h3>

        {c.rating > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-[#4a4a5a]">
            {renderStars(c.rating)}
            <span className="ml-0.5 font-medium">{c.rating}</span>
            <span className="text-[#9a9aaa]">({c.reviewCount})</span>
            <span className="mx-1 text-[#9a9aaa]">·</span>
            <span className="text-[#6a6a7a]">{c.specialty}</span>
          </div>
        )}

        {c.yearsInBusiness && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6a6a7a]">
            {c.yearsInBusiness}
          </div>
        )}

        <div className="mt-1 flex items-center gap-1 text-[11px] text-[#4a4a5a]">
          <FaLocationDot className="text-[9px] text-[#9a9aaa]" /> {c.location}
        </div>
      </div>

      {/* View button — right side */}
      {c.url && (
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2d5a3d] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-[#234a31]"
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
        <div className="mt-6 grid grid-cols-2 gap-8">
          {/* Left column: Thumbtack */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Thumbtack Results</h3>
              <span className="text-[10px] text-[#009fd9] font-medium">Powered by Thumbtack</span>
            </div>
            <div className="space-y-3">
              {thumbtack.slice(0, 10).map((c, i) => renderThumbtackCard(c, i))}
            </div>
          </div>

          {/* Right column: Google Reviews */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Google Search Results</h3>
              <span className="text-[10px] text-[#4285f4] font-medium">Powered by Google</span>
            </div>
            <div className="space-y-3">
              {google.slice(0, 10).map((c, i) => renderGoogleCard(c, i))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Build Book Step (formerly Summary) ── */
function SummaryStep({ tasks, contractorCount, budgetGraph, pointedItems, manualProducts, dragPositions, thumbtackResults, googleResults }: {
  tasks: TimelineTask[];
  contractorCount: number;
  budgetGraph: BudgetGraphResult;
  pointedItems: Record<string, PointedItem[]>;
  manualProducts: Product[];
  dragPositions: Record<number, { x: number; y: number }>;
  thumbtackResults: Contractor[];
  googleResults: Contractor[];
}) {
  const store = useWizardStore();
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [contractorOpen, setContractorOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(true);

  const GOAL_META: Record<string, { label: string; icon: typeof FaPaintRoller }> = {
    increase_value: { label: "Increase Home Value", icon: FaChartLine },
    more_space: { label: "More Space", icon: FaUpRightAndDownLeftFromCenter },
    energy_efficient: { label: "Energy Efficient", icon: FaLeaf },
    update_style: { label: "Update Style", icon: FaPaintRoller },
    family_friendly: { label: "Family-Friendly", icon: FaChildReaching },
    accessibility: { label: "Improve Accessibility", icon: FaWheelchair },
    fix_problems: { label: "Fix Problems", icon: FaWrench },
  };

  const SCOPE_META: Record<string, { label: string; icon: typeof FaPaintbrush }> = {
    cosmetic: { label: "Cosmetic Refresh", icon: FaPaintbrush },
    partial: { label: "Partial Remodel", icon: FaScrewdriverWrench },
    full: { label: "Full Remodel", icon: FaHammer },
    addition: { label: "Addition / Expansion", icon: FaRuler },
  };

  const totalDays = tasks.length > 0 ? Math.max(...tasks.map((t) => t.startDay + t.duration)) : 0;
  const milestoneCount = tasks.filter(t => t.milestone).length;
  const phases = [...new Set(tasks.map((t) => t.phase))];
  const PHASE_COLORS: Record<string, string> = { Planning: "#3b82f6", Demolition: "#ef4444", "Rough-In": "#f97316", Installation: "#22c55e", Finishing: "#a855f7" };

  const formatCurrency = (n: number) => `$${n.toLocaleString()}`;
  const fmtDecimal = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const scopeMeta = store.scope ? SCOPE_META[store.scope] : null;
  const sizeInfo = BATHROOM_SIZES.find(s => s.id === store.bathroomSize);

  /* Build selected products list */
  const selectedProducts: Product[] = useMemo(() => {
    const fromPointed = Object.values(pointedItems).flatMap((items) =>
      items
        .filter((p) => p.selectedProductIdx !== null && p.products[p.selectedProductIdx!])
        .map((p) => p.products[p.selectedProductIdx!]),
    );
    return [...fromPointed, ...manualProducts];
  }, [pointedItems, manualProducts]);

  /* Product summary (deduplicated with quantities) */
  const productSummary = useMemo(() => {
    const map = new Map<string, { product: Product; quantity: number; unitPrice: number | null }>();
    for (const p of selectedProducts) {
      const key = p.title + "|" + p.url;
      const existing = map.get(key);
      const cleaned = p.price.replace(/[^0-9.]/g, "");
      const val = parseFloat(cleaned);
      if (existing) { existing.quantity += 1; }
      else { map.set(key, { product: p, quantity: 1, unitPrice: isNaN(val) ? null : val }); }
    }
    return Array.from(map.values());
  }, [selectedProducts]);

  const productTotal = productSummary.reduce((sum, r) => r.unitPrice != null ? sum + r.unitPrice * r.quantity : sum, 0);

  /* Default position helper for moodboard canvas */
  const getDefaultPosition = (idx: number, total: number, cw: number, ch: number) => {
    const cols = total <= 2 ? total : total <= 4 ? 2 : 3;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cellW = cw / cols;
    const cellH = ch / Math.ceil(total / cols);
    return { x: col * cellW + (cellW - 160) / 2, y: row * cellH + (cellH - 160) / 2 };
  };

  /* Pie chart segments */
  const pieSegments = budgetGraph.breakdown.map((item, i) => ({
    pct: item.pct,
    color: POPOUT_BREAKDOWN_COLORS[i % POPOUT_BREAKDOWN_COLORS.length],
    label: item.category,
    amount: formatCurrency(item.amount),
  }));

  /* Render stars for contractors */
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Your Build Book</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Everything&apos;s set! Here&apos;s your complete bathroom renovation build book.
      </p>

      {/* ── Budget Hero Card ── */}
      <div className="mt-6 rounded-xl bg-gradient-to-r from-[#2d5a3d] to-[#3d7a5d] p-6 text-white">
        <div className="flex items-center gap-2 text-sm font-medium text-white/70">
          <FaSackDollar className="text-xs" />
          Estimated Budget Range
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight">
          <SlotNumber value={`${formatCurrency(budgetGraph.estimatedLow)} – ${formatCurrency(budgetGraph.estimatedHigh)}`} />
        </div>
        {store.budgetAmount != null && store.budgetAmount > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-white/60">Your budget:</span>
            <span className="text-sm font-semibold">{formatCurrency(store.budgetAmount)}</span>
            {store.budgetAmount >= budgetGraph.estimatedLow ? (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                <FaCircleCheck className="text-[10px]" /> On track
              </span>
            ) : (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-400/30 px-2 py-0.5 text-xs font-medium">
                <FaCircleExclamation className="text-[10px]" /> Below estimate
              </span>
            )}
          </div>
        )}
        {budgetGraph.breakdown.length > 0 && (
          <div className="mt-4">
            <div className="flex h-2 overflow-hidden rounded-full">
              {budgetGraph.breakdown.map((b, i) => {
                const colors = ["bg-white/90", "bg-white/60", "bg-white/40", "bg-white/25", "bg-white/15"];
                return <div key={i} className={`${colors[i % colors.length]}`} style={{ width: `${b.pct}%` }} />;
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {budgetGraph.breakdown.map((b, i) => {
                const dots = ["bg-white/90", "bg-white/60", "bg-white/40", "bg-white/25", "bg-white/15"];
                return (
                  <span key={i} className="flex items-center gap-1.5 text-[11px] text-white/70">
                    <span className={`inline-block h-2 w-2 rounded-full ${dots[i % dots.length]}`} />
                    {b.category} · {b.pct}%
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[#f8f7f4] p-4 text-center">
          <div className="text-2xl font-bold text-[#2d5a3d]">{totalDays || "—"}</div>
          <div className="mt-1 text-xs text-[#6a6a7a]">Days</div>
        </div>
        <div className="rounded-xl bg-[#f8f7f4] p-4 text-center">
          <div className="text-2xl font-bold text-[#2d5a3d]">{tasks.length || "—"}</div>
          <div className="mt-1 text-xs text-[#6a6a7a]">Tasks</div>
        </div>
        <div className="rounded-xl bg-[#f8f7f4] p-4 text-center">
          <div className="text-2xl font-bold text-[#2d5a3d]">{contractorCount || "—"}</div>
          <div className="mt-1 text-xs text-[#6a6a7a]">Matched Pros</div>
        </div>
      </div>

      {/* ── Detail Rows: Goals, Scope, Size, Budget, Must-Haves, Nice-to-Haves ── */}
      <div className="mt-5 space-y-3">
        <SummaryRow icon={FaBullseye} label="Goals" iconColor="#2d5a3d">
          {store.goals.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {store.goals.map(g => {
                const meta = GOAL_META[g];
                const Icon = meta?.icon || FaBullseye;
                return (
                  <span key={g} className="inline-flex items-center gap-1.5 rounded-full bg-[#2d5a3d]/8 px-2.5 py-1 text-xs font-medium text-[#2d5a3d]">
                    <Icon className="text-[10px]" /> {meta?.label || g}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-sm text-[#9a9aaa]">None selected</span>
          )}
        </SummaryRow>

        <SummaryRow icon={FaRuler} label="Scope" iconColor="#2d5a3d">
          {scopeMeta ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a1a2e]">
              <scopeMeta.icon className="text-xs text-[#2d5a3d]" /> {scopeMeta.label}
            </span>
          ) : (
            <span className="text-sm text-[#9a9aaa]">—</span>
          )}
        </SummaryRow>

        <SummaryRow icon={FaExpand} label="Size" iconColor="#2d5a3d">
          <span className="text-sm font-medium text-[#1a1a2e]">{sizeInfo?.label || store.bathroomSize}</span>
        </SummaryRow>

        <SummaryRow icon={FaCoins} label="Budget" iconColor="#2d5a3d">
          <span className="text-sm font-medium text-[#1a1a2e]">
            {store.budgetAmount != null && store.budgetAmount > 0
              ? formatCurrency(store.budgetAmount)
              : formatCurrency(budgetGraph.estimatedLow) + " – " + formatCurrency(budgetGraph.estimatedHigh)}
          </span>
        </SummaryRow>

        <SummaryRow icon={FaClipboardList} label="Must-Haves" iconColor="#2d5a3d">
          {store.mustHaves.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {store.mustHaves.map(item => (
                <span key={item} className="inline-flex items-center gap-1 rounded-full border border-[#2d5a3d]/20 bg-[#2d5a3d]/5 px-2.5 py-1 text-xs font-medium text-[#2d5a3d]">
                  <FaCheck className="text-[8px]" /> {item}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-[#9a9aaa]">None selected</span>
          )}
        </SummaryRow>

        <SummaryRow icon={FaStar} label="Nice-to-Haves" iconColor="#d4956a">
          {store.niceToHaves.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {store.niceToHaves.map(item => (
                <span key={item} className="inline-flex items-center gap-1 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/5 px-2.5 py-1 text-xs font-medium text-[#d4956a]">
                  <FaStar className="text-[8px]" /> {item}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-[#9a9aaa]">None selected</span>
          )}
        </SummaryRow>
      </div>

      {/* ── Moodboard Canvas ── */}
      {selectedProducts.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
            <FaImages className="text-xs text-[#2d5a3d]" /> Moodboard
          </h3>
          <div className="relative h-[400px] overflow-hidden rounded-xl border border-[#e8e6e1] bg-white">
            {selectedProducts.map((p, i) => {
              const pos = dragPositions[i] || getDefaultPosition(i, selectedProducts.length, 700, 400);
              return (
                <div key={i} className="absolute" style={{ left: pos.x, top: pos.y }}>
                  {p.thumbnail ? (
                    <div className="relative h-[140px] w-[140px]">
                      <Image src={p.thumbnail} alt={p.title} fill className="object-contain" sizes="140px" unoptimized />
                    </div>
                  ) : (
                    <div className="flex h-[140px] w-[140px] items-center justify-center rounded-lg bg-[#f8f7f4]">
                      <FaCartShopping className="text-2xl text-[#d5d3cd]" />
                    </div>
                  )}
                  <p className="mt-0.5 max-w-[140px] truncate text-center text-[9px] font-medium text-[#6a6a7a]">{p.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Real Mockup Renderings ── */}
      {store.mockupGeneratedImages.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
            <FaPhotoFilm className="text-xs text-[#2d5a3d]" /> Real Mockup Renderings
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {store.mockupGeneratedImages.map((imgUrl, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-[#e8e6e1] bg-white shadow-sm">
                <div className="relative aspect-[3/2] w-full">
                  <Image src={imgUrl} alt={`Mockup angle ${i + 1}`} fill className="object-cover" sizes="500px" unoptimized />
                </div>
                <div className="px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#2d5a3d]">
                    <FaCircleCheck className="text-[10px]" /> Angle {i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Product Selections (image grid) ── */}
      {selectedProducts.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
            <FaCartShopping className="text-xs text-[#2d5a3d]" /> Product Selections
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {selectedProducts.map((p, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:shadow-sm">
                {p.thumbnail ? (
                  <div className="relative aspect-square w-full overflow-hidden bg-[#f8f7f4]">
                    <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="150px" unoptimized />
                  </div>
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-[#f8f7f4]">
                    <FaCartShopping className="text-xl text-[#d5d3cd]" />
                  </div>
                )}
                <div className="p-2">
                  <p className="line-clamp-2 text-[10px] font-medium leading-tight text-[#1a1a2e]">{p.title}</p>
                  <p className="mt-1 text-xs font-bold text-[#2d5a3d]">{p.price || "$TBD"}</p>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#2d8a9a] hover:underline">
                      LINK <FaArrowUpRightFromSquare className="text-[7px]" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Product List & Summary (spreadsheet) ── */}
      {productSummary.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
            <FaTableList className="text-xs text-[#2d5a3d]" /> Product List &amp; Summary
          </h3>
          <div className="overflow-x-auto rounded-xl border border-[#e8e6e1]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f7f4]">
                <tr className="border-b border-[#e8e6e1]">
                  <th className="px-3 py-2.5 font-bold text-[#1a1a2e]">Description</th>
                  <th className="px-3 py-2.5 font-bold text-[#1a1a2e]">Source</th>
                  <th className="px-3 py-2.5 font-bold text-[#1a1a2e]">Link</th>
                  <th className="px-3 py-2.5 text-center font-bold text-[#1a1a2e]">Qty</th>
                  <th className="px-3 py-2.5 text-right font-bold text-[#1a1a2e]">Price/Item</th>
                  <th className="px-3 py-2.5 text-right font-bold text-[#1a1a2e]">Total</th>
                </tr>
              </thead>
              <tbody>
                {productSummary.map((row, i) => {
                  const totalForRow = row.unitPrice != null ? row.unitPrice * row.quantity : null;
                  return (
                    <tr key={i} className="border-b border-[#e8e6e1] bg-white hover:bg-[#fafaf8] transition">
                      <td className="px-3 py-2.5 font-semibold text-[#1a1a2e] uppercase">{row.product.title}</td>
                      <td className="px-3 py-2.5 text-[#4a4a5a]">{row.product.source || "—"}</td>
                      <td className="px-3 py-2.5">
                        {row.product.url ? (
                          <a href={row.product.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2d8a9a] hover:underline">SHOP NOW</a>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[#4a4a5a]">{row.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-[#4a4a5a]">{row.unitPrice != null ? fmtDecimal(row.unitPrice) : "TBD"}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-[#1a1a2e]">{totalForRow != null ? fmtDecimal(totalForRow) : "$0.00"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f8f7f4]">
                  <td colSpan={5} className="px-3 py-2.5 text-right font-bold text-[#1a1a2e]">Products Total</td>
                  <td className="px-3 py-2.5 text-right font-bold text-[#2d5a3d]">{fmtDecimal(productTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Budget Breakdown (collapsible) ── */}
      <div className="mt-6">
        <button
          onClick={() => setBudgetOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-[#e8e6e1] bg-white px-4 py-3.5 transition hover:border-[#d5d3cd] hover:shadow-sm"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
            <FaChartPie className="text-xs text-[#2d5a3d]" /> Budget Estimator Breakdown
          </span>
          {budgetOpen ? <FaChevronUp className="text-xs text-[#6a6a7a]" /> : <FaChevronDown className="text-xs text-[#6a6a7a]" />}
        </button>
        {budgetOpen && (
          <div className="mt-3 rounded-xl border border-[#e8e6e1] bg-white p-5">
            {/* Breakdown table + pie */}
            <div className="flex items-start gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center border-b-2 border-[#1a1a2e] pb-2 mb-1">
                  <span className="flex-1 text-sm font-bold text-[#1a1a2e]">Cost Breakdown</span>
                  <span className="w-32 text-right text-sm font-bold text-[#1a1a2e]">{formatCurrency(budgetGraph.estimatedMid)}</span>
                </div>
                {budgetGraph.breakdown.map((item, i) => (
                  <div key={item.category} className="flex items-center border-b border-[#e8e6e1] py-2">
                    <div className="flex flex-1 items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: POPOUT_BREAKDOWN_COLORS[i % POPOUT_BREAKDOWN_COLORS.length] }} />
                      <span className="text-xs text-[#1a1a2e]">{item.category}</span>
                    </div>
                    <span className="w-10 text-right text-xs text-[#6a6a7a]">{item.pct}%</span>
                    <span className="w-32 text-right text-xs font-medium text-[#1a1a2e]">
                      {item.lowAmount === item.highAmount ? formatCurrency(item.amount) : `${formatCurrency(item.lowAmount)}–${formatCurrency(item.highAmount)}`}
                    </span>
                  </div>
                ))}
                <div className="flex items-center pt-2 mt-1">
                  <div className="flex flex-1 items-center gap-2">
                    <span className="h-3 w-3 shrink-0" />
                    <span className="text-xs font-bold text-[#2d5a3d]">Estimated Total</span>
                  </div>
                  <span className="w-10" />
                  <span className="w-32 text-right text-xs font-bold text-[#2d5a3d]">
                    {formatCurrency(budgetGraph.estimatedLow)} – {formatCurrency(budgetGraph.estimatedHigh)}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <PieChart segments={pieSegments} size={140} />
              </div>
            </div>

            {/* Rationale */}
            <p className="mt-4 border-t border-[#e8e6e1] pt-3 text-[11px] italic leading-relaxed text-[#6a6a7a]">{budgetGraph.rationale}</p>

            {/* Disclaimer */}
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#d4a24c]/30 bg-[#fef9ee] px-3 py-2">
              <FaCircleExclamation className="mt-0.5 shrink-0 text-[10px] text-[#d4a24c]" />
              <p className="text-[10px] leading-relaxed text-[#6a6a7a]">
                <span className="font-semibold text-[#4a4a5a]">Disclaimer:</span> These figures are <span className="font-semibold">estimates only</span> based on typical market rates. Always obtain multiple quotes before committing.
              </p>
            </div>

            {/* Item-level breakdown */}
            {budgetGraph.itemBreakdown.length > 0 && (
              <div className="mt-4 border-t border-[#e8e6e1] pt-3">
                <h4 className="text-xs font-bold text-[#1a1a2e] mb-2">Item Breakdown</h4>
                <div className="text-[10px]">
                  <div className="flex items-center font-semibold text-[#6a6a7a] uppercase tracking-wide pb-1 border-b border-[#e8e6e1]">
                    <span className="flex-1">Item</span>
                    <span className="w-20 text-right">Material</span>
                    <span className="w-20 text-right">Labor</span>
                    <span className="w-24 text-right">Total</span>
                  </div>
                  {budgetGraph.itemBreakdown.map((item) => {
                    const matFixed = item.materialLow === item.materialHigh;
                    const labFixed = item.laborLow === item.laborHigh;
                    const totFixed = item.totalLow === item.totalHigh;
                    return (
                      <div key={item.label} className="flex items-center py-1.5 border-b border-[#e8e6e1]/50">
                        <div className="flex-1 min-w-0 flex items-center gap-1">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${item.source === "must-have" ? "bg-[#2d5a3d]" : "bg-[#d4a24c]"}`} />
                          <span className="text-[#1a1a2e] truncate">{item.label}</span>
                          {item.overridden && <span className="shrink-0 rounded bg-[#2d5a3d]/10 px-1 py-0.5 text-[7px] font-semibold text-[#2d5a3d]">REAL</span>}
                        </div>
                        <span className="w-20 text-right text-[#6a6a7a]">{matFixed ? formatCurrency(item.materialLow) : `${formatCurrency(item.materialLow)}–${formatCurrency(item.materialHigh)}`}</span>
                        <span className="w-20 text-right text-[#6a6a7a]">{labFixed ? formatCurrency(item.laborLow) : `${formatCurrency(item.laborLow)}–${formatCurrency(item.laborHigh)}`}</span>
                        <span className="w-24 text-right font-medium text-[#1a1a2e]">{totFixed ? formatCurrency(item.totalLow) : `${formatCurrency(item.totalLow)}–${formatCurrency(item.totalHigh)}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Timeline (collapsible) ── */}
      {tasks.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setTimelineOpen(v => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-[#e8e6e1] bg-white px-4 py-3.5 transition hover:border-[#d5d3cd] hover:shadow-sm"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
              <FaCalendarDays className="text-xs text-[#2d5a3d]" /> Timeline
              <span className="text-xs font-normal text-[#6a6a7a]">({totalDays} days · {tasks.length} tasks{milestoneCount > 0 && ` · ${milestoneCount} milestones`})</span>
            </span>
            {timelineOpen ? <FaChevronUp className="text-xs text-[#6a6a7a]" /> : <FaChevronDown className="text-xs text-[#6a6a7a]" />}
          </button>
          {timelineOpen && (
            <div className="mt-3 space-y-3">
              {phases.map((phase) => {
                const phaseTasks = tasks.filter((t) => t.phase === phase);
                const phaseDays = phaseTasks.reduce((sum, t) => sum + t.duration, 0);
                const phaseColor = PHASE_COLORS[phase] || "#2d5a3d";
                return (
                  <div key={phase} className="rounded-lg border border-[#e8e6e1] bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: phaseColor }} />
                        <h4 className="text-sm font-semibold text-[#1a1a2e]">{phase}</h4>
                      </div>
                      <span className="text-xs text-[#9a9aaa]">{phaseDays} days</span>
                    </div>
                    <ul className="space-y-1">
                      {phaseTasks.map((t) => (
                        <li key={t.name} className="flex items-center justify-between text-xs text-[#4a4a5a]">
                          <span className="flex items-center gap-1.5">
                            {t.milestone && <FaDiamond className="text-[8px] text-[#d4a24c]" />}
                            {t.name}
                          </span>
                          <span className="text-[#9a9aaa]">{t.duration}d</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Contractors (collapsible, optional) ── */}
      {contractorCount > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setContractorOpen(v => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-[#e8e6e1] bg-white px-4 py-3.5 transition hover:border-[#d5d3cd] hover:shadow-sm"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
              <FaHelmetSafety className="text-xs text-[#2d5a3d]" /> Contractors
              <span className="text-xs font-normal text-[#6a6a7a]">({contractorCount} matched)</span>
            </span>
            {contractorOpen ? <FaChevronUp className="text-xs text-[#6a6a7a]" /> : <FaChevronDown className="text-xs text-[#6a6a7a]" />}
          </button>
          {contractorOpen && (
            <div className="mt-3 space-y-3">
              {thumbtackResults.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[#009fd9]">Thumbtack Results</p>
                  {thumbtackResults.slice(0, 5).map((c, i) => (
                    <div key={i} className="mb-2 flex items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white px-3 py-2.5">
                      {c.thumbnail && (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#f8f7f4]">
                          <Image src={c.thumbnail} alt={c.name} fill className="object-cover" sizes="40px" unoptimized />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#1a1a2e] truncate">{c.name}</span>
                          {c.verified && <span className="text-[8px] font-semibold text-[#2d5a3d]">Verified</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#6a6a7a]">
                          {c.rating > 0 && <span className="flex items-center gap-1">{renderStars(c.rating)} {c.rating}</span>}
                          <span>{c.location}</span>
                        </div>
                      </div>
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-[#2d5a3d] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#234a31]">
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {googleResults.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[#4285f4]">Google Results</p>
                  {googleResults.slice(0, 5).map((c, i) => (
                    <div key={i} className="mb-2 flex items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-[#1a1a2e] truncate">{c.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-[#6a6a7a]">
                          {c.rating > 0 && <span className="flex items-center gap-1">{renderStars(c.rating)} {c.rating}</span>}
                          <span>{c.location}</span>
                        </div>
                      </div>
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-[#2d5a3d] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#234a31]">
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryRow({ icon: Icon, label, iconColor, children }: { icon: typeof FaBullseye; label: string; iconColor: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#e8e6e1] bg-white px-4 py-3.5 transition hover:border-[#d5d3cd] hover:shadow-sm">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-xs" style={{ backgroundColor: iconColor }}>
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9a9aaa]">{label}</div>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
