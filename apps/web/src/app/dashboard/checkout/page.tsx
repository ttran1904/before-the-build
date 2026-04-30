"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBookOpen,
  FaCheck,
  FaClipboardList,
  FaInfinity,
  FaLock,
  FaShieldHalved,
  FaUserTie,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

/* ──────────────────────────────────────────────────────────────
 * Checkout page — scaffolded template.
 *
 * Today: shows a static order summary based on `?plan=` query
 * param, plus a placeholder "Continue to payment" CTA.
 *
 * TODO(stripe): wire the CTA to a server action that creates a
 * Stripe Checkout Session (or Payment Intent) and redirects.
 *   1. Add STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 *   2. Create app/api/checkout/route.ts -> stripe.checkout.sessions.create
 *   3. Replace handleContinue() below with a fetch + redirect
 * ────────────────────────────────────────────────────────────── */

type PlanId = "core" | "guided" | "build-book";

type Plan = {
  id: PlanId;
  name: string;
  tag: string;
  subtitle: string;
  priceCents: number;
  priceLabel: string;
  priceNote: string;
  accent: string;
  accentBg: string;
  icon: IconType;
  includes: string[];
};

const PLANS: Record<PlanId, Plan> = {
  core: {
    id: "core",
    name: "Core Scope",
    tag: "Self-serve",
    subtitle: "A contractor-ready brief, delivered in 48 hours.",
    priceCents: 39900,
    priceLabel: "$399",
    priceNote: "one-time · per project",
    accent: "#c08a5a",
    accentBg: "#f6f3ed",
    icon: FaClipboardList,
    includes: [
      "Contractor-ready Scope PDF",
      "Realistic cost range",
      "Plumbing & layout conflicts flagged",
      "Lifetime access to your scope",
    ],
  },
  guided: {
    id: "guided",
    name: "Guided Scope",
    tag: "With expert review",
    subtitle:
      "Everything in Core, plus a live review and one round of revisions.",
    priceCents: 100000,
    priceLabel: "$1,000",
    priceNote: "one-time · typical project",
    accent: "#c08a5a",
    accentBg: "#f6f3ed",
    icon: FaUserTie,
    includes: [
      "Everything in Core Scope",
      "Live review call with a renovation expert",
      "One round of revisions",
      "Bid comparison template",
      "Personalized risk flags & cost-driver notes",
      "Lifetime access to your scope",
    ],
  },
  "build-book": {
    id: "build-book",
    name: "Build Book",
    tag: "For your design",
    subtitle: "Moodboard, real-photo AI mockup, and a shareable items list.",
    priceCents: 19900,
    priceLabel: "$199",
    priceNote: "one-time · per project",
    accent: "#2d5a3d",
    accentBg: "#eef3ee",
    icon: FaBookOpen,
    includes: [
      "Style direction & inspiration",
      "Real-photo AI mockup of your room",
      "Moodboard with items checklist",
      "Catalogue picks & shopping links",
      "Final shareable Build Book",
      "Lifetime access to your design",
    ],
  },
};

