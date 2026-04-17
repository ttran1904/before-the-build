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
  FaCompass, FaTrash, FaPlus, FaMinus,
  FaCalendarDays, FaHelmetSafety, FaStar, FaStarHalfStroke,
  FaCircleCheck, FaThumbsUp, FaClock, FaDiamond,
  FaArrowUpRightFromSquare, FaLocationDot, FaShieldHalved, FaMagnifyingGlass,
  FaExpand, FaSwatchbook, FaCartShopping, FaSpinner, FaCrosshairs, FaHandPointer,
  FaLink, FaCircleExclamation, FaXmark, FaChevronLeft, FaChevronRight, FaCircleInfo,
  FaDollarSign, FaSackDollar, FaGem,
  FaToilet, FaShower, FaBath, FaCrown,
  FaCamera, FaUpload, FaPhotoFilm, FaFilePdf, FaDownload,
  FaChevronDown, FaChevronUp, FaTableList, FaChartPie,
  FaHouse, FaBookOpen,
} from "react-icons/fa6";
import { useWizardStore, useIdeaBoardStore, type BathroomScope, type BudgetTier, type IdeaBoardItem } from "@/lib/store";
import { BATHROOM_SIZES, type BathroomSize, computeBudgetGraph, type BudgetGraphResult, ftInToMStr, mStrToFtIn, displayArea, type PointedItem, type Product, parseTileDimensions, calcFloorTileArea, calcWallTileArea, DEFAULT_FLOOR_TILE, DEFAULT_WALL_TILE, TILE_LABOR_PER_SQFT, type TileInfo } from "@before-the-build/shared";
import Link from "next/link";
import type { DesignStyle } from "@before-the-build/shared";
import CatalogueView from "@/components/CatalogueView";
import { saveBuildBook } from "@/lib/supabase-sync";

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
  { id: "goal", label: "Goal", icon: FaBullseye, section: "goal" },
  { id: "bathroom-info", label: "Bathroom Info", icon: FaRulerCombined, section: "goal" },
  { id: "must-haves", label: "Must-Haves", icon: FaClipboardList, section: "goal" },
  { id: "budget", label: "Budget", icon: FaCoins, section: "goal" },
  { id: "items-pictures", label: "From Ideas", icon: FaCrosshairs, section: "items-materials" },
  { id: "catalogue", label: "From Catalogue", icon: FaSwatchbook, section: "items-materials" },
  { id: "shopping", label: "From Shopping", icon: FaLink, section: "items-materials" },
  { id: "moodboard", label: "Moodboard", icon: FaImages, section: "visualize" },
  { id: "mockup", label: "Real Mockup", icon: FaCamera, section: "visualize" },
  { id: "summary", label: "Build Book", icon: FaListCheck },
];

