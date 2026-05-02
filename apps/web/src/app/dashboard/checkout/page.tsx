"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCcAmex,
  FaCcMastercard,
  FaCcVisa,
  FaCheck,
  FaInfinity,
  FaLock,
  FaShieldHalved,
} from "react-icons/fa6";

/* ──────────────────────────────────────────────────────────────
 * Checkout — sleek, condensed, payments-first.
 *
 * TODO(stripe): replace handleSubmit() with a fetch to
 * /api/checkout (stripe.checkout.sessions.create) and redirect
 * to the returned session URL.
 * ────────────────────────────────────────────────────────────── */

type PlanId = "core" | "guided" | "build-book";

type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceCents: number;
  includes: string[];
};

const PLANS: Record<PlanId, Plan> = {
  core: {
    id: "core",
    name: "Groundwork Report",
    tagline: "Self-serve · per room",
    priceCents: 39900,
    includes: [
      "Project summary & existing conditions snapshot",
      "Defined scope — included, excluded, undecided",
      "Room-by-room breakdown",
      "Decision checklist & major variables map",
      "Builder questions to ask",
      "Next-step roadmap",
      "Contractor-ready PDF",
    ],
  },
  guided: {
    id: "guided",
    name: "Groundwork Pro",
    tagline: "With 3 expert calls · per room",
    priceCents: 79900,
    includes: [
      "Everything in Groundwork Report",
      "3 calls with a real person — used as needed",
      "Bid comparison — upload up to 4 bids, flags what to question",
      "One round of scope refinement",
    ],
  },
  "build-book": {
    id: "build-book",
    name: "Build Book",
    tagline: "Design pack · per project",
    priceCents: 15000,
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
    maximumFractionDigits: 2,
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
  const subtotal = plan.priceCents;
  const total = useMemo(() => formatUsd(subtotal), [subtotal]);
  const subtotalLabel = useMemo(() => formatUsd(subtotal), [subtotal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // TODO(stripe): POST /api/checkout -> { url } -> window.location.href = url
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    alert(
      `Stripe checkout not wired up yet.\nWould charge ${total} for ${plan.name}.`,
    );
  }

  return (
    <div className="-mx-6 -mt-6 min-h-[calc(100vh-3rem)] bg-[#f6f5f1] px-6 pb-16 pt-6 md:-mx-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-[#6a6a7a]">
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-1.5 transition hover:text-[#1a1a2e]"
          >
            <FaArrowLeft className="text-[9px]" /> Back
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <FaLock className="text-[10px] text-[#2d5a3d]" />
            Secure checkout
          </span>
        </div>

        {/* Title */}
        <div className="mt-4 mb-6 flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1a1a2e]">
            Checkout
          </h1>
          <p className="hidden text-sm text-[#6a6a7a] sm:block">
            One-time payment · lifetime project access
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 lg:grid-cols-[1.1fr_1fr]"
        >
          {/* ── Payment column ─────────────────────────────── */}
          <div className="space-y-5">
            <Section title="Contact">
              <Field
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Section>

            <Section
              title="Payment"
              right={
                <div className="flex items-center gap-1.5 text-[#9a9aaa]">
                  <FaCcVisa className="text-xl" />
                  <FaCcMastercard className="text-xl" />
                  <FaCcAmex className="text-xl" />
                </div>
              }
            >
              <Field
                id="card"
                label="Card number"
                placeholder="1234 1234 1234 1234"
                autoComplete="cc-number"
                inputMode="numeric"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  id="exp"
                  label="Expiry"
                  placeholder="MM / YY"
                  autoComplete="cc-exp"
                  inputMode="numeric"
                />
                <Field
                  id="cvc"
                  label="CVC"
                  placeholder="123"
                  autoComplete="cc-csc"
                  inputMode="numeric"
                />
              </div>
              <Field
                id="name"
                label="Name on card"
                placeholder="Full name"
                autoComplete="cc-name"
              />
            </Section>

            <Section title="Billing address">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field
                    id="country"
                    label="Country"
                    placeholder="United States"
                    autoComplete="country-name"
                  />
                </div>
                <Field
                  id="zip"
                  label="ZIP"
                  placeholder="12345"
                  autoComplete="postal-code"
                />
              </div>
            </Section>

            <p className="text-[11px] leading-relaxed text-[#9a9aaa]">
              By placing this order you agree to our Terms of Service and
              Privacy Policy. Payments are processed securely by Stripe.
            </p>
          </div>

          {/* ── Order summary column ───────────────────────── */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-xl border border-[#e6e3dc] bg-white">
              <div className="flex items-center justify-between border-b border-[#eeece6] px-5 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
                  Order
                </span>
                <Link
                  href="/dashboard/plans"
                  className="text-[11px] font-semibold text-[#2d5a3d] hover:underline"
                >
                  Change
                </Link>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-[#1a1a2e]">
                      {plan.name}
                    </div>
                    <div className="mt-0.5 text-xs text-[#6a6a7a]">
                      {plan.tagline}
                    </div>
                  </div>
                  <div className="text-[15px] font-semibold tabular-nums text-[#1a1a2e]">
                    {subtotalLabel}
                  </div>
                </div>

                <ul className="mt-4 space-y-1.5 text-[13px] text-[#4a4a5a]">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <FaCheck className="mt-1 text-[10px] text-[#2d5a3d]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 border-t border-[#eeece6] px-5 py-4 text-sm">
                <Row label="Subtotal" value={subtotalLabel} />
                <Row label="Tax" value="Calculated at payment" muted />
                <div className="mt-3 flex items-baseline justify-between border-t border-[#eeece6] pt-3">
                  <span className="text-sm font-semibold text-[#1a1a2e]">
                    Total
                  </span>
                  <span className="text-xl font-semibold tabular-nums text-[#1a1a2e]">
                    {total}
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1a2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a3e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    "Processing…"
                  ) : (
                    <>
                      Pay {total}
                      <FaArrowRight className="text-[11px]" />
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[#9a9aaa]">
                  <span className="inline-flex items-center gap-1">
                    <FaLock className="text-[10px]" /> Secure payment
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FaShieldHalved className="text-[10px]" /> 7-day refund
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FaInfinity className="text-[10px]" /> Lifetime access
                  </span>
                </div>
                <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-[#b3b1a8]">
                  Powered by Stripe
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

/* ── Bits ────────────────────────────────────────────────────── */

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e6e3dc] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1a1a2e]">
          {title}
        </h2>
        {right}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text" | "email";
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-[11px] font-medium text-[#6a6a7a]">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="block w-full rounded-lg border border-[#dedbd2] bg-white px-3 py-2.5 text-sm text-[#1a1a2e] placeholder:text-[#b3b1a8] focus:border-[#2d5a3d] focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/15"
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
      <span
        className={
          (muted ? "text-[#9a9aaa]" : "text-[#1a1a2e]") + " tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}