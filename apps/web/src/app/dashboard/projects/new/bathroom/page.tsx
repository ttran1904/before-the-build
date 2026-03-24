"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaArrowRight, FaCheck, FaWandMagicSparkles } from "react-icons/fa6";
import { useWizardStore, type BathroomScope, type BudgetTier } from "@/lib/store";
import Link from "next/link";
import type { DesignStyle } from "@before-the-build/shared";

const STEPS = [
  { id: "goal", label: "Goal", icon: "🎯" },
  { id: "scope", label: "Scope", icon: "📐" },
  { id: "must-haves", label: "Must-Haves", icon: "📋" },
  { id: "budget", label: "Budget", icon: "💰" },
  { id: "style", label: "Style", icon: "🎨" },
  { id: "summary", label: "Summary", icon: "✅" },
];

export default function BathroomWizardPage() {
  const router = useRouter();
  const store = useWizardStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [aiSummary, setAiSummary] = useState("");
  const [generating, setGenerating] = useState(false);

  const next = () => {
    if (currentStep === STEPS.length - 2) {
      generateSummary();
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/budget-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: store.goal,
          scope: store.scope,
          mustHaves: store.mustHaves,
          niceToHaves: store.niceToHaves,
          budgetTier: store.budgetTier,
          bathroomSize: store.bathroomSize,
          style: store.style,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary || "Your bathroom renovation plan is ready!");
    } catch {
      setAiSummary("Your bathroom renovation plan has been saved. Head to the dashboard to continue.");
    }
    setGenerating(false);
  };

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
          <div
            className="h-full bg-[#2d5a3d] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Step pills */}
      <div className="mx-auto mt-8 flex max-w-3xl justify-center gap-2 px-6">
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => i < currentStep && setCurrentStep(i)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              i === currentStep
                ? "bg-[#2d5a3d] text-white"
                : i < currentStep
                  ? "bg-[#2d5a3d]/10 text-[#2d5a3d] hover:bg-[#2d5a3d]/20"
                  : "bg-[#e8e6e1] text-[#9a9aaa]"
            }`}
          >
            {i < currentStep ? <FaCheck className="text-[10px]" /> : <span>{step.icon}</span>}
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-lg shadow-black/5">
          {currentStep === 0 && <GoalStep />}
          {currentStep === 1 && <ScopeStep />}
          {currentStep === 2 && <MustHavesStep />}
          {currentStep === 3 && <BudgetStep />}
          {currentStep === 4 && <StyleStep />}
          {currentStep === 5 && <SummaryStep summary={aiSummary} generating={generating} />}
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
    { id: "increase_value", label: "Increase Home Value", desc: "Focus on ROI upgrades — vanity, tile, fixtures", icon: "📈" },
    { id: "more_space", label: "Create More Space", desc: "Reconfigure layout, remove tub for walk-in shower", icon: "📐" },
    { id: "energy_efficient", label: "Energy Efficient", desc: "Low-flow fixtures, LED lighting, better ventilation", icon: "🌱" },
    { id: "update_style", label: "Update the Style", desc: "Change aesthetic — modern, farmhouse, spa-like", icon: "🎨" },
    { id: "family_friendly", label: "Family / Kid-Friendly", desc: "Non-slip floors, tub, storage, durability", icon: "👨‍👩‍👧" },
    { id: "accessibility", label: "Improve Accessibility", desc: "Walk-in shower, grab bars, ADA compliance", icon: "♿" },
    { id: "fix_problems", label: "Fix Existing Problems", desc: "Leaks, mold, outdated plumbing, broken tiles", icon: "🔧" },
    { id: "more_storage", label: "Increase Storage", desc: "Vanity with drawers, medicine cabinet, shelving", icon: "🗄️" },
    { id: "luxury_spa", label: "Create a Spa Experience", desc: "Soaking tub, rain shower, heated floors", icon: "🧖" },
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
            <span className="mt-0.5 text-xl">{g.icon}</span>
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

  const SCOPES: { id: BathroomScope; label: string; desc: string; price: string; icon: string }[] = [
    { id: "cosmetic", label: "Cosmetic Refresh", desc: "Paint, fixtures, hardware, accessories. Minimal disruption.", price: "$1,000 – $5,000", icon: "🎨" },
    { id: "partial", label: "Partial Remodel", desc: "New vanity, flooring, paint. Keep existing layout.", price: "$5,000 – $20,000", icon: "🔧" },
    { id: "full", label: "Full Remodel", desc: "Gut everything and rebuild. New layout possible.", price: "$15,000 – $50,000", icon: "🏗️" },
    { id: "addition", label: "Addition / Expansion", desc: "Expand bathroom footprint. Structural changes.", price: "$30,000 – $100,000+", icon: "📏" },
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
            <span className="text-2xl">{s.icon}</span>
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

/* ── Style Step ── */
function StyleStep() {
  const { style, setStyle } = useWizardStore();

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
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Choose your style</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        This will guide AI-generated visualizations and product recommendations.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
  );
}

/* ── Summary Step ── */
function SummaryStep({ summary, generating }: { summary: string; generating: boolean }) {
  const store = useWizardStore();

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1a1a2e]">Your Renovation Plan</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Here&apos;s a summary of your bathroom renovation. Ready to visualize it!
      </p>

      <div className="mt-6 space-y-4">
        <SummaryRow label="Goal" value={GOAL_LABELS[store.goal] || store.goal} />
        <SummaryRow label="Scope" value={store.scope ? SCOPE_LABELS[store.scope] : "—"} />
        <SummaryRow label="Size" value={`${store.bathroomSize.charAt(0).toUpperCase() + store.bathroomSize.slice(1)} bathroom`} />
        <SummaryRow label="Budget Tier" value={store.budgetTier ? store.budgetTier.charAt(0).toUpperCase() + store.budgetTier.slice(1) : "—"} />
        <SummaryRow label="Style" value={store.style || "—"} />
        <SummaryRow label="Must-Haves" value={store.mustHaves.join(", ") || "None selected"} />
        <SummaryRow label="Nice-to-Haves" value={store.niceToHaves.join(", ") || "None selected"} />
      </div>

      {/* AI Summary */}
      <div className="mt-6 rounded-xl border border-[#2d5a3d]/20 bg-[#2d5a3d]/5 p-5">
        <div className="mb-2 flex items-center gap-2">
          <FaWandMagicSparkles className="text-[#2d5a3d]" />
          <span className="text-sm font-semibold text-[#2d5a3d]">AI Recommendation</span>
        </div>
        {generating ? (
          <div className="flex items-center gap-2 text-sm text-[#6a6a7a]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2d5a3d] border-t-transparent" />
            Generating your personalized plan...
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[#4a4a5a]">
            {summary || "Complete the previous steps to get your AI-powered renovation plan."}
          </p>
        )}
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
