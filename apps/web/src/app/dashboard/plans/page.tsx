"use client";
import Link from "next/link";
import {
  FaClipboardList,
  FaUserTie,
  FaBookOpen,
  FaUserShield,
  FaHelmetSafety,
  FaCheck,
  FaMinus,
  FaShieldHalved,
  FaInfinity,
  FaArrowRight,
} from "react-icons/fa6";

/* ──────────────────────────────────────────────────────────────
 * Plans page — high-ticket, ownership-led pricing.
 * Hubspot-style structure: hero → recommended 3-tier → comparison
 * table → add-ons → trust strip → FAQ.
 * Round prices, "one-time", "lifetime project access" language.
 * ────────────────────────────────────────────────────────────── */

export default function PlansPage() {
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
          One payment, lifetime access to your project. No subscriptions on
          Groundwork or Build Book — pay once and keep every scope, render,
          and contractor brief, forever.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#6a6a7a]">
          <span className="inline-flex items-center gap-1.5">
            <FaInfinity className="text-[#2d5a3d]" /> Lifetime project access
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FaShieldHalved className="text-[#2d5a3d]" /> 7-day money-back guarantee
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FaCheck className="text-[#2d5a3d]" /> No subscription on scope or design
          </span>
        </div>
      </header>

      {/* ── 3-tier recommended (Groundwork + Build Book) ─────── */}
      <section>
        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
            Pick a plan
          </span>
          <h2 className="mt-2 font-serif text-3xl text-[#1a1a2e]">
            One-time plans for your project
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <PlanCard
            accent="#c08a5a"
            accentBg="#f6f3ed"
            icon={<FaClipboardList />}
            tag="Self-serve"
            title="Core Scope"
            subtitle="A contractor-ready brief, delivered in 48 hours."
            price="$400"
            priceNote="one-time · per project"
            features={[
              "Structured intake with photos &amp; details",
              "What is changing vs. staying",
              "Plumbing / electrical / layout flags",
              "Realistic cost range",
              "Contractor-ready PDF",
              "Lifetime access to your scope",
            ]}
            ctaHref="/dashboard/groundwork"
            ctaLabel="Get instant access"
          />
          <PlanCard
            accent="#c08a5a"
            accentBg="#f6f3ed"
            icon={<FaUserTie />}
            tag="With expert review"
            title="Guided Scope"
            subtitle="Everything in Core, plus a live review and one round of revisions."
            price="$1,000"
            priceNote="one-time · typical project"
            featured
            featuredLabel="Most popular"
            features={[
              "Everything in Core Scope",
              "Live review call with a renovation expert",
              "One round of revisions",
              "Bid comparison template",
              "Personalized risk flags &amp; cost-driver notes",
              "Lifetime access to your scope",
            ]}
            ctaHref="/dashboard/groundwork?tier=guided"
            ctaLabel="Secure your plan"
          />
          <PlanCard
            accent="#2d5a3d"
            accentBg="#eef3ee"
            icon={<FaBookOpen />}
            tag="For your design"
            title="Build Book"
            subtitle="Moodboard, real-photo AI mockup, and a shareable items list."
            price="$150"
            priceNote="one-time · per project"
            features={[
              "Style direction &amp; inspiration",
              "Real-photo AI mockup of your room",
              "Moodboard with items checklist",
              "Catalogue picks &amp; shopping links",
              "Final shareable Build Book",
              "Lifetime access to your design",
            ]}
            ctaHref="/dashboard/build-books"
            ctaLabel="Get instant access"
          />
        </div>

        <p className="mt-4 text-center text-xs text-[#9a9aaa]">
          All plans are one-time payments. Pricing shown in USD. Guided Scope
          can scale up for unusually complex projects — we&apos;ll quote before
          you commit.
        </p>
      </section>

      {/* ── Comparison table ─────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-[#ece9e3] bg-white">
        <div className="border-b border-[#ece9e3] p-6 text-center">
          <h2 className="font-serif text-2xl text-[#1a1a2e]">Compare what&apos;s included</h2>
          <p className="mt-1 text-sm text-[#6a6a7a]">
            Everything is one-time. Nothing renews automatically.
          </p>
        </div>
        <ComparisonTable />
      </section>

      {/* ── Contractor Advisor — separate layer ──────────────── */}
      <section>
        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1a1a2e]">
            Add expert support
          </span>
          <h2 className="mt-2 font-serif text-3xl text-[#1a1a2e]">
            Bring a contractor onto your side of the table
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6a6a7a]">
            Optional. Add an experienced contractor as your independent advisor
            for bid review, change orders, and the moments that matter.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <AdvisorCard
            icon={<FaHelmetSafety />}
            tag="On-demand"
            title="On-Demand Advisor"
            subtitle="Book an expert for the moments that matter."
            price="$150"
            priceUnit="/ hour"
            priceNote="3-call &amp; 5-call bundles available"
            features={[
              "A consistent advisor matched to your project",
              "Book only when you need it",
              "Bid review — inclusions, exclusions, red flags",
              "Change-order &amp; pricing sanity checks",
              "Help preparing the right contractor questions",
            ]}
            ctaHref="/dashboard/advisor"
            ctaLabel="Book an advisor"
          />
          <AdvisorCard
            icon={<FaUserShield />}
            tag="Continuous support"
            title="Dedicated Advisor"
            subtitle="One advisor, start to finish — calls plus async support."
            price="Retainer"
            priceUnit=""
            priceNote="3-month minimum · 30-day cancellation after"
            features={[
              "Dedicated advisor who builds context over time",
              "Scheduled calls + async messaging &amp; email",
              "Continuous oversight of contractor behavior",
              "Faster decisions — no re-explaining each time",
              "All On-Demand use cases included",
            ]}
            ctaHref="/dashboard/advisor?tier=dedicated"
            ctaLabel="Request a match"
          />
        </div>
      </section>

      {/* ── Trust / value strip ──────────────────────────────── */}
      <section className="rounded-3xl bg-[#1a1a2e] p-10 text-white">
        <div className="grid gap-6 md:grid-cols-3">
          <ValueProp
            icon={<FaInfinity />}
            title="Lifetime project access"
            body="Your scope, design, and brief stay in your account forever — no renewal fees, no expiry."
          />
          <ValueProp
            icon={<FaShieldHalved />}
            title="7-day money-back"
            body="If your Core or Guided Scope doesn&apos;t make your bids clearer, we refund it."
          />
          <ValueProp
            icon={<FaCheck />}
            title="One simple payment"
            body="Pay once per project. No subscription on scope or design — only Advisor retainers are monthly."
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
            q="Why one-time pricing instead of a subscription?"
            a="A renovation has a clear start and finish. You shouldn&apos;t pay forever for a deliverable you produced once. You own your scope and Build Book the same way you&apos;d own a set of architectural drawings."
          />
          <Faq
            q="What's the difference between Core and Guided Scope?"
            a="Core is fast, structured, self-serve, and produces a contractor-ready scope in 48 hours. Guided adds a live expert review call, one round of revisions, deeper risk flags, and a bid comparison template — built for projects with more ambiguity."
          />
          <Faq
            q="Can I upgrade from Core to Guided later?"
            a="Yes. We credit the full $400 from Core toward Guided if you decide you want expert review afterward."
          />
          <Faq
            q="When should I add a Contractor Advisor?"
            a="On-Demand is great for one-off moments — comparing bids, reviewing a change order, or pricing sanity checks. Dedicated makes sense for larger projects where decisions come up every week."
          />
          <Faq
            q="What if I need a refund?"
            a="If a Core or Guided Scope doesn&apos;t make your bids more comparable, email us within 7 days and we&apos;ll refund the purchase. Advisor calls are refunded if cancelled 24h in advance."
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
            href="/dashboard/groundwork?tier=guided"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2d5a3d] transition hover:bg-[#f8f7f4]"
          >
            Get Guided Scope <FaArrowRight className="text-xs" />
          </Link>
          <Link
            href="/dashboard/guide"
            className="text-sm font-medium text-white/85 underline-offset-4 hover:underline"
          >
            Not sure which layer? Read the guide
          </Link>
        </div>
      </section>
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
  subtitle,
  price,
  priceNote,
  features,
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
  subtitle: string;
  price: string;
  priceNote: string;
  features: string[];
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
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
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
      <p className="mt-1 text-sm text-[#6a6a7a]">{subtitle}</p>

      {/* Centered mid-card price */}
      <div
        className="mt-6 flex flex-col items-center rounded-2xl border px-4 py-6 text-center"
        style={{ borderColor: accent + "33", backgroundColor: accentBg }}
      >
        <span className="font-serif text-5xl font-bold leading-none" style={{ color: accent }}>
          {price}
        </span>
        <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
          {priceNote}
        </span>
      </div>

      <ul className="mt-6 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[#1a1a2e]">
            <FaCheck className="mt-1 flex-none text-[10px]" style={{ color: accent }} />
            <span dangerouslySetInnerHTML={{ __html: f }} />
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

function AdvisorCard({
  icon,
  tag,
  title,
  subtitle,
  price,
  priceUnit,
  priceNote,
  features,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ReactNode;
  tag: string;
  title: string;
  subtitle: string;
  price: string;
  priceUnit: string;
  priceNote: string;
  features: string[];
  ctaHref: string;
  ctaLabel: string;
}) {
  const accent = "#1a1a2e";
  const accentBg = "#ece9e3";
  return (
    <div className="flex flex-col rounded-3xl border border-[#ece9e3] bg-white p-7 shadow-sm">
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
      <p className="mt-1 text-sm text-[#6a6a7a]">{subtitle}</p>

      <div
        className="mt-6 flex flex-col items-center rounded-2xl border px-4 py-6 text-center"
        style={{ borderColor: accent + "33", backgroundColor: accentBg }}
      >
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-5xl font-bold leading-none" style={{ color: accent }}>
            {price}
          </span>
          {priceUnit && (
            <span className="text-sm font-semibold text-[#6a6a7a]">{priceUnit}</span>
          )}
        </div>
        <span
          className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]"
          dangerouslySetInnerHTML={{ __html: priceNote }}
        />
      </div>

      <ul className="mt-6 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[#1a1a2e]">
            <FaCheck className="mt-1 flex-none text-[10px]" style={{ color: accent }} />
            <span dangerouslySetInnerHTML={{ __html: f }} />
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1a2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a3e]"
      >
        {ctaLabel} <FaArrowRight className="text-xs" />
      </Link>
    </div>
  );
}

