"use client";

import Link from "next/link";
import { FaClipboardList, FaBookOpen, FaArrowRight } from "react-icons/fa6";

/* ────────────────────────────────────────────────────────────────
 * "Start" landing — splits the old single wizard into our two
 * standalone products. Contractor Advisor is intentionally not
 * shown here yet.
 * ──────────────────────────────────────────────────────────────── */
export default function StartPage() {
  return (
    <div className="min-h-screen bg-[#faf8f3]">
      <header className="border-b border-[#ece9e3] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-6">
          <Link
            href="/dashboard"
            className="text-sm text-[#6a6a7a] transition hover:text-[#1a1a2e]"
          >
            &lt; Back to dashboard
          </Link>
          <div className="flex-1 text-center text-sm font-semibold tracking-wide text-[#1a1a2e]">
            Before the Build
          </div>
          <div className="w-32" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-[#1a1a2e]">
            What do you need today?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#6a6a7a]">
            Pick the layer that fits where you are. They work great on their
            own — Groundwork to talk to your builder, Build Book to nail down
            the design.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <ProductCard
            href="/groundwork/bathroom"
            tag="Groundwork"
            price="From $399"
            title="Define the project clearly enough that contractors bid the same thing."
            bullets={[
              "Project type, what's changing vs staying",
              "Plumbing, electrical & layout flags",
              "Open-items list & assumption log",
              "Realistic cost range",
              "Contractor-ready scope summary (PDF)",
            ]}
            icon={<FaClipboardList className="text-2xl text-[#c08a5a]" />}
            cta="Start Groundwork"
          />
          <ProductCard
            href="/build-book/bathroom/design"
            tag="Build Book"
            price="Design layer"
            title="Decide the design — moodboard, real-photo mockup, items list."
            bullets={[
              "Style direction & inspiration",
              "Real-photo AI mockup",
              "Moodboard with items checklist",
              "Catalogue & shopping links",
              "Final shareable Build Book",
            ]}
            icon={<FaBookOpen className="text-2xl text-[#c08a5a]" />}
            cta="Start Build Book"
          />
        </div>

        <p className="mt-10 text-center text-xs text-[#9a9890]">
          Contractor Advisor — bid comparison & risk flags during construction —
          coming soon.
        </p>
      </main>
    </div>
  );
}

function ProductCard({
  href,
  tag,
  price,
  title,
  bullets,
  icon,
  cta,
}: {
  href: string;
  tag: string;
  price: string;
  title: string;
  bullets: string[];
  icon: React.ReactNode;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-[#ece9e3] bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1a1a2e] hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9a9890]">
          {price}
        </span>
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-[#c08a5a]">
        {tag}
      </p>
      <h2 className="mt-2 font-serif text-2xl leading-snug text-[#1a1a2e]">
        {title}
      </h2>
      <ul className="mt-6 flex-1 space-y-2 text-sm text-[#3a3a4a]">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[#c08a5a]" />
            {b}
          </li>
        ))}
      </ul>
      <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a2e]">
        {cta}
        <FaArrowRight className="text-xs transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
