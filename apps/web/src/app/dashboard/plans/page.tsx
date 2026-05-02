"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import {
  FaClipboardList,
  FaUserTie,
  FaHelmetSafety,
  FaCheck,
  FaMinus,
  FaShieldHalved,
  FaInfinity,
  FaArrowRight,
  FaPhone,
  FaPhoneVolume,
  FaHeadset,
  FaXmark,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";


/* ──────────────────────────────────────────────────────────────
 * Plans page — high-ticket, ownership-led pricing.
 * Structure: hero → 3 Groundwork plans (Report / Pro / Premium)
 * → comparison table → call add-ons → trust strip → FAQ.
 * ────────────────────────────────────────────────────────────── */

export default function PlansPage() {
  const [bookOpen, setBookOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl space-y-16 pb-20">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c08a5a]">
          Plans &amp; pricing
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl font-serif text-4xl text-[#1a1a2e] md:text-5xl">
          Pick the chapter you’re in.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#6a6a7a]">
          Three ways to get a real contractor&apos;s clarity on your project.
          Report and Pro are one-time per-room payments. Premium is ongoing
          monthly support once your build begins.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#6a6a7a]">
          <span className="inline-flex items-center gap-1.5">
            <FaInfinity className="text-[#2d5a3d]" /> Lifetime project access
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FaShieldHalved className="text-[#2d5a3d]" /> 7-day money-back guarantee
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FaCheck className="text-[#2d5a3d]" /> No subscription on scope
          </span>
        </div>
      </header>

      {/* ── 3 Groundwork plans ───────────────────────────────── */}
      <section>
        <div className="text-center">
          <h2 className="font-serif text-3xl text-[#1a1a2e]">
            Compare the 3 Groundwork plans
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] text-[#6a6a7a]">
            Pick the level of support that fits where you are — from a
            self-serve scope to a dedicated retired contractor by your side.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3 md:items-stretch">
          <PlanCard
            accent="#c08a5a"
            accentBg="#f6f3ed"
            icon={<FaClipboardList />}
            tag="Self-serve"
            title="Groundwork Report"
            price="$399"
            priceNote="one-time · per room"
            highlights={[
              "Contractor-ready scope PDF",
              "Defined scope — in, out, undecided",
              "Decision checklist & builder questions",
              "Major variables map",
              "Next-step roadmap",
            ]}
            ctaHref="/dashboard/checkout?plan=core"
            ctaLabel="Get started"
          />
          <PlanCard
            accent="#1a1a2e"
            accentBg="#eef0f4"
            icon={<FaUserTie />}
            tag="With expert calls"
            title="Groundwork Pro"
            price="$799"
            priceNote="one-time · per room"
            featured
            featuredLabel="Most popular · $10k+ projects"
            highlights={[
              "Everything in Groundwork Report",
              "3 calls with a real person",
              "Bid comparison — upload up to 4 bids",
              "One round of scope refinement",
            ]}
            ctaHref="/dashboard/checkout?plan=guided"
            ctaLabel="Get started"
          />
          <PlanCard
            accent="#2d5a3d"
            accentBg="#eef3ee"
            icon={<FaHelmetSafety />}
            tag="Ongoing support"
            title="Groundwork Premium"
            price="$500+"
            priceUnit="/ mo"
            priceNote="based on project size"
            highlights={[
              "Dedicated retired contractor",
              "Bid, estimate & change-order review",
              "Decision support mid-build",
              "Email support within 24 hours",
              "Ongoing contractor evaluation",
            ]}
            ctaHref="/dashboard/advisor?tier=premium"
            ctaLabel="Request a match"
          />
        </div>

        <p className="mt-4 text-center text-xs text-[#9a9aaa]">
          Report and Pro are one-time per-room payments. Premium is monthly,
          based on project size. All prices in USD.
        </p>
      </section>

      {/* ── Occasional Call Support add-ons ──────────────────── */}
      <section>
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c08a5a]">
            Add-ons
          </p>
          <h2 className="mt-3 font-serif text-3xl text-[#1a1a2e]">
            Occasional Call Support
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] text-[#6a6a7a]">
            For homeowners who need help without committing to Premium. Use a
            call before signing a bid, mid-build, or any time a decision feels
            heavy.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <CallPackCard
            icon={<FaPhone />}
            label="Single call"
            price="$59"
            unit="$59 / call"
            description="One 45-minute call with a retired contractor."
          />
          <CallPackCard
            icon={<FaPhoneVolume />}
            label="3-call pack"
            price="$149"
            unit="≈ $50 / call"
            description="Save $28. Use across bidding, signing, and mid-build."
            featured
            featuredLabel="Best value"
          />
          <CallPackCard
            icon={<FaHeadset />}
            label="5-call pack"
            price="$229"
            unit="≈ $46 / call"
            description="Save $66. Best for long or complex builds."
          />
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setBookOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a1a2e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a3e]"
          >
            Book a call <FaArrowRight className="text-xs" />
          </button>
          <span className="text-xs text-[#9a9aaa]">
            Calls are refundable up to 24 hours in advance.
          </span>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-[#ece9e3] bg-white">
        <div className="border-b border-[#ece9e3] p-6 text-center">
          <h2 className="font-serif text-2xl text-[#1a1a2e]">
            Compare what&apos;s included
          </h2>
        </div>
        <ComparisonTable />
      </section>

      {/* ── Trust / value strip ──────────────────────────────── */}
      <section className="rounded-3xl bg-[#1a1a2e] p-10 text-white">
        <div className="grid gap-6 md:grid-cols-3">
          <ValueProp
            icon={<FaInfinity />}
            title="Lifetime project access"
            body="Your scope and brief stay in your account forever — no renewal fees, no expiry."
          />
          <ValueProp
            icon={<FaShieldHalved />}
            title="7-day money-back"
            body="If your Report or Pro doesn&apos;t make your bids clearer, we refund it."
          />
          <ValueProp
            icon={<FaCheck />}
            title="One simple payment"
            body="Pay once per project for Report and Pro. Only Premium is monthly."
          />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-center font-serif text-3xl text-[#1a1a2e]">
          Pricing questions
        </h2>
        <div className="mx-auto mt-6 max-w-3xl space-y-3">
          <Faq
            q="Why one-time pricing for Report and Pro?"
            a="A renovation has a clear start and finish. You shouldn&apos;t pay forever for a deliverable you produced once. You own your scope the same way you&apos;d own a set of architectural drawings."
          />
          <Faq
            q="What&apos;s the difference between Groundwork Report and Groundwork Pro?"
            a="Report is a complete, contractor-ready scope you produce yourself. Pro adds 3 real-person calls, bid comparison across up to 4 bids, and one round of scope refinement — built for projects with more ambiguity or higher stakes."
          />
          <Faq
            q="Can I upgrade from Report to Pro later?"
            a="Yes. We credit the full $399 from Report toward Pro if you decide you want the calls and bid comparison afterward."
          />
          <Faq
            q="When should I add Groundwork Premium?"
            a="Premium makes sense once your build has started and decisions come up regularly — change orders, contractor behavior, mid-build pivots. The call packs are great for one-off moments before or during construction."
          />
          <Faq
            q="What if I need a refund?"
            a="If your Groundwork Report or Pro doesn&apos;t make your bids more comparable, email us within 7 days and we&apos;ll refund the purchase. Call packs are refunded if cancelled 24h in advance."
          />
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-r from-[#2d5a3d] to-[#3d7a5d] p-10 text-center text-white">
        <h2 className="font-serif text-3xl">Ready to lock in clarity?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/85">
          One payment. Lifetime access to your project. Start with the layer
          that fits where you are.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard/checkout?plan=guided"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2d5a3d] transition hover:bg-[#f8f7f4]"
          >
            Get Groundwork Pro <FaArrowRight className="text-xs" />
          </Link>
          <Link
            href="/dashboard/guide"
            className="text-sm font-medium text-white/85 underline-offset-4 hover:underline"
          >
            Not sure which plan? Read the guide
          </Link>
        </div>
      </section>

      <BookCallModal open={bookOpen} onClose={() => setBookOpen(false)} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

function PlanCard({
  accent,
  accentBg,
  icon,
  tag,
  title,
  price,
  priceUnit,
  priceNote,
  highlights,
  ctaHref,
  ctaLabel,
  featured = false,
  featuredLabel = "Most popular",
}: {
  accent: string;
  accentBg: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  price: string;
  priceUnit?: string;
  priceNote: string;
  highlights: string[];
  ctaHref: string;
  ctaLabel: string;
  featured?: boolean;
  featuredLabel?: string;
}) {
  return (
    <div
      className={
        "relative flex flex-col rounded-3xl bg-white p-7 " +
        (featured ? "border-2 shadow-md" : "border border-[#ece9e3] shadow-sm")
      }
      style={featured ? { borderColor: accent } : undefined}
    >
      {featured && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
          style={{ backgroundColor: accent }}
        >
          {featuredLabel}
        </span>
      )}

      {/* Header — icon left, tag right */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 flex-none items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: accentBg, color: accent }}
        >
          {icon}
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ backgroundColor: accentBg, color: accent }}
        >
          {tag}
        </span>
      </div>

      <h3 className="mt-5 font-serif text-2xl text-[#1a1a2e]">{title}</h3>

      {/* Centered mid-card price */}
      <div
        className="mt-6 flex flex-col items-center rounded-2xl border px-4 py-6 text-center"
        style={{ borderColor: accent + "33", backgroundColor: accentBg }}
      >
        <div className="flex items-baseline gap-1">
          <span
            className="font-serif text-5xl font-bold leading-none"
            style={{ color: accent }}
          >
            {price}
          </span>
          {priceUnit && (
            <span className="text-sm font-semibold text-[#6a6a7a]">
              {priceUnit}
            </span>
          )}
        </div>
        <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
          {priceNote}
        </span>
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {highlights.map((h) => (
          <li
            key={h}
            className="flex items-start gap-2 text-sm leading-snug text-[#1a1a2e]"
          >
            <FaCheck
              className="mt-1 flex-none text-[11px]"
              style={{ color: accent }}
            />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: accent }}
      >
        {ctaLabel} <FaArrowRight className="text-xs" />
      </Link>
    </div>
  );
}

function CallPackCard({
  icon,
  label,
  price,
  unit,
  description,
  featured = false,
  featuredLabel = "Best value",
}: {
  icon: React.ReactNode;
  label: string;
  price: string;
  unit: string;
  description: string;
  featured?: boolean;
  featuredLabel?: string;
}) {
  const accent = "#c08a5a";
  const accentBg = "#f6f3ed";
  return (
    <div
      className={
        "relative flex flex-col rounded-2xl bg-white p-6 transition hover:shadow-md " +
        (featured
          ? "border-2 shadow-sm"
          : "border border-[#ece9e3] shadow-sm")
      }
      style={featured ? { borderColor: accent } : undefined}
    >
      {featured && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
          style={{ backgroundColor: accent }}
        >
          {featuredLabel}
        </span>
      )}

      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: accentBg, color: accent }}
      >
        {icon}
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
        {label}
      </p>

      <div className="mt-1 flex items-baseline gap-2">
        <span
          className="font-serif text-4xl font-bold leading-none"
          style={{ color: accent }}
        >
          {price}
        </span>
        <span className="text-xs font-semibold text-[#9a9aaa]">{unit}</span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#6a6a7a]">
        {description}
      </p>
    </div>
  );
}