function ComparisonTable() {
  const rows: { label: string; core: boolean | string; guided: boolean | string; book: boolean | string }[] = [
    { label: "Structured intake & scope summary", core: true, guided: true, book: false },
    { label: "Plumbing / electrical / layout flags", core: true, guided: true, book: false },
    { label: "Open-items list & assumption log", core: true, guided: true, book: false },
    { label: "Realistic cost range", core: "Range", guided: "Refined", book: false },
    { label: "Contractor-ready PDF", core: true, guided: true, book: false },
    { label: "Live expert review call", core: false, guided: true, book: false },
    { label: "One round of revisions", core: false, guided: true, book: false },
    { label: "Bid comparison template", core: false, guided: true, book: false },
    { label: "Personalized risk flags", core: false, guided: true, book: false },
    { label: "Style direction & moodboard", core: false, guided: false, book: true },
    { label: "Real-photo AI mockup", core: false, guided: false, book: true },
    { label: "Items checklist & shopping links", core: false, guided: false, book: true },
    { label: "Lifetime access to your project", core: true, guided: true, book: true },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#faf8f3] text-left">
            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
              Feature
            </th>
            <th className="px-4 py-4 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c08a5a]">
                Core Scope
              </div>
              <div className="mt-1 font-serif text-lg text-[#1a1a2e]">$400</div>
            </th>
            <th className="px-4 py-4 text-center">
              <div className="inline-block rounded-full bg-[#c08a5a] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                Most popular
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c08a5a]">
                Guided Scope
              </div>
              <div className="mt-1 font-serif text-lg text-[#1a1a2e]">$1,000</div>
            </th>
            <th className="px-4 py-4 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d5a3d]">
                Build Book
              </div>
              <div className="mt-1 font-serif text-lg text-[#1a1a2e]">$150</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.label}
              className={i % 2 === 0 ? "bg-white" : "bg-[#faf8f3]/50"}
            >
              <td className="px-6 py-3 text-[#1a1a2e]">{r.label}</td>
              <Cell value={r.core} accent="#c08a5a" />
              <Cell value={r.guided} accent="#c08a5a" emphasize />
              <Cell value={r.book} accent="#2d5a3d" />
            </tr>
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
        "px-4 py-3 text-center " + (emphasize ? "bg-[#f6f3ed]/40" : "")
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
        <span className="float-right text-[#9a9aaa] transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-[#6a6a7a]">{a}</p>
    </details>
  );
}
