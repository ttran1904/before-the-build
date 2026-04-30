"use client";
import Link from "next/link";
import {
  FaClipboardList,
  FaBookOpen,
  FaArrowRight,
  FaCheck,
  FaImage,
  FaPalette,
  FaFilePdf,
  FaHelmetSafety,
  FaScrewdriverWrench,
  FaUserTie,
  FaUserShield,
} from "react-icons/fa6";

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 pb-16">
      {/* Hero */}
      <header className="space-y-3 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6a6a7a]">
          The 2-minute guide
        </p>
        <h1 className="font-serif text-4xl text-[#1a1a2e]">Three layers we offer</h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#6a6a7a]">
          Before the Build is built in three layers — Groundwork to define the
          project, Build Book to decide the design, and Contractor Advisor to
          help you make the call when bids and decisions get hard. Use any
          layer alone or stack them.
        </p>
      </header>

      {/* ── Layer 1 · Groundwork ── */}
      <section className="space-y-4">
        <LayerHeading
          eyebrow="Layer 1 · Groundwork"
          eyebrowColor="#c08a5a"
          title="Define the project clearly"
          subtitle="So every contractor bids the same project — not their own interpretation."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <ProductCard
            accent="#c08a5a"
            accentBg="#f6f3ed"
            icon={<FaClipboardList />}
            tag="Self-serve"
            title="Groundwork Core Scope"
            price="$399"
            priceNote="one-time, per project"
            subtitle="Structured intake → contractor-ready scope, delivered in 48 hours."
            purpose="For homeowners who already have a general idea and want help structuring it into a clear, contractor-ready scope."
            deliverables={[
              "Structured intake flow with photos & room details",
              "What is changing vs. staying",
              "Plumbing / electrical / layout flags",
              "Open-items list & assumption log",
              "Realistic cost range",
              "Contractor-ready scope summary (PDF)",
              "Hidden costs & key questions to ask",
              "48-hour turnaround",
            ]}
            when="Before you reach out to contractors, or before you accept a quote."
            ctaHref="/dashboard/groundwork"
            ctaLabel="Open Groundwork Scope"
          />
          <ProductCard
            accent="#c08a5a"
            accentBg="#f6f3ed"
            icon={<FaUserTie />}
            tag="With expert review"
            title="Groundwork Guided Scope"
            price="$750–$1,500"
            priceNote="one-time · scaled to project complexity"
            subtitle="Everything in Core, plus a live review call and one round of revisions."
            featured
            featuredLabel="Most popular"
            purpose="For more complex renovations where you want validation and iteration before you ask for bids."
            deliverables={[
              "Everything in Core Scope",
              "Deeper scope definition & expanded assumption log",
              "More specific cost range",
              "One live review call with an expert",
              "One round of revisions",
              "Bid comparison template",
              "Personalized risk flags",
              "Cost-driver explanations",
            ]}
            when="Kitchens, full bathrooms, or anything with real ambiguity you want to resolve before bidding."
            ctaHref="/dashboard/groundwork?tier=guided"
            ctaLabel="Open Guided Scope"
          />
        </div>
      </section>

      {/* ── Layer 2 · Build Book ── */}
      <section className="space-y-4">
        <LayerHeading
          eyebrow="Layer 2 · Build Book"
          eyebrowColor="#2d5a3d"
          title="Decide the design"
          subtitle="Translate vibes and Pinterest pins into a concrete, buildable design."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <ProductCard
            accent="#2d5a3d"
            accentBg="#eef3ee"
            icon={<FaBookOpen />}
            tag="For your design"
            title="Build Book"
            price="$150"
            priceNote="one-time, per project"
            subtitle="Moodboard, real-photo AI mockup, and a shareable items list."
            purpose="Lock in the look and the items list so your scope reflects real choices, not vibes."
            deliverables={[
              "Style direction & inspiration",
              "Real-photo AI mockup of your room",
              "Moodboard with items checklist",
              "Catalogue picks & shopping links",
              "Final shareable Build Book",
            ]}
            when="Once you know the scope, or anytime you want to lock in the look."
            ctaHref="/dashboard/build-books"
            ctaLabel="Open Build Books"
          />
          <div className="flex flex-col justify-between rounded-2xl border border-dashed border-[#c8c5be] bg-[#faf8f3] p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
                Pairs well with
              </p>
              <h3 className="mt-2 font-serif text-2xl text-[#1a1a2e]">
                Groundwork + Build Book
              </h3>
              <p className="mt-2 text-sm text-[#6a6a7a]">
                Most homeowners scope it first, then design it. Both deliverables
                sit side-by-side in one shareable project — and your contractor
                sees exactly the same picture you do.
              </p>
            </div>
            <ul className="mt-4 space-y-2">
              {[
                "One linked project, two deliverables",
                "No duplicate data entry",
                "Share both as a single PDF or live link",
              ].map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-[#1a1a2e]">
                  <FaCheck className="mt-1 flex-none text-[10px] text-[#2d5a3d]" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Layer 3 · Contractor Advisor ── */}
      <section className="space-y-4">
        <LayerHeading
          eyebrow="Layer 3 · Contractor Advisor"
          eyebrowColor="#1a1a2e"
          title="A real contractor on your side of the table"
          subtitle="Independent, experienced contractors who help you review bids, evaluate change orders, and sanity-check decisions during construction."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <ProductCard
            accent="#1a1a2e"
            accentBg="#ece9e3"
            icon={<FaHelmetSafety />}
            tag="On-demand"
            title="On-Demand Advisor"
            price="$150 / hour"
            priceNote="bundles available · pay as you go"
            subtitle="Book an expert at the moments that matter — bids, change orders, decisions."
            purpose="For homeowners who want expert input at specific moments rather than continuous support."
            deliverables={[
              "A consistent advisor matched to your project",
              "Schedule calls only when you need them",
              "Bid review — inclusions, exclusions, red flags",
              "Change-order review & pricing sanity checks",
              "Help preparing the right contractor questions",
              "3-call & 5-call discounted bundles",
            ]}
            when="Bid comparison, change orders, or when you hit a decision you don't want to make alone."
            ctaHref="/dashboard/advisor"
            ctaLabel="Talk to an advisor"
          />
          <ProductCard
            accent="#1a1a2e"
            accentBg="#ece9e3"
            icon={<FaUserShield />}
            tag="Continuous support"
            title="Dedicated Advisor"
            price="Monthly retainer"
            priceNote="3-month minimum · auto-renews monthly"
            subtitle="One advisor, start to finish. Calls plus async support across the whole project."
            purpose="For larger renovations where you want consistent oversight from a single person who knows your project."
            deliverables={[
              "Dedicated advisor who builds context over time",
              "Scheduled calls + async messaging & email",
              "Continuous oversight of contractor behavior",
              "Faster decisions — no re-explaining each time",
              "All On-Demand use cases included",
              "30-day cancellation notice after the initial term",
            ]}
            when="Whole-home or larger renovations where decisions show up weekly and continuity matters."
            ctaHref="/dashboard/advisor?tier=dedicated"
            ctaLabel="Request a dedicated advisor"
          />
        </div>
      </section>

      {/* How they fit together */}
      <section className="rounded-2xl border border-[#ece9e3] bg-white p-8">
        <h2 className="font-serif text-2xl text-[#1a1a2e]">How the layers fit together</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6a6a7a]">
          Most people start with Groundwork to get clear, then move into
          Build Book once they know the budget and constraints, and bring in a
          Contractor Advisor when bids land or decisions get hard.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <FlowStep
            num="1"
            icon={<FaClipboardList className="text-[#c08a5a]" />}
            title="Scope it"
            body="Walk the Groundwork wizard. Get a contractor-ready brief and a cost range."
          />
          <FlowStep
            num="2"
            icon={<FaPalette className="text-[#2d5a3d]" />}
            title="Design it"
            body="Open a Build Book. Pin inspiration, generate a mockup, build your items list."
          />
          <FlowStep
            num="3"
            icon={<FaHelmetSafety className="text-[#1a1a2e]" />}
            title="Build it"
            body="Bring an advisor onto your side of the table for bids and change orders."
          />
        </div>
      </section>

      {/* What you'll see — mock screenshot placeholders */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-[#1a1a2e]">What you&apos;ll see</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Mockshot
            label="Groundwork wizard"
            caption="One question at a time. The app hand-holds you through scope."
            tint="#f6f3ed"
            icon={<FaClipboardList className="text-3xl text-[#c08a5a]/60" />}
          />
          <Mockshot
            label="Build Book mockup"
            caption="Upload a photo of your room, get a designed render back."
            tint="#eef3ee"
            icon={<FaImage className="text-3xl text-[#2d5a3d]/60" />}
          />
          <Mockshot
            label="Contractor PDF"
            caption="Groundwork exports a tidy brief contractors can bid against."
            tint="#f6f3ed"
            icon={<FaFilePdf className="text-3xl text-[#c08a5a]/60" />}
          />
          <Mockshot
            label="Items checklist"
            caption="Build Book tracks every fixture, finish, and link in one place."
            tint="#eef3ee"
            icon={<FaScrewdriverWrench className="text-3xl text-[#2d5a3d]/60" />}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="rounded-2xl border border-[#ece9e3] bg-white p-8">
        <h2 className="font-serif text-2xl text-[#1a1a2e]">Frequently asked</h2>
        <div className="mt-4 space-y-3">
          <Faq
            q="Do I need all three layers?"
            a="No. Each works alone. The most common path is Core or Guided Scope first, then Build Book, then an Advisor when bids or change orders show up."
          />
          <Faq
            q="What's the difference between Core and Guided Scope?"
            a="Core is a fast, structured self-serve flow that produces a contractor-ready scope in 48 hours. Guided adds a live expert review call, one round of revisions, deeper risk flags, and a bid comparison template."
          />
          <Faq
            q="When should I add a Contractor Advisor?"
            a="On-Demand is great for one-off moments — comparing bids, reviewing a change order, or pricing sanity checks. Dedicated makes sense for larger projects where decisions come up every week."
          />
          <Faq
            q="Can I share my Build Book with my contractor?"
            a="Yes — every Build Book has a shareable link, and you can export it as a PDF."
          />
          <Faq
            q="What about kitchens and other rooms?"
            a="Bathroom is first. Kitchen and other rooms are coming after we&apos;ve nailed the v1 experience."
          />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="rounded-2xl bg-[#1a1a2e] p-8 text-center text-white">
        <h2 className="font-serif text-2xl">Ready when you are.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
          Pick a starting point. You can always come back and add the other
          layers later.
        </p>
        <Link
          href="/start"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#faf8f3]"
        >
          Start your first project <FaArrowRight className="text-xs" />
        </Link>
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */

function LayerHeading({
  eyebrow,
  eyebrowColor,
  title,
  subtitle,
}: {
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: eyebrowColor }}
      >
        {eyebrow}
      </span>
      <h2 className="mt-2 font-serif text-3xl text-[#1a1a2e]">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-[#6a6a7a]">{subtitle}</p>
    </div>
  );
}

function ProductCard({
  accent,
  accentBg,
  icon,
  tag,
  title,
  price,
  priceNote,
  subtitle,
  purpose,
  deliverables,
  when,
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
  priceNote: string;
  subtitle: string;
  purpose: string;
  deliverables: string[];
  when: string;
  ctaHref: string;
  ctaLabel: string;
  featured?: boolean;
  featuredLabel?: string;
}) {
  return (
    <div
      className={
        "relative flex flex-col rounded-2xl bg-white p-6 " +
        (featured ? "border-2 shadow-md" : "border border-[#ece9e3]")
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

      {/* Header: icon left, tag immediately to the right */}
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

      <h3 className="mt-4 font-serif text-2xl text-[#1a1a2e]">{title}</h3>
      <p className="mt-1 text-sm text-[#6a6a7a]">{subtitle}</p>

      {/* Price block — centered, mid-card */}
      <div
        className="mt-5 flex flex-col items-center rounded-xl border px-4 py-4 text-center"
        style={{ borderColor: accent + "33", backgroundColor: accentBg }}
      >
        <span className="font-serif text-4xl font-bold leading-none" style={{ color: accent }}>
          {price}
        </span>
        <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
          {priceNote}
        </span>
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
        Purpose
      </p>
      <p className="mt-1 text-sm text-[#1a1a2e]">{purpose}</p>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
        What you get
      </p>
      <ul className="mt-2 space-y-1.5">
        {deliverables.map((d) => (
          <li key={d} className="flex items-start gap-2 text-sm text-[#1a1a2e]">
            <FaCheck className="mt-1 flex-none text-[10px]" style={{ color: accent }} />
            <span>{d}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9aaa]">
        When to use
      </p>
      <p className="mt-1 text-sm text-[#1a1a2e]">{when}</p>

      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: accent }}
      >
        {ctaLabel} <FaArrowRight className="text-xs" />
      </Link>
    </div>
  );
}

function FlowStep({
  num,
  icon,
  title,
  body,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-[#ece9e3] bg-[#faf8f3] p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#1a1a2e]">
          {num}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <h3 className="mt-3 text-sm font-bold text-[#1a1a2e]">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#6a6a7a]">{body}</p>
    </div>
  );
}

function Mockshot({
  label,
  caption,
  tint,
  icon,
}: {
  label: string;
  caption: string;
  tint: string;
  icon: React.ReactNode;
}) {
  return (
    <figure className="space-y-2">
      <div
        className="flex aspect-video items-center justify-center rounded-xl border border-[#ece9e3]"
        style={{ backgroundColor: tint }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          {icon}
          <span className="text-[11px] uppercase tracking-wider text-[#9a9aaa]">
            Screenshot placeholder
          </span>
        </div>
      </div>
      <figcaption>
        <span className="text-sm font-semibold text-[#1a1a2e]">{label}</span>
        <span className="block text-xs text-[#6a6a7a]">{caption}</span>
      </figcaption>
    </figure>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-lg border border-[#ece9e3] bg-[#faf8f3] p-4 open:bg-white">
      <summary className="cursor-pointer list-none text-sm font-semibold text-[#1a1a2e]">
        {q}
        <span className="float-right text-[#9a9aaa] transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-[#6a6a7a]">{a}</p>
    </details>
  );
}