const SECTION_HEADERS: Record<string, { label: string; icon: typeof FaBullseye }> = {
  goal: { label: "Goal", icon: FaBullseye },
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
    return store.currentStep;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [currentStep, setCurrentStep] = useState(initialStep);
  const highestStep = store.highestStep;
  const setHighestStep = store.setHighestStep;

  // Sync initial step into store's highestStep on mount
  useEffect(() => {
    setHighestStep(initialStep);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist currentStep to store whenever it changes
  useEffect(() => {
    store.setCurrentStep(currentStep);
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const catalogueProducts = store.catalogueProducts;
  const setCatalogueProducts = store.setCatalogueProducts;
  const shoppingProducts = store.shoppingProducts;
  const setShoppingProducts = store.setShoppingProducts;

  /* Goal sub-step removed — now separate wizard steps */

  /* Auto-create build book only after user has entered data */
  const buildBookCreatedRef = useRef(false);
  useEffect(() => {
    if (buildBookCreatedRef.current) return;
    // Only create if wizard already has a project (resuming) or has content
    const hasContent = store.goals.length > 0 || !!store.scope || store.mustHaves.length > 0;
    if (!store.projectId && !hasContent) return;
    buildBookCreatedRef.current = true;
    saveBuildBook(store.projectId).catch(() => {});
  }, [store.projectId, store.goals.length, store.scope, store.mustHaves.length]);

  /* Budget Builder — deterministic graph engine */
  const [budgetBuilderOpen, setBudgetBuilderOpen] = useState(false);
  const [includeNiceToHaves, setIncludeNiceToHaves] = useState(true);
  const [shoppingCartOpen, setShoppingCartOpen] = useState(false);
  const [cartDetailProduct, setCartDetailProduct] = useState<Product | null>(null);
  const [cartDetailImageIdx, setCartDetailImageIdx] = useState(0);

  /* All selected products across all 3 sources */
  const allSelectedFromPointed = useMemo(() =>
    Object.entries(moodboardPointedItems).flatMap(([imageId, items]) =>
      items
        .filter(p => p.selectedProductIdx !== null && p.products[p.selectedProductIdx!])
        .map(p => ({ product: p.products[p.selectedProductIdx!], source: "ideas" as const, imageId, pointedId: p.id, productIdx: p.selectedProductIdx! }))
    ), [moodboardPointedItems]);

  const allSelectedProducts = useMemo(() => [
    ...allSelectedFromPointed.map(e => e.product),
    ...catalogueProducts,
    ...shoppingProducts,
  ], [allSelectedFromPointed, catalogueProducts, shoppingProducts]);

  /* Cart quantities — keyed by "source:id" */
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const getCartKey = useCallback((source: string, id: string) => `${source}:${id}`, []);
  const getCartQty = useCallback((source: string, id: string) => cartQuantities[getCartKey(source, id)] ?? 1, [cartQuantities, getCartKey]);
  const setCartQty = useCallback((source: string, id: string, qty: number) => {
    setCartQuantities(prev => ({ ...prev, [getCartKey(source, id)]: Math.max(1, qty) }));
  }, [getCartKey]);

  /* Auto-estimate tile quantities for pointed items using price overrides */
  useEffect(() => {
    setCartQuantities(prev => {
      const next = { ...prev };
      for (const entry of allSelectedFromPointed) {
        const key = getCartKey("ideas", entry.pointedId);
        if (next[key] !== undefined) continue; // user already set a quantity
        const pi = (moodboardPointedItems[entry.imageId] || []).find(p => p.id === entry.pointedId);
        if (!pi) continue;
        const overrideLabel = pi.matchedItemLabel || pi.label;
        const override = store.priceOverrides.find(o => o.itemLabel === overrideLabel);
        if (override?.tileInfo) {
          next[key] = override.tileInfo.quantity;
        }
      }
      return next;
    });
  }, [allSelectedFromPointed, moodboardPointedItems, store.priceOverrides, getCartKey]);

  /* Cart subtotal */
  const cartSubtotal = useMemo(() => {
    let total = 0;
    for (const entry of allSelectedFromPointed) {
      const price = entry.product.price ? parseFloat(entry.product.price.replace(/[^0-9.]/g, "")) : 0;
      if (!isNaN(price)) total += price * getCartQty("ideas", entry.pointedId);
    }
    for (let i = 0; i < catalogueProducts.length; i++) {
      const price = catalogueProducts[i].price ? parseFloat(catalogueProducts[i].price.replace(/[^0-9.]/g, "")) : 0;
      if (!isNaN(price)) total += price * getCartQty("catalogue", String(i));
    }
    for (let i = 0; i < shoppingProducts.length; i++) {
      const price = shoppingProducts[i].price ? parseFloat(shoppingProducts[i].price.replace(/[^0-9.]/g, "")) : 0;
      if (!isNaN(price)) total += price * getCartQty("shopping", String(i));
    }
    return total;
  }, [allSelectedFromPointed, catalogueProducts, shoppingProducts, getCartQty]);

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
    allPointedFlat.filter((pi) => !pi.loading && !pi.matchedItemLabel && pi.label !== "Unknown item" && pi.label !== "Could not identify" && pi.label !== "Identifying..."),
  [allPointedFlat]);

  // Map any AI-identified label to a short human-readable category for display
  const CATEGORY_KEYWORDS: [string[], string][] = [
    [["vanity", "bathroom vanity", "sink cabinet", "bath vanity"], "Bath vanity"],
    [["floor tile", "porcelain tile", "ceramic tile", "marble floor", "stone floor", "tile floor"], "Floor tile"],
    [["shower tile", "wall tile", "subway tile", "shower wall", "marble tile", "backsplash tile", "stone tile"], "Wall tile"],
    [["toilet", "commode"], "Toilet"],
    [["bidet"], "Bidet"],
    [["exhaust fan", "vent fan", "bathroom fan"], "Exhaust fan"],
    [["recessed light", "can light", "downlight"], "Recessed lighting"],
    [["walk-in shower", "shower enclosure", "curbless shower"], "Walk-in shower"],
    [["bathtub", "soaking tub", "freestanding tub", "freestanding bath", "soaking bath", "oval bath"], "Bathtub"],
    [["shower door", "glass door", "frameless door"], "Shower door"],
    [["rain showerhead", "rain shower", "rainfall"], "Rain showerhead"],
    [["handheld shower", "hand shower", "detachable shower"], "Handheld showerhead"],
    [["medicine cabinet", "mirrored cabinet"], "Medicine cabinet"],
    [["led mirror", "lighted mirror", "backlit mirror"], "LED mirror"],
    [["mirror"], "Mirror"],
    [["heated floor", "radiant floor", "floor heating"], "Heated floors"],
    [["towel warmer", "towel rack", "heated towel", "towel bar", "towel ring"], "Towel bar/rack"],
    [["grab bar", "safety bar"], "Grab bars"],
    [["shelf", "shelving", "niche", "built-in shelf"], "Shelving"],
    [["dimmer", "light switch"], "Dimmer switch"],
    [["under-cabinet", "cabinet light", "vanity light", "sconce", "wall light"], "Vanity lighting"],
    [["faucet", "tap"], "Faucet"],
    [["showerhead", "shower head"], "Showerhead"],
    [["cabinet", "shaker", "storage"], "Cabinet"],
    [["sink", "basin", "lavatory"], "Sink"],
    [["countertop", "counter top", "marble top", "quartz top", "granite top"], "Countertop"],
    [["hardware", "knob", "handle", "pull", "drawer pull"], "Hardware"],
    [["soap dispenser", "soap dish"], "Soap dispenser"],
    [["toilet paper holder", "tissue holder"], "Toilet paper holder"],
    [["shower bench", "shower seat"], "Shower bench"],
    [["bath mat", "bath rug"], "Bath mat"],
    [["curtain", "shower curtain"], "Shower curtain"],
  ];

  const getCategoryLabel = useCallback((label: string): string => {
    const lower = label.toLowerCase();
    for (const [keywords, category] of CATEGORY_KEYWORDS) {
      if (keywords.some((kw) => lower.includes(kw))) return category;
    }
    // Fallback: strip brand names, dimensions, and model numbers to shorten
    return label
      .replace(/\b\d+(\.\d+)?\s*(in|inch|inches|ft|cm|mm|x)\b\.?/gi, "")
      .replace(/\b[A-Z][a-z]+\s+(Bay|Creek|Hill|Collection|Series)\b/g, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(" ");
  }, []);

  /* Compute actual room sqft — ft+in values are always pre-computed regardless of unit mode */
  const roomSqft = useMemo(() => {
    const wIn = (Number(store.roomWidth) || 0) * 12 + (Number(store.roomWidthIn) || 0);
    const lIn = (Number(store.roomLength) || 0) * 12 + (Number(store.roomLengthIn) || 0);
    if (!wIn || !lIn) return null;
    return Math.round((wIn * lIn) / 144);
  }, [store.roomWidth, store.roomWidthIn, store.roomLength, store.roomLengthIn]);

  /* Budget — nice-to-haves only included when matched in moodboard */
  const budgetGraph: BudgetGraphResult = useMemo(() => {
    // Build combined overrides: pointed items (with cart qty) + catalogue + shopping
    const extraOverrides: typeof store.priceOverrides = [];
    for (let i = 0; i < catalogueProducts.length; i++) {
      const p = catalogueProducts[i];
      const price = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) : null;
      const qty = cartQuantities[`catalogue:${i}`] ?? 1;
      if (price && !isNaN(price)) {
        extraOverrides.push({ itemLabel: `catalogue:${p.title}`, materialCost: Math.round(price * qty), laborCost: Math.round(price * qty * 0.55) });
      }
    }
    for (let i = 0; i < shoppingProducts.length; i++) {
      const p = shoppingProducts[i];
      const price = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) : null;
      const qty = cartQuantities[`shopping:${i}`] ?? 1;
      if (price && !isNaN(price)) {
        extraOverrides.push({ itemLabel: `shopping:${p.title}`, materialCost: Math.round(price * qty), laborCost: Math.round(price * qty * 0.55) });
      }
    }
    return computeBudgetGraph({
      roomSize: store.bathroomSize,
      roomSqft,
      scope: store.scope,
      mustHaves: store.mustHaves,
      niceToHaves: store.niceToHaves.filter(nh => matchedLabels.has(nh)),
      includeNiceToHaves,
      customerBudget: store.budgetAmount,
      priceOverrides: [...store.priceOverrides, ...extraOverrides],
    });
  }, [store.bathroomSize, roomSqft, store.scope, store.mustHaves, store.niceToHaves, store.budgetAmount, store.priceOverrides, includeNiceToHaves, matchedLabels, catalogueProducts, shoppingProducts, cartQuantities]);

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

  /* Goal sub-step 1 validation: bathroom type + dimensions + photos required.
     Also re-used by isStepComplete for sidebar checkmarks. */
  const goalSubStep1Valid = useMemo(() => {
    const hasType = !!store.bathroomSize;

    // Dimensions: in ft mode, ft or in must be non-zero; in m mode, value must be non-zero
    const dimVal = (main: string, inPart: string) =>
      store.measurementUnit === "ft"
        ? (Number(main) || 0) * 12 + (Number(inPart) || 0) > 0
        : Number(main) > 0;

    const hasWidth = dimVal(store.roomWidth, store.roomWidthIn);
    const hasLength = dimVal(store.roomLength, store.roomLengthIn);
    const hasHeight = dimVal(store.roomHeight, store.roomHeightIn);
    const hasPhotos = store.mockupBathroomPhotos.length > 0;

    // Shower/tub dimensions required for types that have them
    const needsShower = store.bathroomSize === "three-quarter" || store.bathroomSize === "full-bath" || store.bathroomSize === "primary";
    const hasShower = !needsShower || (dimVal(store.showerWidth, store.showerWidthIn) && dimVal(store.showerLength, store.showerLengthIn));

    return hasType && hasWidth && hasLength && hasHeight && hasPhotos && hasShower;
  }, [store.bathroomSize, store.roomWidth, store.roomWidthIn, store.roomLength, store.roomLengthIn, store.roomHeight, store.roomHeightIn, store.mockupBathroomPhotos.length, store.showerWidth, store.showerWidthIn, store.showerLength, store.showerLengthIn, store.measurementUnit]);

  /* Determine whether a step is "complete" based on whether the user has
     advanced past it AND its required data is still present. Steps without
     required fields are considered complete once the user has moved past them. */
  const isStepComplete = useCallback((stepIndex: number): boolean => {
    // Can only be complete if we've ever advanced past this step
    if (stepIndex >= highestStep) return false;
    // Step 1 (Bathroom Info) requires dimensions, bathroom type, and photos
    if (stepIndex === 1) return goalSubStep1Valid;
    // All other steps have no required fields — complete once visited past
    return true;
  }, [highestStep, goalSubStep1Valid]);

  const next = () => {
    // Block advancing from bathroom info step if required fields missing
    if (currentStep === 1 && !goalSubStep1Valid) {
      return;
    }
    // Block advancing from must-haves step if nothing selected
    if (currentStep === 2 && store.mustHaves.length === 0 && store.niceToHaves.length === 0) {
      return;
    }
    const nextIdx = Math.min(currentStep + 1, STEPS.length - 1);
    setCurrentStep(nextIdx);
    setHighestStep(nextIdx);
  };
  const back = () => {
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
            const done = i !== currentStep && isStepComplete(i);
            const visited = i <= highestStep;
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
                  onClick={() => {
                    if (visited && !active) {
                      setCurrentStep(i);
                    }
                  }}
                  className={`group flex w-full items-center gap-3 rounded-lg ${isSubStep ? "pl-8" : "pl-3"} pr-3 py-2 text-left transition ${
                    active
                      ? "bg-white/15 text-white"
                      : visited
                        ? "cursor-pointer text-white/80 hover:bg-white/10"
                        : "cursor-not-allowed text-white/35"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition ${
                    active
                      ? "bg-white text-[#2d5a3d]"
                      : done
                        ? "bg-white/25 text-white"
                        : visited && !active
                          ? "bg-white/20 text-white/70"
                          : "bg-white/10 text-white/40"
                  }`}>
                    {done ? <FaCheck className="text-[10px]" /> : <step.icon className="text-[10px]" />}
                  </span>
                  <span className={`${isSubStep ? "text-xs" : "text-sm"} font-medium`}>{step.label}</span>
                  {done && (
                    <FaCircleCheck className="ml-auto text-xs text-white/40" />
                  )}
                  {!done && !active && !visited && (
                    <span className="ml-auto text-[9px] text-white/20">●</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Navigation links */}
        <div className="px-4 py-4 space-y-1 border-t border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white/90">
            <FaHouse className="text-[10px]" /> Dashboard
          </Link>
          <Link href="/explore" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white/90">
            <FaCompass className="text-[10px]" /> Explore
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
          <div className="mx-auto flex items-center justify-between px-8 py-2.5">
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

            {/* Shopping Cart Tracker — only on Items & Materials steps */}
            {[4, 5, 6].includes(currentStep) && (
              <button
                onClick={() => setShoppingCartOpen((v) => !v)}
                className="relative flex items-center gap-2 rounded-lg border border-[#d5d3cd] bg-white px-4 py-2 shadow-sm transition hover:border-[#2d5a3d] hover:shadow-md"
              >
                <FaCartShopping className="text-sm text-[#2d5a3d]" />
                <span className="text-sm font-semibold text-[#3d3d3d]">My Items</span>
                {allSelectedProducts.length > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#2d5a3d] px-1.5 text-[10px] font-bold text-white">
                    {allSelectedProducts.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Shopping Cart Drawer */}
        {shoppingCartOpen && [4, 5, 6].includes(currentStep) && (
          <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setShoppingCartOpen(false)}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
            <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#e8e6e1] px-6 py-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#1a1a2e]">
                  <FaCartShopping className="text-[#2d5a3d]" />
                  Selected Items
                  <span className="rounded-full bg-[#2d5a3d]/10 px-2 py-0.5 text-xs font-medium text-[#2d5a3d]">{allSelectedProducts.length}</span>
                </h3>
                <button onClick={() => setShoppingCartOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#9a9aaa] transition hover:bg-[#f8f7f4] hover:text-[#4a4a5a]">
                  <FaXmark className="text-sm" />
                </button>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {allSelectedProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FaCartShopping className="mb-3 text-3xl text-[#e8e6e1]" />
                    <p className="text-sm font-medium text-[#9a9aaa]">No items selected yet</p>
                    <p className="mt-1 text-xs text-[#c5c3bd]">Select items from Ideas, Catalogue, or Shopping.</p>
                  </div>
                )}

                {/* From Ideas */}
                {allSelectedFromPointed.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#6a6a7a] uppercase tracking-wide">
                      <FaCrosshairs className="text-[10px]" /> From Ideas ({allSelectedFromPointed.length})
                    </h4>
                    <div className="space-y-3">
                      {allSelectedFromPointed.map((entry) => {
                        const unitPrice = entry.product.price ? parseFloat(entry.product.price.replace(/[^0-9.]/g, "")) : null;
                        const qty = getCartQty("ideas", entry.pointedId);
                        const tileDims = parseTileDimensions(entry.product.specs, entry.product.title);
                        return (
                          <div key={entry.pointedId} className="rounded-xl border border-[#e8e6e1] bg-white p-3">
                            {/* Top row: image | name | price */}
                            <div className="flex items-start gap-3">
                              {entry.product.thumbnail && (
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f8f7f4]">
                                  <Image src={entry.product.thumbnail} alt={entry.product.title} fill className="object-cover" sizes="80px" unoptimized />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-medium leading-snug text-[#1a1a2e]">{entry.product.title}</p>
                                {tileDims && <p className="mt-0.5 text-[11px] text-[#6a6a7a]">Tile size: {tileDims.label}</p>}
                              </div>
                              {entry.product.price && (
                                <span className="shrink-0 text-base font-bold text-[#1a1a2e]">{entry.product.price}</span>
                              )}
                            </div>
                            {/* Bottom row: trash + qty controls | line total */}
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setMoodboardPointedItems((prev) => ({
                                      ...prev,
                                      [entry.imageId]: (prev[entry.imageId] || []).map(item =>
                                        item.id === entry.pointedId ? { ...item, selectedProductIdx: null } : item
                                      ),
                                    }));
                                    setCartQuantities(prev => { const n = { ...prev }; delete n[getCartKey("ideas", entry.pointedId)]; return n; });
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#9a9aaa] transition hover:border-red-300 hover:text-red-500"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                                <div className="ml-1 flex items-center rounded-lg border border-[#e8e6e1]">
                                  <button onClick={() => setCartQty("ideas", entry.pointedId, qty - 1)} className="flex h-8 w-8 items-center justify-center text-[#6a6a7a] transition hover:bg-[#f8f7f4]">
                                    <FaMinus className="text-[10px]" />
                                  </button>
                                  <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1) setCartQty("ideas", entry.pointedId, v); }}
                                    className="h-8 w-12 border-x border-[#e8e6e1] text-center text-sm font-medium text-[#1a1a2e] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                  <button onClick={() => setCartQty("ideas", entry.pointedId, qty + 1)} className="flex h-8 w-8 items-center justify-center text-[#6a6a7a] transition hover:bg-[#f8f7f4]">
                                    <FaPlus className="text-[10px]" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => { setCartDetailProduct(entry.product); setCartDetailImageIdx(0); }}
                                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#2d5a3d] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5"
                                  title="View details"
                                >
                                  <FaCircleInfo className="text-xs" />
                                </button>
                              </div>
                              {unitPrice !== null && !isNaN(unitPrice) && qty > 1 && (
                                <span className="text-sm font-semibold text-[#2d5a3d]">${(unitPrice * qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* From Catalogue */}
                {catalogueProducts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#6a6a7a] uppercase tracking-wide">
                      <FaSwatchbook className="text-[10px]" /> From Catalogue ({catalogueProducts.length})
                    </h4>
                    <div className="space-y-3">
                      {catalogueProducts.map((p, i) => {
                        const unitPrice = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) : null;
                        const qty = getCartQty("catalogue", String(i));
                        const catTileDims = parseTileDimensions(p.specs, p.title);
                        return (
                          <div key={i} className="rounded-xl border border-[#e8e6e1] bg-white p-3">
                            <div className="flex items-start gap-3">
                              {p.thumbnail && (
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f8f7f4]">
                                  <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="80px" unoptimized />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-medium leading-snug text-[#1a1a2e]">{p.title}</p>
                                {catTileDims && <p className="mt-0.5 text-[11px] text-[#6a6a7a]">Tile size: {catTileDims.label}</p>}
                              </div>
                              {p.price && <span className="shrink-0 text-base font-bold text-[#1a1a2e]">{p.price}</span>}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setCatalogueProducts((prev) => prev.filter((_, idx) => idx !== i));
                                    setCartQuantities(prev => { const n = { ...prev }; delete n[getCartKey("catalogue", String(i))]; return n; });
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#9a9aaa] transition hover:border-red-300 hover:text-red-500"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                                <div className="ml-1 flex items-center rounded-lg border border-[#e8e6e1]">
                                  <button onClick={() => setCartQty("catalogue", String(i), qty - 1)} className="flex h-8 w-8 items-center justify-center text-[#6a6a7a] transition hover:bg-[#f8f7f4]">
                                    <FaMinus className="text-[10px]" />
                                  </button>
                                  <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1) setCartQty("catalogue", String(i), v); }}
                                    className="h-8 w-12 border-x border-[#e8e6e1] text-center text-sm font-medium text-[#1a1a2e] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                  <button onClick={() => setCartQty("catalogue", String(i), qty + 1)} className="flex h-8 w-8 items-center justify-center text-[#6a6a7a] transition hover:bg-[#f8f7f4]">
                                    <FaPlus className="text-[10px]" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => { setCartDetailProduct(p); setCartDetailImageIdx(0); }}
                                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#2d5a3d] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5"
                                  title="View details"
                                >
                                  <FaCircleInfo className="text-xs" />
                                </button>
                              </div>
                              {unitPrice !== null && !isNaN(unitPrice) && qty > 1 && (
                                <span className="text-sm font-semibold text-[#2d5a3d]">${(unitPrice * qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* From Shopping */}
                {shoppingProducts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#6a6a7a] uppercase tracking-wide">
                      <FaLink className="text-[10px]" /> From Shopping ({shoppingProducts.length})
                    </h4>
                    <div className="space-y-3">
                      {shoppingProducts.map((p, i) => {
                        const unitPrice = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) : null;
                        const qty = getCartQty("shopping", String(i));
                        const shopTileDims = parseTileDimensions(p.specs, p.title);
                        return (
                          <div key={i} className="rounded-xl border border-[#e8e6e1] bg-white p-3">
                            <div className="flex items-start gap-3">
                              {p.thumbnail && (
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f8f7f4]">
                                  <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="80px" unoptimized />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-medium leading-snug text-[#1a1a2e]">{p.title}</p>
                                {shopTileDims && <p className="mt-0.5 text-[11px] text-[#6a6a7a]">Tile size: {shopTileDims.label}</p>}
                              </div>
                              {p.price && <span className="shrink-0 text-base font-bold text-[#1a1a2e]">{p.price}</span>}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setShoppingProducts((prev) => prev.filter((_, idx) => idx !== i));
                                    setCartQuantities(prev => { const n = { ...prev }; delete n[getCartKey("shopping", String(i))]; return n; });
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#9a9aaa] transition hover:border-red-300 hover:text-red-500"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                                <div className="ml-1 flex items-center rounded-lg border border-[#e8e6e1]">
                                  <button onClick={() => setCartQty("shopping", String(i), qty - 1)} className="flex h-8 w-8 items-center justify-center text-[#6a6a7a] transition hover:bg-[#f8f7f4]">
                                    <FaMinus className="text-[10px]" />
                                  </button>
                                  <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1) setCartQty("shopping", String(i), v); }}
                                    className="h-8 w-12 border-x border-[#e8e6e1] text-center text-sm font-medium text-[#1a1a2e] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                  <button onClick={() => setCartQty("shopping", String(i), qty + 1)} className="flex h-8 w-8 items-center justify-center text-[#6a6a7a] transition hover:bg-[#f8f7f4]">
                                    <FaPlus className="text-[10px]" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => { setCartDetailProduct(p); setCartDetailImageIdx(0); }}
                                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#2d5a3d] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5"
                                  title="View details"
                                >
                                  <FaCircleInfo className="text-xs" />
                                </button>
                              </div>
                              {unitPrice !== null && !isNaN(unitPrice) && qty > 1 && (
                                <span className="text-sm font-semibold text-[#2d5a3d]">${(unitPrice * qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with subtotal */}
              <div className="border-t border-[#e8e6e1] px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6a6a7a]">Subtotal</span>
                  <span className="text-lg font-bold text-[#2d5a3d]">
                    ${cartSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cart Product Detail Modal */}
        {cartDetailProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setCartDetailProduct(null)}>
            <div className="relative mx-4 flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setCartDetailProduct(null)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#4a4a5a] shadow-md transition hover:bg-[#f8f7f4] hover:text-[#1a1a2e]"
              >
                <FaXmark className="text-sm" />
              </button>
              <div className="flex flex-col overflow-y-auto md:flex-row">
                {/* Left: Image gallery */}
                <div className="relative flex w-full flex-col bg-[#f8f7f4] md:w-1/2">
                  <div className="relative aspect-square w-full overflow-hidden">
                    {((cartDetailProduct.images ?? []).length > 0 ? cartDetailProduct.images : [cartDetailProduct.thumbnail]).filter(Boolean).map((img, i) => (
                      <Image
                        key={i}
                        src={img}
                        alt={`${cartDetailProduct.title} - view ${i + 1}`}
                        fill
                        className={`object-contain transition-opacity duration-200 ${i === cartDetailImageIdx ? "opacity-100" : "opacity-0"}`}
                        sizes="400px"
                        unoptimized
                      />
                    ))}
                    {((cartDetailProduct.images ?? []).length > 1) && (
                      <>
                        <button
                          onClick={() => setCartDetailImageIdx((prev) => (prev - 1 + (cartDetailProduct.images ?? []).length) % (cartDetailProduct.images ?? []).length)}
                          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#4a4a5a] shadow transition hover:bg-white"
                        >
                          <FaChevronLeft className="text-xs" />
                        </button>
                        <button
                          onClick={() => setCartDetailImageIdx((prev) => (prev + 1) % (cartDetailProduct.images ?? []).length)}
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#4a4a5a] shadow transition hover:bg-white"
                        >
                          <FaChevronRight className="text-xs" />
                        </button>
                      </>
                    )}
                  </div>
                  {(cartDetailProduct.images ?? []).length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto p-3">
                      {(cartDetailProduct.images ?? []).map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setCartDetailImageIdx(i)}
                          className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                            i === cartDetailImageIdx ? "border-[#2d5a3d]" : "border-transparent hover:border-[#d5d3cd]"
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
                  <h3 className="text-lg font-bold text-[#1a1a2e] leading-snug">{cartDetailProduct.title}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    {cartDetailProduct.price && (
                      <span className="text-xl font-bold text-[#2d5a3d]">{cartDetailProduct.price}</span>
                    )}
                    <span className="rounded-full bg-[#f8f7f4] px-2.5 py-0.5 text-xs text-[#6a6a7a]">{cartDetailProduct.source}</span>
                  </div>

                  {/* Tile dimensions highlight */}
                  {(() => {
                    const dims = parseTileDimensions(cartDetailProduct.specs, cartDetailProduct.title);
                    return dims ? (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#2d5a3d]/5 px-3 py-2">
                        <FaRuler className="text-xs text-[#2d5a3d]" />
                        <span className="text-sm font-medium text-[#2d5a3d]">Tile size: {dims.label}</span>
                      </div>
                    ) : null;
                  })()}

                  {/* Specifications */}
                  {Object.keys(cartDetailProduct.specs ?? {}).length > 0 && (
                    <div className="mt-5">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9a9aaa]">Specifications</h4>
                      <div className="divide-y divide-[#f0eeea]">
                        {Object.entries(cartDetailProduct.specs ?? {}).slice(0, 16).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-4 py-2">
                            <span className="text-xs text-[#6a6a7a]">{key}</span>
                            <span className="text-right text-xs font-medium text-[#1a1a2e]">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.keys(cartDetailProduct.specs ?? {}).length === 0 && (
                    <div className="mt-5 rounded-xl bg-[#f8f7f4] p-4 text-center">
                      <p className="text-xs text-[#9a9aaa]">Detailed specifications not available. Visit the product page for more info.</p>
                    </div>
                  )}
                  <div className="mt-auto pt-5">
                    <a
                      href={cartDetailProduct.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d5a3d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#234a31]"
                    >
                      <FaArrowUpRightFromSquare className="text-xs" />
                      View on {cartDetailProduct.source || "Store"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`mx-auto flex flex-1 flex-col justify-center px-8 py-10 ${[4, 5, 6, 7, 8].includes(currentStep) ? "max-w-[1400px]" : currentStep === 2 ? "max-w-6xl" : "max-w-3xl"} w-full ${[4, 5, 6, 7, 8].includes(currentStep) && (store.mustHaves.length > 0 || store.niceToHaves.length > 0) ? "pr-[170px]" : ""}`}>
          {currentStep === 0 && <GoalStep />}
          {currentStep === 1 && <BathroomInfoStep />}
          {currentStep > 1 && (
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5">
            {currentStep === 2 && <MustHavesStep />}
            {currentStep === 3 && <BudgetStep />}
            {currentStep === 4 && <MoodboardStep view="items-pictures" pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} catalogueProducts={catalogueProducts} setCatalogueProducts={setCatalogueProducts} shoppingProducts={shoppingProducts} setShoppingProducts={setShoppingProducts} />}
            {currentStep === 5 && <MoodboardStep view="catalogue" pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} catalogueProducts={catalogueProducts} setCatalogueProducts={setCatalogueProducts} shoppingProducts={shoppingProducts} setShoppingProducts={setShoppingProducts} />}
            {currentStep === 6 && <MoodboardStep view="shopping" pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} catalogueProducts={catalogueProducts} setCatalogueProducts={setCatalogueProducts} shoppingProducts={shoppingProducts} setShoppingProducts={setShoppingProducts} />}
            {currentStep === 7 && <MoodboardStep view="moodboard" pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} catalogueProducts={catalogueProducts} setCatalogueProducts={setCatalogueProducts} shoppingProducts={shoppingProducts} setShoppingProducts={setShoppingProducts} />}
            {currentStep === 8 && <MoodboardStep view="mockup" pointedItems={moodboardPointedItems} setPointedItems={setMoodboardPointedItems} manualProducts={moodboardManualProducts} setManualProducts={setMoodboardManualProducts} dragPositions={moodboardDragPositions} setDragPositions={setMoodboardDragPositions} catalogueProducts={catalogueProducts} setCatalogueProducts={setCatalogueProducts} shoppingProducts={shoppingProducts} setShoppingProducts={setShoppingProducts} />}
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
                disabled={(currentStep === 1 && !goalSubStep1Valid) || (currentStep === 2 && store.mustHaves.length === 0 && store.niceToHaves.length === 0)}
                className="flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31] disabled:opacity-40 disabled:cursor-not-allowed"
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
      {[4, 5, 6, 7, 8].includes(currentStep) && (store.mustHaves.length > 0 || store.niceToHaves.length > 0) && (
        <div
          className="fixed z-20 flex items-center"
          style={{ top: "52px", right: "-16px", width: "200px", height: "calc(100vh - 52px)" }}
        >
          <div className="max-h-full overflow-y-auto pl-3">
            <aside className="rounded-l-2xl rounded-tr-none rounded-br-none border border-r-0 border-[#e8e6e1] bg-white shadow-lg shadow-black/5">
              <div className="px-5 pt-5 pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#1a1a2e]">
                  <FaClipboardList className="text-xs text-[#2d5a3d]" />
                  Checklist
                </h3>
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

              {/* New Items (unmatched from moodboard + catalogue) */}
              {(unmatchedItems.length > 0 || moodboardManualProducts.length > 0) && (() => {
                // Deduplicate by category so we show each category only once
                const seen = new Set<string>();
                const uniqueCategories: { id: string; category: string }[] = [];
                for (const pi of unmatchedItems) {
                  const cat = getCategoryLabel(pi.label);
                  if (!seen.has(cat)) {
                    seen.add(cat);
                    uniqueCategories.push({ id: pi.id, category: cat });
                  }
                }
                for (const mp of moodboardManualProducts) {
                  const cat = getCategoryLabel(mp.title);
                  if (!seen.has(cat)) {
                    seen.add(cat);
                    uniqueCategories.push({ id: `manual-${mp.url}`, category: cat });
                  }
                }
                return (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#6a6a7a] uppercase tracking-wide">
                      <FaPlus className="text-[10px]" /> New Items
                    </h4>
                    <div className="mt-2 space-y-1.5">
                      {uniqueCategories.map(({ id, category }) => (
                        <div key={id} className="flex items-center gap-2 rounded-lg bg-[#2d5a3d]/5 px-3 py-1.5 text-sm">
                          <FaCheck className="shrink-0 text-[10px] text-[#5b8c6e]" />
                          <span className="flex-1 text-[#4a4a5a] truncate">{category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
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
                      <div key={item.label} className="flex flex-col py-2 border-b border-[#e8e6e1]/50 group hover:bg-[#e8e6e1]/30 -mx-2 px-2 rounded transition">
                        <div className="flex items-center">
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
                        {item.tileInfo && (
                          <div className="ml-3 mt-0.5 text-[9px] text-[#6a6a7a]">
                            {item.tileInfo.quantity} tiles @ {item.tileInfo.tileSizeLabel} · {item.tileInfo.coverageSqft.toFixed(1)} sq ft
                          </div>
                        )}
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

/* ── Goal Step (page 1: Priorities + Scope, page 2: Bathroom Type + Room Size + Photos) ── */
function GoalStep() {
  const store = useWizardStore();
  const { goals, toggleGoal, scope, setScope } = store;

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

/* ────────────────────────────────────────────────────────
   Bathroom Info Step — Type, Dimensions, Photos
   ──────────────────────────────────────────────────────── */
function BathroomInfoStep() {
  const store = useWizardStore();
  const { bathroomSize, setBathroomSize,
    roomWidth, roomWidthIn, roomLength, roomLengthIn, roomHeight, roomHeightIn,
    roomWidthM, roomLengthM, roomHeightM,
    showerWidth, showerWidthIn, showerLength, showerLengthIn,
    showerWidthM, showerLengthM,
    measurementUnit } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Dimension helpers ── */
  const handleDim = (
    ftKey: string, inKey: string, mKey: string,
    field: "ft" | "in" | "m",
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    const updates: Record<string, string> = {};
    if (field === "ft") {
      updates[ftKey] = raw;
      updates[mKey] = ftInToMStr(raw, (store as any)[inKey] || "");
    } else if (field === "in") {
      updates[inKey] = raw;
      updates[mKey] = ftInToMStr((store as any)[ftKey] || "", raw);
    } else {
      updates[mKey] = raw;
      const converted = mStrToFtIn(raw);
      updates[ftKey] = converted.ft;
      updates[inKey] = converted.inches;
    }
    store.setDimensions(updates);
  };

  const handleUnitToggle = (newUnit: "ft" | "m") => {
    if (newUnit === measurementUnit) return;
    store.setDimensions({
      measurementUnit: newUnit,
      roomWidthM: roomWidthM || ftInToMStr(roomWidth, roomWidthIn),
      roomLengthM: roomLengthM || ftInToMStr(roomLength, roomLengthIn),
      roomHeightM: roomHeightM || ftInToMStr(roomHeight, roomHeightIn),
      showerWidthM: showerWidthM || ftInToMStr(showerWidth, showerWidthIn),
      showerLengthM: showerLengthM || ftInToMStr(showerLength, showerLengthIn),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          store.addMockupPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const DimensionInput = ({ label, value, valueIn, valueM, onChangeFt, onChangeIn, onChangeM, placeholder }: {
    label: string; value: string; valueIn: string; valueM: string;
    onChangeFt: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeIn: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeM: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  }) => (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#4a4a5a]">
        <FaRuler className="text-xs text-[#2d5a3d]" />
        {label} <span className="text-red-400">*</span>
      </label>
      {measurementUnit === "ft" ? (
        <div className="flex items-center gap-1.5">
          <div className="relative w-32">
            <input type="text" inputMode="decimal" placeholder={placeholder || "0"} value={value} onChange={onChangeFt}
              className="w-full rounded-xl border-2 border-[#e8e6e1] bg-white py-3 pl-4 pr-8 text-lg font-bold text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-1 focus:ring-[#2d5a3d]" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#9a9aaa]">ft</span>
          </div>
          <div className="relative w-16">
            <input type="text" inputMode="decimal" placeholder="0" value={valueIn} onChange={onChangeIn}
              className="w-full rounded-lg border border-[#e8e6e1] bg-[#fafaf8] py-2.5 pl-3 pr-6 text-sm text-[#6a6a7a] outline-none transition focus:border-[#2d5a3d] focus:ring-1 focus:ring-[#2d5a3d] focus:text-[#1a1a2e]" />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#b0b0ba]">in</span>
          </div>
        </div>
      ) : (
        <div className="relative w-32">
          <input type="text" inputMode="decimal" placeholder={placeholder || "0"} value={valueM} onChange={onChangeM}
            className="w-full rounded-xl border-2 border-[#e8e6e1] bg-white py-3 pl-4 pr-10 text-lg font-bold text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-1 focus:ring-[#2d5a3d]" />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#9a9aaa]">m</span>
        </div>
      )}
    </div>
  );

  const SmallDimensionInput = ({ label, value, valueIn, valueM, onChangeFt, onChangeIn, onChangeM }: {
    label: string; value: string; valueIn: string; valueM: string;
    onChangeFt: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeIn: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeM: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="flex-1">
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#4a4a5a]">
        {label} <span className="text-red-400">*</span>
      </label>
      {measurementUnit === "ft" ? (
        <div className="flex gap-1">
          <div className="relative flex-1">
            <input type="text" inputMode="decimal" placeholder="0" value={value} onChange={onChangeFt}
              className="w-full rounded-lg border-2 border-[#e8e6e1] bg-white py-2.5 pl-3 pr-7 text-base font-bold text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-1 focus:ring-[#2d5a3d]" />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#9a9aaa]">ft</span>
          </div>
          <div className="relative flex-1">
            <input type="text" inputMode="decimal" placeholder="0" value={valueIn} onChange={onChangeIn}
              className="w-full rounded-lg border-2 border-[#e8e6e1] bg-white py-2.5 pl-3 pr-7 text-base font-bold text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-1 focus:ring-[#2d5a3d]" />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#9a9aaa]">in</span>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input type="text" inputMode="decimal" placeholder="0" value={valueM} onChange={onChangeM}
            className="w-full rounded-lg border-2 border-[#e8e6e1] bg-white py-2.5 pl-3 pr-8 text-base font-bold text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-1 focus:ring-[#2d5a3d]" />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#9a9aaa]">m</span>
        </div>
      )}
    </div>
  );

  const displayAreaLocal = (w: string, wIn: string, l: string, lIn: string, unit: "ft" | "m"): string => {
    if (unit === "ft") {
      const wTotal = (Number(w) || 0) + (Number(wIn) || 0) / 12;
      const lTotal = (Number(l) || 0) + (Number(lIn) || 0) / 12;
      if (wTotal === 0 || lTotal === 0) return "";
      return `${(wTotal * lTotal).toFixed(1)} sq ft`;
    }
    const wVal = Number(w) || 0;
    const lVal = Number(l) || 0;
    if (wVal === 0 || lVal === 0) return "";
    return `${(wVal * lVal).toFixed(2)} m²`;
  };

  const roomArea = measurementUnit === "ft"
    ? displayAreaLocal(roomWidth, roomWidthIn, roomLength, roomLengthIn, "ft")
    : displayAreaLocal(roomWidthM, "", roomLengthM, "", "m");
  const showerArea = measurementUnit === "ft"
    ? displayAreaLocal(showerWidth, showerWidthIn, showerLength, showerLengthIn, "ft")
    : displayAreaLocal(showerWidthM, "", showerLengthM, "", "m");

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5 space-y-10">
          {/* ── Question 1: Bathroom Type ── */}
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a2e]">What is the bathroom type? <span className="text-red-400 text-lg">*</span></h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {BATHROOM_SIZES.map((s) => {
                const sizeIcon = {
                  "half-bath": <FaToilet className="text-lg" />,
                  "three-quarter": <FaShower className="text-lg" />,
                  "full-bath": <FaBath className="text-lg" />,
                  primary: <FaCrown className="text-lg" />,
                }[s.id];
                const selected = bathroomSize === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setBathroomSize(selected ? "" as BathroomSize : s.id)}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      selected
                        ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
                        : "border-[#e8e6e1] hover:border-[#d5d3cd]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#2d5a3d]">{sizeIcon}</span>
                      <div>
                        <div className="font-semibold text-[#1a1a2e]">{s.label}</div>
                        <div className="text-xs text-[#6a6a7a]">{s.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Question 2: Room Dimensions ── */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#1a1a2e]">What is the room size? <span className="text-red-400 text-lg">*</span></h2>
              <div className="flex items-center rounded-lg border border-[#e8e6e1] bg-[#fafaf8] p-0.5">
                <button
                  onClick={() => handleUnitToggle("ft")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    measurementUnit === "ft"
                      ? "bg-[#2d5a3d] text-white shadow-sm"
                      : "text-[#6a6a7a] hover:text-[#1a1a2e]"
                  }`}
                >
                  ft
                </button>
                <button
                  onClick={() => handleUnitToggle("m")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    measurementUnit === "m"
                      ? "bg-[#2d5a3d] text-white shadow-sm"
                      : "text-[#6a6a7a] hover:text-[#1a1a2e]"
                  }`}
                >
                  m
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-[#6a6a7a]">Enter dimensions in {measurementUnit === "ft" ? "feet & inches" : "meters"}.</p>

            <div className="mt-5 grid grid-cols-2 gap-x-10 gap-y-5">
              <DimensionInput label="Width" value={roomWidth} valueIn={roomWidthIn} valueM={roomWidthM}
                onChangeFt={handleDim("roomWidth", "roomWidthIn", "roomWidthM", "ft")}
                onChangeIn={handleDim("roomWidth", "roomWidthIn", "roomWidthM", "in")}
                onChangeM={handleDim("roomWidth", "roomWidthIn", "roomWidthM", "m")} />
              <DimensionInput label="Length" value={roomLength} valueIn={roomLengthIn} valueM={roomLengthM}
                onChangeFt={handleDim("roomLength", "roomLengthIn", "roomLengthM", "ft")}
                onChangeIn={handleDim("roomLength", "roomLengthIn", "roomLengthM", "in")}
                onChangeM={handleDim("roomLength", "roomLengthIn", "roomLengthM", "m")} />
              <DimensionInput label="Ceiling Height" value={roomHeight} valueIn={roomHeightIn} valueM={roomHeightM}
                onChangeFt={handleDim("roomHeight", "roomHeightIn", "roomHeightM", "ft")}
                onChangeIn={handleDim("roomHeight", "roomHeightIn", "roomHeightM", "in")}
                onChangeM={handleDim("roomHeight", "roomHeightIn", "roomHeightM", "m")}
                placeholder={measurementUnit === "ft" ? "8" : "2.4"} />
              {roomArea && (
                <div className="flex items-end pb-1">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d]/8 px-3.5 py-2 text-sm font-semibold text-[#2d5a3d]">
                    <FaRulerCombined className="text-xs opacity-70" />
                    Floor area: {roomArea}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Sub-question: Shower / Tub area dimensions (after room size) ── */}
          {(bathroomSize === "three-quarter" || bathroomSize === "full-bath" || bathroomSize === "primary") && (
            <div className="-mt-4 ml-5 rounded-xl border border-[#e8e6e1] bg-[#fafaf8] p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-[#1a1a2e]">
                {bathroomSize === "three-quarter" ? <FaShower className="text-sm text-[#2d5a3d]" /> : <FaBath className="text-sm text-[#2d5a3d]" />}
                {bathroomSize === "three-quarter" ? "Shower area dimensions" : "Shower + tub area dimensions"}
              </h3>
              <div className="mt-3 flex items-end gap-3">
                <SmallDimensionInput label="Width" value={showerWidth} valueIn={showerWidthIn} valueM={showerWidthM}
                  onChangeFt={handleDim("showerWidth", "showerWidthIn", "showerWidthM", "ft")}
                  onChangeIn={handleDim("showerWidth", "showerWidthIn", "showerWidthM", "in")}
                  onChangeM={handleDim("showerWidth", "showerWidthIn", "showerWidthM", "m")} />
                <span className="pb-3 text-sm font-medium text-[#9a9aaa]">×</span>
                <SmallDimensionInput label="Length" value={showerLength} valueIn={showerLengthIn} valueM={showerLengthM}
                  onChangeFt={handleDim("showerLength", "showerLengthIn", "showerLengthM", "ft")}
                  onChangeIn={handleDim("showerLength", "showerLengthIn", "showerLengthM", "in")}
                  onChangeM={handleDim("showerLength", "showerLengthIn", "showerLengthM", "m")} />
                {showerArea && (
                  <span className="pb-3 flex items-center gap-1 text-sm font-medium text-[#2d5a3d] whitespace-nowrap">
                    = {showerArea.replace("≈ ", "")}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Question 3: Upload Bathroom Photos ── */}
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a2e]">Upload your bathroom photos <span className="text-red-400 text-lg">*</span></h2>
            <p className="mt-1 text-sm text-[#6a6a7a]">Upload at least 1 angle of your current bathroom.</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
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

function BudgetStep() {
  const { budgetAmount, setBudgetAmount } = useWizardStore();

  return (
    <div className="mx-auto max-w-lg text-center">
      <FaSackDollar className="mx-auto text-4xl text-[#d4a24c]" />
      <h2 className="mt-4 text-2xl font-bold text-[#1a1a2e]">What&apos;s your budget?</h2>

      <div className="mt-8 flex justify-center">
        <div className="relative w-72">
          <FaDollarSign className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg text-[#6a6a7a]" />
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
            className="w-full rounded-2xl border-2 border-[#e8e6e1] bg-white py-4 pl-12 pr-5 text-center text-2xl font-bold text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-1 focus:ring-[#2d5a3d]"
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-[#9a9aaa]">
        You can click the Budget Estimate bar above to see the detailed breakdown.
      </p>
    </div>
  );
}

/* ── Moodboard Step (discover items + moodboard view) ── */

function MoodboardStep({ view, pointedItems, setPointedItems, manualProducts, setManualProducts, dragPositions, setDragPositions, catalogueProducts, setCatalogueProducts, shoppingProducts, setShoppingProducts }: {
  view: "items-pictures" | "catalogue" | "shopping" | "moodboard" | "mockup";
  pointedItems: Record<string, PointedItem[]>;
  setPointedItems: React.Dispatch<React.SetStateAction<Record<string, PointedItem[]>>>;
  manualProducts: Product[];
  setManualProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  dragPositions: Record<number, { x: number; y: number }>;
  setDragPositions: React.Dispatch<React.SetStateAction<Record<number, { x: number; y: number }>>>;
  catalogueProducts: Product[];
  setCatalogueProducts: (updater: Product[] | ((prev: Product[]) => Product[])) => void;
  shoppingProducts: Product[];
  setShoppingProducts: (updater: Product[] | ((prev: Product[]) => Product[])) => void;
}) {
  const { items, removeItem } = useIdeaBoardStore();
  const { mustHaves, niceToHaves, setPriceOverride, removePriceOverride,
    roomWidth, roomWidthIn, roomLength, roomLengthIn, roomHeight, roomHeightIn,
    showerWidth, showerWidthIn, showerLength, showerLengthIn } = useWizardStore();
  const [selectingImageId, setSelectingImageId] = useState<string | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeIdeaIdx, setActiveIdeaIdx] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

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
  } | {
    product: Product;
    source: "catalogue";
    catalogueIdx: number;
  } | {
    product: Product;
    source: "shopping";
    shoppingIdx: number;
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
    ...catalogueProducts.map((product, i) => ({
      product,
      source: "catalogue" as const,
      catalogueIdx: i,
    })),
    ...shoppingProducts.map((product, i) => ({
      product,
      source: "shopping" as const,
      shoppingIdx: i,
    })),
  ];

  const selectedProducts = selectedEntries.map(e => e.product);

  const deselectEntry = (entry: SelectedProductEntry) => {
    if (entry.source === "pointed") {
      toggleProductSelection(entry.imageId, entry.pointedId, entry.productIdx);
    } else if (entry.source === "catalogue") {
      setCatalogueProducts((prev) => prev.filter((_, i) => i !== entry.catalogueIdx));
    } else if (entry.source === "shopping") {
      setShoppingProducts((prev) => prev.filter((_, i) => i !== entry.shoppingIdx));
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

  // Labels that represent tile items for smart quantity calculation
  const TILE_LABELS = new Set(["New tile (floor)", "Non-slip flooring", "New tile (shower walls)"]);
  const FLOOR_TILE_LABELS = new Set(["New tile (floor)", "Non-slip flooring"]);

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
        const unitPrice = parsePrice(product.price);
        if (unitPrice === null) return;

        // Smart tile calculation: compute quantity from room dimensions + tile size
        if (TILE_LABELS.has(overrideLabel)) {
          const tileDims = parseTileDimensions(product.specs, product.title) ?? (FLOOR_TILE_LABELS.has(overrideLabel) ? DEFAULT_FLOOR_TILE : DEFAULT_WALL_TILE);
          const isFloor = FLOOR_TILE_LABELS.has(overrideLabel);

          let tileInfo: TileInfo | undefined;

          if (isFloor) {
            // Floor tile: use room dimensions, subtract bathtub if present
            const rWidthIn = (Number(roomWidth) || 0) * 12 + (Number(roomWidthIn) || 0);
            const rLengthIn = (Number(roomLength) || 0) * 12 + (Number(roomLengthIn) || 0);

            if (rWidthIn > 0 && rLengthIn > 0) {
              const hasBathtub = mustHaves.includes("Bathtub") || niceToHaves.includes("Bathtub");
              const area = calcFloorTileArea({ roomWidthIn: rWidthIn, roomLengthIn: rLengthIn, hasBathtub, hasWalkInShower: mustHaves.includes("Walk-in shower") || niceToHaves.includes("Walk-in shower") }, tileDims);
              const materialCost = Math.round(unitPrice * area.quantity);
              const laborCost = Math.round(area.netSqft * TILE_LABOR_PER_SQFT);
              tileInfo = {
                tileSizeLabel: tileDims.label,
                tileWidthIn: tileDims.widthIn,
                tileHeightIn: tileDims.heightIn,
                quantity: area.quantity,
                coverageSqft: area.netSqft,
                unitPrice,
                wasteFactor: area.wasteFactor,
                breakdown: area.breakdown,
              };
              setPriceOverride({ itemLabel: overrideLabel, materialCost, laborCost, tileInfo });
              return;
            }
          } else {
            // Wall tile: use shower dimensions
            const sWidthIn = (Number(showerWidth) || 0) * 12 + (Number(showerWidthIn) || 0);
            const sLengthIn = (Number(showerLength) || 0) * 12 + (Number(showerLengthIn) || 0);
            const wallHeightIn = (Number(roomHeight) || 0) * 12 + (Number(roomHeightIn) || 0);

            if (sWidthIn > 0 && sLengthIn > 0) {
              const area = calcWallTileArea({ showerWidthIn: sWidthIn, showerLengthIn: sLengthIn, wallHeightIn: wallHeightIn || undefined }, tileDims);
              const materialCost = Math.round(unitPrice * area.quantity);
              const laborCost = Math.round(area.netSqft * TILE_LABOR_PER_SQFT);
              tileInfo = {
                tileSizeLabel: tileDims.label,
                tileWidthIn: tileDims.widthIn,
                tileHeightIn: tileDims.heightIn,
                quantity: area.quantity,
                coverageSqft: area.netSqft,
                unitPrice,
                wasteFactor: area.wasteFactor,
                breakdown: area.breakdown,
              };
              setPriceOverride({ itemLabel: overrideLabel, materialCost, laborCost, tileInfo });
              return;
            }
          }
        }

        // Non-tile items or tile items without room dimensions: use simple price + labor
        setPriceOverride({
          itemLabel: overrideLabel,
          materialCost: unitPrice,
          laborCost: estimateLabor(unitPrice),
        });
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

  const handleShoppingLinkSubmit = async () => {
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
        setShoppingProducts(prev => [...prev, data]);
        setManualLinkUrl("");
      }
    } catch {
      setManualLinkError("Could not pull the item from the link. There is an error.");
    } finally {
      setManualLinkLoading(false);
    }
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

      {/* ── SECTION: From Ideas ── */}
      {view === "items-pictures" && (
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a2e]">Items from Ideas</h2>
              <p className="mt-2 text-sm text-[#6a6a7a]">
                Select an idea image, then draw a box around any item. We&apos;ll find where to buy it.
              </p>
            </div>
            {items.length > 0 && (
              <Link
                href="/explore?from=moodboard"
                className="flex shrink-0 items-center gap-2 rounded-lg bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
              >
                <FaCompass className="text-xs" /> Explore Ideas
              </Link>
            )}
          </div>

          {items.length === 0 ? (
            <Link
              href="/explore?from=moodboard"
              className="mt-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#d5d3cd] p-10 transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5"
            >
              <FaImages className="text-3xl text-[#9a9aaa]" />
              <span className="text-sm font-medium text-[#6a6a7a]">No images saved yet &mdash; go to Explore to build your idea board</span>
              <span className="flex items-center gap-1.5 rounded-lg bg-[#2d5a3d] px-4 py-2 text-xs font-semibold text-white">
                <FaCompass className="text-[10px]" /> Open Explore
              </span>
            </Link>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Thumbnail carousel */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {items.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveIdeaIdx(idx)}
                    className={`relative shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      idx === activeIdeaIdx
                        ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/20"
                        : "border-[#e8e6e1] hover:border-[#c5c3bd]"
                    }`}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.title || `Idea ${idx + 1}`}
                      width={120}
                      height={90}
                      className="h-[90px] w-[120px] object-cover"
                      unoptimized
                    />
                    {idx === activeIdeaIdx && (
                      <div className="absolute inset-0 border-2 border-[#2d5a3d] rounded-xl" />
                    )}
                    {/* Badge showing found items count */}
                    {(pointedItems[item.id] || []).length > 0 && (
                      <span className="absolute top-1 right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#2d5a3d] px-1 text-[9px] font-bold text-white shadow">
                        {(pointedItems[item.id] || []).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Active idea: large image + find button + items */}
              {(() => {
                const item = items[activeIdeaIdx];
                if (!item) return null;
                const pointed = pointedItems[item.id] || [];
                const isSelecting = selectingImageId === item.id;

                return (
                  <div className="overflow-hidden rounded-2xl border border-[#e8e6e1]">
                    {/* Action bar */}
                    <div className="flex items-center justify-between border-b border-[#e8e6e1] bg-[#faf9f6] px-5 py-3">
                      <span className="text-xs font-medium text-[#6a6a7a]">{item.title || `Idea ${activeIdeaIdx + 1}`}</span>
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-[#9a9aaa] transition hover:bg-red-50 hover:text-red-500"
                      >
                        <FaTrash className="text-[10px]" /> Remove
                      </button>
                    </div>

                    {/* Large image + Find This Item button */}
                    <div className="flex flex-col items-center p-6">
                      <div
                        className={`relative w-full max-w-2xl select-none overflow-hidden rounded-xl ${isSelecting ? "cursor-crosshair ring-2 ring-[#2d5a3d] ring-offset-2" : ""}`}
                        onMouseDown={(e) => handleMouseDown(e, item.id)}
                        onMouseMove={handleMouseMove}
                        onMouseUp={(e) => handleMouseUp(e, item.id, item.imageUrl)}
                        onMouseLeave={() => { if (isSelecting) { setDrawStart(null); setDrawCurrent(null); } }}
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.title || "Inspiration"}
                          width={800}
                          height={600}
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
                        className={`mt-4 flex w-fit items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition ${
                          isSelecting
                            ? "bg-[#2d5a3d] text-white shadow-md"
                            : "border-2 border-[#2d5a3d] text-[#2d5a3d] hover:bg-[#2d5a3d]/5"
                        }`}
                      >
                        <FaHandPointer className="text-xs" />
                        {isSelecting ? "Drawing mode \u2014 cancel" : "Find This Item"}
                      </button>
                    </div>

                    {/* Found items — collapsible accordion */}
                    {pointed.length > 0 && (
                      <div className="border-t border-[#e8e6e1] px-6 py-4">
                        <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">
                          Found Items
                          <span className="ml-2 text-xs font-normal text-[#6a6a7a]">({pointed.length})</span>
                        </h4>

                        <div className="space-y-3">
                          {pointed.map((pi, idx) => {
                            const isExpanded = expandedItems[pi.id] ?? true;
                            return (
                              <div key={pi.id} className="rounded-xl border border-[#e8e6e1] overflow-hidden">
                                {/* Collapsible header */}
                                <button
                                  onClick={() => setExpandedItems(prev => ({ ...prev, [pi.id]: !isExpanded }))}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left bg-[#faf9f6] hover:bg-[#f3f2ef] transition"
                                >
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2d5a3d] text-[9px] font-bold text-white">{idx + 1}</span>
                                  {pi.loading ? (
                                    <span className="flex items-center gap-1.5 text-xs text-[#6a6a7a]">
                                      <FaSpinner className="animate-spin text-[10px]" /> Identifying...
                                    </span>
                                  ) : pi.label === "Unknown item" || pi.label === "Could not identify" ? (
                                    <span className="text-xs text-red-400">Could not identify. Try a tighter selection.</span>
                                  ) : (
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <span className="text-sm font-medium text-[#1a1a2e] truncate">{pi.label}</span>
                                      {pi.matchedItemLabel && (
                                        <span className="shrink-0 rounded bg-[#2d5a3d]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#2d5a3d]">
                                          → {pi.matchedItemLabel}
                                        </span>
                                      )}
                                      {pi.selectedProductIdx !== null && (
                                        <FaCheck className="shrink-0 text-[10px] text-[#2d5a3d]" />
                                      )}
                                    </div>
                                  )}
                                  <div className="ml-auto flex items-center gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); removePointedItem(item.id, pi.id); }}
                                      className="text-[10px] text-[#9a9aaa] transition hover:text-red-500"
                                    >
                                      <FaTrash />
                                    </button>
                                    {isExpanded ? <FaChevronUp className="text-[10px] text-[#9a9aaa]" /> : <FaChevronDown className="text-[10px] text-[#9a9aaa]" />}
                                  </div>
                                </button>

                                {/* Collapsible body: product grid */}
                                {isExpanded && !pi.loading && pi.products.length > 0 && (
                                  <div className="p-3">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                                      {pi.products.slice(0, 9).map((p, i) => {
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
                                            {p.thumbnail && (
                                              <div className="relative aspect-square w-full overflow-hidden bg-[#f8f7f4]">
                                                <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="180px" unoptimized />
                                                {isSelected && (
                                                  <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2d5a3d] shadow">
                                                    <FaCheck className="text-[8px] text-white" />
                                                  </div>
                                                )}
                                                <a
                                                  href={p.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-[#9a9aaa] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[#2d5a3d]"
                                                  title="Open product page"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <FaArrowUpRightFromSquare className="text-[9px]" />
                                                </a>
                                              </div>
                                            )}
                                            <div className="p-2">
                                              <p className="line-clamp-2 text-[11px] leading-tight font-medium text-[#1a1a2e]">{p.title}</p>
                                              <div className="mt-1.5 flex flex-col gap-1">
                                                <span className="inline-flex self-start rounded-md bg-[#eeedea] px-1.5 py-0.5 text-[10px] font-medium text-[#6a6a7a]">{p.source}</span>
                                                {p.price && <span className="text-sm font-semibold text-[#2d5a3d]">{p.price}</span>}
                                              </div>
                                              <div className="mt-2 flex items-center gap-1">
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
                                                <button
                                                  onClick={() => { setDetailProduct(p); setDetailImageIdx(0); }}
                                                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#d5d3cd] text-[#6a6a7a] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5 hover:text-[#2d5a3d]"
                                                  title="View details"
                                                >
                                                  <FaCircleInfo className="text-xs" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                {isExpanded && !pi.loading && pi.products.length === 0 && (
                                  <div className="p-3">
                                    <p className="text-[11px] text-[#9a9aaa]">No matching products found.</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
                  Go to From Ideas, From Catalogue, or From Shopping to select items.
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
                      {/* Remove button — hidden; deselect from Shopping List instead */}
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
                          {/* External link icon — bottom-right of image */}
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-[#9a9aaa] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[#2d5a3d]"
                            title="Open product page"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaArrowUpRightFromSquare className="text-[9px]" />
                          </a>
                        </div>
                      )}
                      <div className="p-2.5">
                        <p className="line-clamp-2 text-[11px] leading-tight font-medium text-[#1a1a2e]">{p.title}</p>
                        <div className="mt-1.5 flex flex-col gap-1">
                          <span className="inline-flex self-start rounded-md bg-[#eeedea] px-1.5 py-0.5 text-[10px] font-medium text-[#6a6a7a]">{p.source}</span>
                          {p.price && <span className="text-sm font-semibold text-[#2d5a3d]">{p.price}</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            onClick={() => deselectEntry(entry)}
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#2d5a3d] px-2 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#234a31]"
                          >
                            <FaCheck className="text-[8px]" /> Selected
                          </button>
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
            selectedProducts={catalogueProducts}
            onToggleProduct={(product) => {
              const exists = catalogueProducts.some((mp) => mp.url === product.url || mp.title === product.title);
              if (exists) {
                setCatalogueProducts((prev) => prev.filter((mp) => mp.url !== product.url && mp.title !== product.title));
              } else {
                setCatalogueProducts((prev) => [...prev, product]);
              }
            }}
          />
        </div>
      )}

      {/* ── SECTION: From Shopping ── */}
      {view === "shopping" && (
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a2e]">Add Items by Link</h2>
          <p className="mt-2 text-sm text-[#6a6a7a]">
            Found a product online? Paste the URL and we&apos;ll pull in the details automatically.
          </p>

          <div className="mt-6 rounded-2xl border border-[#e8e6e1] p-6">
            <div className="flex gap-2">
              <input
                type="url"
                value={manualLinkUrl}
                onChange={(e) => { setManualLinkUrl(e.target.value); setManualLinkError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleShoppingLinkSubmit(); }}
                placeholder="https://www.homedepot.com/product..."
                className="min-w-0 flex-1 rounded-lg border border-[#d5d3cd] px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-[#c5c3bd] focus:border-[#2d5a3d] focus:outline-none focus:ring-1 focus:ring-[#2d5a3d]"
              />
              <button
                onClick={handleShoppingLinkSubmit}
                disabled={manualLinkLoading || !manualLinkUrl.trim()}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-[#2d5a3d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#234a31] disabled:opacity-50"
              >
                {manualLinkLoading ? <FaSpinner className="animate-spin text-xs" /> : <FaPlus className="text-xs" />}
                {manualLinkLoading ? "Fetching..." : "Add"}
              </button>
            </div>

            {manualLinkError && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-red-500">
                <FaCircleExclamation className="text-[10px]" />
                {manualLinkError}
              </div>
            )}
          </div>

          {shoppingProducts.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-4 text-sm font-semibold text-[#1a1a2e]">Added Items ({shoppingProducts.length})</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {shoppingProducts.map((p, i) => (
                  <div key={i} className="group overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:border-[#2d5a3d]/30 hover:shadow-sm">
                    {p.thumbnail && (
                      <div className="relative aspect-square w-full overflow-hidden bg-[#f8f7f4]">
                        <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="200px" unoptimized />
                        <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2d5a3d] shadow">
                          <FaCheck className="text-[8px] text-white" />
                        </div>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-[#9a9aaa] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[#2d5a3d]"
                          title="Open product page"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaArrowUpRightFromSquare className="text-[9px]" />
                        </a>
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="line-clamp-2 text-[11px] leading-tight font-medium text-[#1a1a2e]">{p.title}</p>
                      <div className="mt-1.5 flex flex-col gap-1">
                        <span className="inline-flex self-start rounded-md bg-[#eeedea] px-1.5 py-0.5 text-[10px] font-medium text-[#6a6a7a]">{p.source}</span>
                        {p.price && <span className="text-sm font-semibold text-[#2d5a3d]">{p.price}</span>}
                      </div>
                      <button
                        onClick={() => setShoppingProducts((prev) => prev.filter((_, idx) => idx !== i))}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-[10px] font-semibold text-red-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <FaTrash className="text-[8px]" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shoppingProducts.length === 0 && (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e8e6e1] p-10 text-center">
              <FaLink className="mb-3 text-3xl text-[#d5d3cd]" />
              <p className="text-sm font-medium text-[#9a9aaa]">No items added yet</p>
              <p className="mt-1 text-xs text-[#c5c3bd]">Paste a product URL above to start building your shopping list.</p>
            </div>
          )}
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
  const [error, setError] = useState<string | null>(null);
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());
  const mockupFileInputRef = useRef<HTMLInputElement>(null);

  const handleMockupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          store.addMockupPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

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
    let gotImages = false;

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
        gotImages = true;
      }
      // Only show error if NO images came back
      if (!gotImages && (!res.ok || data.error)) {
        setError(data.error || "Failed to generate mockup. Please try again.");
      }
    } catch {
      if (!gotImages) {
        setError("Failed to generate mockup. Please try again.");
      }
    } finally {
      store.setMockupLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1a1a2e]">Real Mockup</h2>
        <button
          onClick={handleGenerateMockup}
          disabled={store.mockupLoading || store.mockupBathroomPhotos.length === 0 || includedProducts.length === 0}
          className="flex items-center gap-2 rounded-xl bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2d5a3d]/20 transition hover:bg-[#234a31] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {store.mockupLoading ? (
            <>
              <FaSpinner className="animate-spin text-sm" />
              Generating...
            </>
          ) : (
            <>
              <FaWandMagicSparkles className="text-sm" />
              Generate Mockup
            </>
          )}
        </button>
      </div>

      <input
        ref={mockupFileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleMockupFileUpload}
      />

      {/* ── Bathroom Photos ── */}
      <div className="mt-6 rounded-2xl border border-[#e8e6e1] bg-[#fafaf8] p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
          <FaCamera className="text-xs text-[#2d5a3d]" />
          Your Bathroom Photos
        </h3>
        <p className="mt-1 text-xs text-[#9a9aaa]">
          Upload at least 1 angle of your current bathroom.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
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

          <button
            onClick={() => mockupFileInputRef.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#d5d3cd] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5"
          >
            <FaUpload className="text-lg text-[#9a9aaa]" />
            <span className="text-[10px] font-medium text-[#6a6a7a]">
              {store.mockupBathroomPhotos.length === 0 ? "Upload Photo" : "Add Another"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Items to Include ── */}
      <div className="mt-4 rounded-2xl border border-[#e8e6e1] bg-[#fafaf8] p-5">
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
          <div className="mt-3 grid grid-cols-5 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
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
                    {p.price && <p className="mt-0.5 text-base font-bold text-[#2d5a3d]">{p.price}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
            </>
          )}
        </button>
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
                    <FaDownload className="text-[9px]" /> Download
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

      {/* ── Project Details Grid ── */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {/* Goals — full width */}
        <div className="col-span-2 rounded-xl border border-[#e8e6e1] bg-white px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aaa]">Goals</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {store.goals.length > 0 ? store.goals.map(g => {
              const meta = GOAL_META[g];
              const Icon = meta?.icon || FaBullseye;
              return (
                <span key={g} className="inline-flex items-center gap-1.5 rounded-full bg-[#2d5a3d]/8 px-2.5 py-1 text-xs font-medium text-[#2d5a3d]">
                  <Icon className="text-[10px]" /> {meta?.label || g}
                </span>
              );
            }) : <span className="text-sm text-[#9a9aaa]">None selected</span>}
          </div>
        </div>

        {/* Scope */}
        <div className="rounded-xl border border-[#e8e6e1] bg-white px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aaa]">Scope</div>
          <div className="mt-1">
            {scopeMeta ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a1a2e]">
                <scopeMeta.icon className="text-xs text-[#2d5a3d]" /> {scopeMeta.label}
              </span>
            ) : <span className="text-sm text-[#9a9aaa]">—</span>}
          </div>
        </div>

        {/* Size */}
        <div className="rounded-xl border border-[#e8e6e1] bg-white px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aaa]">Size</div>
          <div className="mt-1 text-sm font-medium text-[#1a1a2e]">{sizeInfo?.label || store.bathroomSize}</div>
        </div>

        {/* Budget */}
        <div className="col-span-2 rounded-xl border border-[#e8e6e1] bg-white px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aaa]">Budget</div>
          <div className="mt-1 text-sm font-bold text-[#2d5a3d]">
            {store.budgetAmount != null && store.budgetAmount > 0
              ? formatCurrency(store.budgetAmount)
              : formatCurrency(budgetGraph.estimatedLow) + " – " + formatCurrency(budgetGraph.estimatedHigh)}
          </div>
        </div>

        {/* Must-Haves */}
        <div className="rounded-xl border border-[#e8e6e1] bg-white px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aaa]">Must-Haves</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {store.mustHaves.length > 0 ? store.mustHaves.map(item => (
              <span key={item} className="inline-flex items-center gap-1 rounded-full border border-[#2d5a3d]/20 bg-[#2d5a3d]/5 px-2.5 py-1 text-xs font-medium text-[#2d5a3d]">
                <FaCheck className="text-[8px]" /> {item}
              </span>
            )) : <span className="text-sm text-[#9a9aaa]">None</span>}
          </div>
        </div>

        {/* Nice-to-Haves */}
        <div className="rounded-xl border border-[#e8e6e1] bg-white px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aaa]">Nice-to-Haves</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {store.niceToHaves.length > 0 ? store.niceToHaves.map(item => (
              <span key={item} className="inline-flex items-center gap-1 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/5 px-2.5 py-1 text-xs font-medium text-[#d4956a]">
                <FaStar className="text-[8px]" /> {item}
              </span>
            )) : <span className="text-sm text-[#9a9aaa]">None</span>}
          </div>
        </div>
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
                      <div key={item.label} className="flex flex-col py-1.5 border-b border-[#e8e6e1]/50">
                        <div className="flex items-center">
                          <div className="flex-1 min-w-0 flex items-center gap-1">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${item.source === "must-have" ? "bg-[#2d5a3d]" : "bg-[#d4a24c]"}`} />
                            <span className="text-[#1a1a2e] truncate">{item.label}</span>
                            {item.overridden && <span className="shrink-0 rounded bg-[#2d5a3d]/10 px-1 py-0.5 text-[7px] font-semibold text-[#2d5a3d]">REAL</span>}
                          </div>
                          <span className="w-20 text-right text-[#6a6a7a]">{matFixed ? formatCurrency(item.materialLow) : `${formatCurrency(item.materialLow)}–${formatCurrency(item.materialHigh)}`}</span>
                          <span className="w-20 text-right text-[#6a6a7a]">{labFixed ? formatCurrency(item.laborLow) : `${formatCurrency(item.laborLow)}–${formatCurrency(item.laborHigh)}`}</span>
                          <span className="w-24 text-right font-medium text-[#1a1a2e]">{totFixed ? formatCurrency(item.totalLow) : `${formatCurrency(item.totalLow)}–${formatCurrency(item.totalHigh)}`}</span>
                        </div>
                        {item.tileInfo && (
                          <div className="ml-3 mt-0.5 text-[9px] text-[#6a6a7a]">
                            {item.tileInfo.quantity} tiles @ {item.tileInfo.tileSizeLabel} · {item.tileInfo.coverageSqft.toFixed(1)} sq ft
                          </div>
                        )}
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
