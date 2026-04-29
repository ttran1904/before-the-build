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
} from "react-icons/fa6";

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-16">
      {/* Hero */}
      <header className="space-y-3 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6a6a7a]">
          The 2-minute guide
        </p>
        <h1 className="font-serif text-4xl text-[#1a1a2e]">Two ways we help</h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#6a6a7a]">
          Before the Build is two products that work great alone or together.
          Use Groundwork Scope to align with your contractor. Use Build Book to
          decide the design.
        </p>
      </header>

      {/* Side-by-side product cards */}
      <section className="grid gap-6 md:grid-cols-2">
        <ProductCard
          accent="#c08a5a"
          accentBg="#f6f3ed"
          icon={<FaClipboardList />}
          tag="For your contractor"
          title="Groundwork Scope"
          price="$399"
          priceNote="one-time, per project"
          subtitle="A contractor-ready brief — so every bid is for the same project."
          purpose="Pin down what is actually changing, what's staying, and what unknowns need a pro to answer."
          deliverables={[
            "Project type (cosmetic, pull-and-replace, full gut, layout change)",
            "Plumbing / electrical / layout flags",
            "Open-items list & assumption log",
            "Realistic cost range",
            "Shareable PDF for contractor walkthroughs",
          ]}
          when="Before you reach out to contractors, or before you accept a quote."
          ctaHref="/dashboard/groundwork"
          ctaLabel="Open Groundwork Scope"
        />
        <ProductCard
          accent="#2d5a3d"
          accentBg="#eef3ee"
          icon={<FaBookOpen />}
          tag="For your design"
          title="Build Book"
          price="$150"
          priceNote="one-time, per project"
          subtitle="The design layer — moodboard, real-photo mockup, items list."
          purpose="Translate vibes and Pinterest pins into a concrete, buildable design."
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
      </section>

      {/* How they fit together */}
      <section className="rounded-2xl border border-[#ece9e3] bg-white p-8">
        <h2 className="font-serif text-2xl text-[#1a1a2e]">How they fit together</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6a6a7a]">
          Most people start with Groundwork Scope to get clear, then move into
          Build Book once they know the budget and the constraints. Either way
          works.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <FlowStep
            num="1"
            icon={<FaClipboardList className="text-[#c08a5a]" />}
            title="Scope it"
            body="Walk the Groundwork Scope wizard. Get a contractor-ready brief and a cost range."
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
            body="Share both deliverables with your contractor. Coming soon: Contractor Advisor."
          />
        </div>
      </section>

      {/* What you'll see — mock screenshot placeholders */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-[#1a1a2e]">What you&apos;ll see</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Drop a real screenshot in the placeholder div below when ready. */}
          <Mockshot
            label="Groundwork Scope wizard"
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
            caption="Groundwork Scope exports a tidy brief contractors can bid against."
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
            q="Do I need both?"
            a="No. Each works alone. Most people get the most value when they use Groundwork Scope first, then Build Book — but you can start with either."
          />
          <Faq
            q="How long does Groundwork Scope take?"
            a="Most people finish a bathroom in under 15 minutes. The wizard skips questions that don&apos;t apply to you."
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
          Pick a starting point. You can always come back and add the other later.
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
}) {
  return (
    <div className="relative flex flex-col rounded-2xl border border-[#ece9e3] bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
            style={{ backgroundColor: accentBg, color: accent }}
          >
            {icon}
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: accentBg, color: accent }}
          >
            {tag}
          </span>
        </div>
        <div
          className="flex flex-col items-end rounded-xl border px-3 py-1.5 text-right leading-tight"
          style={{ borderColor: accent + "33", backgroundColor: accentBg }}
        >
          <span className="text-xl font-bold" style={{ color: accent }}>{price}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#9a9aaa]">{priceNote}</span>
        </div>
      </div>
      <h3 className="mt-4 font-serif text-2xl text-[#1a1a2e]">{title}</h3>
      <p className="mt-1 text-sm text-[#6a6a7a]">{subtitle}</p>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#9a9aaa]">
        Purpose
      </p>
      <p className="mt-1 text-sm text-[#1a1a2e]">{purpose}</p>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#9a9aaa]">
        Deliverables
      </p>
      <ul className="mt-2 space-y-1.5">
        {deliverables.map((d) => (
          <li key={d} className="flex items-start gap-2 text-sm text-[#1a1a2e]">
            <FaCheck className="mt-1 flex-none text-[10px]" style={{ color: accent }} />
            <span>{d}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#9a9aaa]">
        When to use
      </p>
      <p className="mt-1 text-sm text-[#1a1a2e]">{when}</p>

      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition"
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
      {/* Replace this placeholder with a real <Image src="..." /> when assets are ready. */}
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