function ComparisonTable() {
  type Row = {
    label: string;
    report: boolean | string;
    pro: boolean | string;
    premium: boolean | string;
  };
  type Group = { category: string; color: string; bg: string; rows: Row[] };

  const groups: Group[] = [
    {
      category: "Scope & report",
      color: "#c08a5a",
      bg: "#f6f3ed",
      rows: [
        { label: "Project summary", report: true, pro: true, premium: true },
        { label: "Existing conditions snapshot", report: true, pro: true, premium: true },
        { label: "Defined scope (included, excluded, undecided)", report: true, pro: true, premium: true },
        { label: "Room-by-room breakdown", report: true, pro: true, premium: true },
        { label: "What to get clear before bidding", report: true, pro: true, premium: true },
        { label: "Decision checklist", report: true, pro: true, premium: true },
        { label: "Major variables map", report: true, pro: true, premium: true },
        { label: "Builder questions to ask", report: true, pro: true, premium: true },
        { label: "Next-step roadmap", report: true, pro: true, premium: true },
        { label: "Contractor-ready PDF", report: true, pro: true, premium: true },
      ],
    },
    {
      category: "Pre-bid expert support",
      color: "#1a1a2e",
      bg: "#eef0f4",
      rows: [
        { label: "Calls with a real person", report: false, pro: "3 calls", premium: "Unlimited email" },
        { label: "Bid comparison (upload up to 4 bids)", report: false, pro: true, premium: true },
        { label: "One round of scope refinement", report: false, pro: true, premium: true },
      ],
    },
    {
      category: "Mid-build ongoing support",
      color: "#2d5a3d",
      bg: "#eef3ee",
      rows: [
        { label: "Dedicated retired contractor", report: false, pro: false, premium: true },
        { label: "Change-order review", report: false, pro: false, premium: true },
        { label: "Decision support mid-build", report: false, pro: false, premium: true },
        { label: "Email support within 24 hours", report: false, pro: false, premium: true },
        { label: "Ongoing contractor evaluation", report: false, pro: false, premium: true },
      ],
    },
    {
      category: "Ownership",
      color: "#1a1a2e",
      bg: "#eef0f4",
      rows: [
        { label: "Lifetime access to your project", report: true, pro: true, premium: true },
      ],
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#faf8f3] text-left align-bottom">
            <th className="px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
              Feature
            </th>
            <th className="px-4 py-5 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c08a5a]">
                Groundwork Report
              </div>
              <div className="mt-1 font-serif text-lg text-[#1a1a2e]">
                $399
                <span className="ml-1 text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
                  / room
                </span>
              </div>
            </th>
            <th className="px-4 py-5 text-center">
              <div className="inline-block rounded-full bg-[#1a1a2e] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                Most popular
              </div>
              <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a1a2e]">
                Groundwork Pro
              </div>
              <div className="mt-1 font-serif text-lg text-[#1a1a2e]">
                $799
                <span className="ml-1 text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
                  / room
                </span>
              </div>
            </th>
            <th className="px-4 py-5 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d5a3d]">
                Groundwork Premium
              </div>
              <div className="mt-1 font-serif text-lg text-[#1a1a2e]">
                $500+
                <span className="ml-1 text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
                  / mo
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.category}>
              <tr style={{ background: g.bg }}>
                <td
                  colSpan={4}
                  className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: g.color }}
                >
                  {g.category}
                </td>
              </tr>
              {g.rows.map((r, i) => (
                <tr
                  key={r.label}
                  className={
                    "border-t border-[#f0ede7] " +
                    (i % 2 === 0 ? "bg-white" : "bg-[#faf8f3]/40")
                  }
                >
                  <td className="py-3 pl-12 pr-6 text-[#1a1a2e]">{r.label}</td>
                  <Cell value={r.report} accent="#2d5a3d" />
                  <Cell value={r.pro} accent="#2d5a3d" emphasize />
                  <Cell value={r.premium} accent="#2d5a3d" />
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({
  value,
  accent,
  emphasize = false,
}: {
  value: boolean | string;
  accent: string;
  emphasize?: boolean;
}) {
  return (
    <td
      className={
        "px-4 py-3 text-center " + (emphasize ? "bg-[#eef0f4]/60" : "")
      }
    >
      {typeof value === "string" ? (
        <span className="text-xs font-semibold text-[#1a1a2e]">{value}</span>
      ) : value ? (
        <FaCheck className="mx-auto text-sm" style={{ color: accent }} />
      ) : (
        <FaMinus className="mx-auto text-xs text-[#cdcbc4]" />
      )}
    </td>
  );
}

function ValueProp({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg text-[#bde0c0]">
        {icon}
      </div>
      <h3 className="mt-3 font-serif text-lg">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-[#ece9e3] bg-white p-5 open:shadow-sm">
      <summary className="cursor-pointer list-none text-sm font-semibold text-[#1a1a2e]">
        {q}
        <span className="float-right text-[#9a9aaa] transition group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-[#6a6a7a]">{a}</p>
    </details>
  );
}

/* ──────────────────────────────────────────────────────────── */

function BookCallModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selected, setSelected] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  if (!open) return null;

  const monthLabel = viewDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  );
  const startWeekday = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const slots = [
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
  ];

  const goPrev = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const goNext = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const selectedLabel = selected
    ? selected.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a2e]/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-[#ece9e3] bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#ece9e3] bg-[#faf8f3] px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c08a5a]">
              Book a call
            </p>
            <h3 className="mt-1 font-serif text-2xl text-[#1a1a2e]">
              Pick a day and time
            </h3>
            <p className="mt-1 text-xs text-[#6a6a7a]">
              45-minute call with a retired contractor. Times shown in your
              local timezone.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-[#6a6a7a] transition hover:bg-white"
          >
            <FaXmark />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-0 md:grid-cols-2">
          {/* Calendar */}
          <div className="border-b border-[#ece9e3] p-6 md:border-b-0 md:border-r">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#6a6a7a] transition hover:bg-[#f8f7f4]"
                aria-label="Previous month"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <span className="font-serif text-lg text-[#1a1a2e]">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#6a6a7a] transition hover:bg-[#f8f7f4]"
                aria-label="Next month"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a9aaa]">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="py-1.5">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <div key={i} className="h-10" />;
                const past = d < startOfToday;
                const isSelected = selected && isSameDay(d, selected);
                const isToday = isSameDay(d, today);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={past}
                    onClick={() => {
                      setSelected(d);
                      setSlot(null);
                    }}
                    className={
                      "flex h-10 items-center justify-center rounded-lg text-sm transition " +
                      (isSelected
                        ? "bg-[#2d5a3d] font-semibold text-white"
                        : past
                          ? "cursor-not-allowed text-[#cdcbc4]"
                          : "text-[#1a1a2e] hover:bg-[#eef3ee]") +
                      (isToday && !isSelected
                        ? " ring-1 ring-[#2d5a3d]/40"
                        : "")
                    }
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          <div className="flex max-h-[420px] flex-col p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
              {selectedLabel ? "Available times" : "Select a day"}
            </p>
            <p className="mt-1 font-serif text-base text-[#1a1a2e]">
              {selectedLabel ?? "Pick a day on the calendar"}
            </p>

            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              {selected ? (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((t) => {
                    const active = slot === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSlot(t)}
                        className={
                          "rounded-xl border px-3 py-2.5 text-sm font-semibold transition " +
                          (active
                            ? "border-[#2d5a3d] bg-[#2d5a3d] text-white"
                            : "border-[#ece9e3] bg-white text-[#1a1a2e] hover:border-[#2d5a3d]/50 hover:bg-[#eef3ee]")
                        }
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#ece9e3] bg-[#faf8f3] px-6 py-10 text-center text-sm text-[#9a9aaa]">
                  Choose a day to see available time slots.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-[#ece9e3] bg-[#faf8f3] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#6a6a7a]">
            {slot && selectedLabel ? (
              <>
                <span className="font-semibold text-[#1a1a2e]">
                  {selectedLabel}
                </span>{" "}
                at <span className="font-semibold text-[#1a1a2e]">{slot}</span>
              </>
            ) : (
              "Refundable up to 24 hours in advance."
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#6a6a7a] transition hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!slot}
              className={
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition " +
                (slot
                  ? "bg-[#2d5a3d] hover:bg-[#244a32]"
                  : "cursor-not-allowed bg-[#cdcbc4]")
              }
            >
              Confirm booking <FaArrowRight className="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