const DEFAULT_PLAN: PlanId = "guided";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const params = useSearchParams();
  const planParam = (params.get("plan") ?? DEFAULT_PLAN) as PlanId;
  const plan = PLANS[planParam] ?? PLANS[DEFAULT_PLAN];

  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => formatUsd(plan.priceCents), [plan.priceCents]);
  const Icon = plan.icon;

  async function handleContinue() {
    setSubmitting(true);
    // TODO(stripe): replace with real Stripe Checkout call.
    //
    // const res = await fetch("/api/checkout", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ planId: plan.id }),
    // });
    // const { url } = await res.json();
    // window.location.href = url;
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    alert(
      `Stripe checkout not wired up yet.\nWould charge ${total} for ${plan.name}.`,
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-20">
      {/* ── Header ───────────────────────────────────────────── */}
      <header>
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9aaa] transition hover:text-[#1a1a2e]"
        >
          <FaArrowLeft className="text-[10px]" /> Back to plans
        </Link>
        <h1 className="mt-3 font-serif text-4xl text-[#1a1a2e]">Checkout</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#6a6a7a]">
          Review your plan, then continue to secure payment. One-time payment,
          lifetime access to your project.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* ── Payment panel (Stripe placeholder) ─────────────── */}
        <section className="rounded-2xl border border-[#ece9e3] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
            <FaLock className="text-[#2d5a3d]" /> Secure payment
          </div>
          <h2 className="mt-2 font-serif text-2xl text-[#1a1a2e]">
            Payment details
          </h2>
          <p className="mt-1 text-sm text-[#6a6a7a]">
            We&rsquo;ll connect Stripe here. For now this is a template.
          </p>

          {/* Stripe Elements placeholder */}
          <div className="mt-6 space-y-4">
            <PlaceholderField label="Email" placeholder="you@example.com" />
            <PlaceholderField
              label="Card number"
              placeholder="1234 1234 1234 1234"
            />
            <div className="grid grid-cols-2 gap-4">
              <PlaceholderField label="Expiry" placeholder="MM / YY" />
              <PlaceholderField label="CVC" placeholder="123" />
            </div>
            <PlaceholderField label="Name on card" placeholder="Full name" />
            <PlaceholderField label="ZIP / Postal code" placeholder="12345" />
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-[#ece9e3] bg-[#faf8f3] px-4 py-3 text-xs leading-relaxed text-[#6a6a7a]">
            <span className="font-semibold text-[#1a1a2e]">
              Stripe integration pending.
            </span>{" "}
            Replace the fields above with Stripe Elements and wire the button
            below to a Checkout Session.
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2d5a3d] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#244a32] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Connecting…" : `Pay ${total}`}
            {!submitting && <FaArrowRight className="text-xs" />}
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-[#9a9aaa]">
            <span className="inline-flex items-center gap-1.5">
              <FaShieldHalved className="text-[#2d5a3d]" /> 7-day money-back
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FaInfinity className="text-[#2d5a3d]" /> Lifetime project access
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FaLock className="text-[#2d5a3d]" /> Encrypted by Stripe
            </span>
          </div>
        </section>

        {/* ── Order summary ──────────────────────────────────── */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-[#ece9e3] bg-white p-8 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
              Order summary
            </span>

            <div className="mt-4 flex items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ background: plan.accentBg, color: plan.accent }}
              >
                <Icon />
              </span>
              <div className="min-w-0">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ background: plan.accentBg, color: plan.accent }}
                >
                  {plan.tag}
                </span>
                <h3 className="mt-1.5 font-serif text-2xl text-[#1a1a2e]">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-[#6a6a7a]">{plan.subtitle}</p>
              </div>
            </div>

            <div
              className="mt-6 rounded-2xl px-6 py-5 text-center"
              style={{ background: plan.accentBg }}
            >
              <div
                className="font-serif text-4xl"
                style={{ color: plan.accent }}
              >
                {plan.priceLabel}
              </div>
              <div
                className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: plan.accent }}
              >
                {plan.priceNote}
              </div>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm text-[#4a4a5a]">
              {plan.includes.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <FaCheck
                    className="mt-1 text-[11px]"
                    style={{ color: plan.accent }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2 border-t border-[#ece9e3] pt-5 text-sm">
              <Row label="Subtotal" value={total} />
              <Row label="Taxes" value="Calculated at payment" muted />
              <div className="flex items-baseline justify-between pt-3">
                <span className="font-serif text-lg text-[#1a1a2e]">
                  Total due today
                </span>
                <span className="font-serif text-2xl text-[#1a1a2e]">
                  {total}
                </span>
              </div>
            </div>
          </div>

          <p className="px-2 text-center text-xs leading-relaxed text-[#9a9aaa]">
            Need a different plan?{" "}
            <Link
              href="/dashboard/plans"
              className="font-semibold text-[#2d5a3d] underline-offset-2 hover:underline"
            >
              Compare all plans
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}

function PlaceholderField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#1a1a2e]">{label}</span>
      <input
        type="text"
        disabled
        placeholder={placeholder}
        className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-[#ece9e3] bg-[#faf8f3] px-3.5 py-2.5 text-sm text-[#4a4a5a] placeholder:text-[#9a9aaa] focus:outline-none"
      />
    </label>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#6a6a7a]">{label}</span>
      <span className={muted ? "text-[#9a9aaa]" : "text-[#1a1a2e]"}>
        {value}
      </span>
    </div>
  );
}
