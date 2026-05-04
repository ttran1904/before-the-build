"use client";

import Link from "next/link";
import {
  FaArrowRight,
  FaBookOpen,
  FaCheck,
  FaClipboardList,
  FaHelmetSafety,
  FaRegCompass,
  FaRegHandshake,
  FaRegLightbulb,
  FaTag,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

/* ──────────────────────────────────────────────────────────────
 * Guide page — three-chapter walkthrough.
 * Tight copy, cozy palette, sleek surfaces. Pricing lives on
 * /dashboard/plans.
 * ────────────────────────────────────────────────────────────── */

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-20 pb-20">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c08a5a]">
          The renovation guide
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl font-serif text-4xl leading-[1.1] text-[#1a1a2e] sm:text-5xl">
          A renovation in your head,
          <br />
          on paper in three chapters.
        </h1>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard/groundwork"
            className="inline-flex items-center gap-2 rounded-full bg-[#2d5a3d] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#244a32]"
          >
            Start the journey <FaArrowRight className="text-[10px]" />
          </Link>
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-2 rounded-full border border-[#1a1a2e] bg-white px-6 py-3 text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#1a1a2e] hover:text-white"
          >
            <FaTag className="text-[10px]" /> See plans
          </Link>
        </div>
      </header>

      {/* ── Three chapters at a glance ───────────────────────── */}
      <section>
        <ol className="grid gap-4 md:grid-cols-3">
          <Step
            num="01"
            color="#c08a5a"
            icon={<FaRegCompass />}
            title="Find your footing"
            blurb="One brief every contractor bids the same way."
          />
          <Step
            num="02"
            color="#2d5a3d"
            icon={<FaRegLightbulb />}
            title="See the room"
            blurb="Lock the look before a tile is cut."
          />
          <Step
            num="03"
            color="#1a1a2e"
            icon={<FaRegHandshake />}
            title="Stand your ground"
            blurb="A pro on your side when bids get hard."
          />
        </ol>
      </section>

      {/* ── Chapter 1 ────────────────────────────────────────── */}
      <Chapter
        chapterLabel="Chapter 1"
        chapterColor="#c08a5a"
        chapterBg="#f6f3ed"
        icon={FaClipboardList}
        heading="Three bids. Three different scopes."
        body="Every contractor walks the room and writes down what they think you want. Groundwork turns it into one clean brief — what's changing, what's staying, the must-haves — that everyone bids the same way."
        outcomes={[
          "Contractor-ready scope PDF",
          "Realistic cost range",
          "Questions that prevent change orders",
          "One brief every contractor reads the same",
        ]}
        productName="Groundwork"
        productHref="/dashboard/groundwork"
        productCta="Begin Groundwork"
      />

      {/* ── Chapter 2 ────────────────────────────────────────── */}
      <Chapter
        chapterLabel="Chapter 2"
        chapterColor="#2d5a3d"
        chapterBg="#eef3ee"
        icon={FaBookOpen}
        heading="See it before a tile is cut."
        body="Without a visual, design choices stretch on for weeks. Build Book gives you a moodboard you trust, a real-photo render of the finished room, and a tidy PDF that walks the contractor through every finish."
        outcomes={[
          "Moodboard you trust",
          "Real-photo AI mockup",
          "Items checklist & shopping links",
          "Shareable Build Book PDF",
        ]}
        productName="Build Book"
        productHref="/dashboard/build-books"
        productCta="Open Build Book"
      />

      {/* ── Chapter 3 ────────────────────────────────────────── */}
      <Chapter
        chapterLabel="Chapter 3"
        chapterColor="#1a1a2e"
        chapterBg="#eef0f4"
        icon={FaHelmetSafety}
        heading="Bids land. Decisions get hard."
        body="Contractors do this every week — you don't. Contractor Advisor puts an experienced pro on your side: hourly for the moments that matter, or on retainer through the whole project."
        outcomes={[
          "Bid review with red flags called out",
          "Change-order sanity checks",
          "Plain-English next steps",
          "A pro on call when it counts",
        ]}
        productName="Contractor Advisor"
        productHref="/dashboard/plans"
        productCta="Bring an advisor in"
      />

      {/* ── Closing ──────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-[#ece9e3] bg-gradient-to-br from-[#faf8f3] via-white to-[#f6f3ed] p-12 text-center">
        <h2 className="font-serif text-3xl text-[#1a1a2e] sm:text-4xl">
          A renovation you trust — start to finish.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-[#6a6a7a]">
          Use one chapter alone, or stack them.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard/groundwork"
            className="inline-flex items-center gap-2 rounded-full bg-[#2d5a3d] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#244a32]"
          >
            Start with Groundwork <FaArrowRight className="text-[10px]" />
          </Link>
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-2 rounded-full border border-[#1a1a2e] bg-white px-6 py-3 text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#1a1a2e] hover:text-white"
          >
            Compare plans
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Building blocks ─────────────────────────────────────────── */

function Step({
  num,
  color,
  icon,
  title,
  blurb,
}: {
  num: string;
  color: string;
  icon: React.ReactNode;
  title: string;
  blurb: string;
}) {
  return (
    <li className="group rounded-2xl border border-[#ece9e3] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: color + "1a", color }}
        >
          {icon}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color }}
        >
          {num}
        </span>
      </div>
      <h3 className="mt-5 font-serif text-xl text-[#1a1a2e]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#6a6a7a]">{blurb}</p>
    </li>
  );
}

function Chapter({
  chapterLabel,
  chapterColor,
  chapterBg,
  icon: Icon,
  heading,
  body,
  outcomes,
  productName,
  productHref,
  productCta,
}: {
  chapterLabel: string;
  chapterColor: string;
  chapterBg: string;
  icon: IconType;
  heading: string;
  body: string;
  outcomes: string[];
  productName: string;
  productHref: string;
  productCta: string;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#ece9e3] bg-white shadow-sm">
      <div className="grid gap-0 md:grid-cols-[260px_1fr]">
        {/* Left rail */}
        <aside
          className="flex flex-col justify-between gap-6 p-8 md:border-r md:border-[#ece9e3]"
          style={{ background: chapterBg }}
        >
          <div>
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm"
              style={{ color: chapterColor }}
            >
              <Icon />
            </span>
            <p
              className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: chapterColor }}
            >
              {chapterLabel}
            </p>
            <p className="mt-1 font-serif text-2xl text-[#1a1a2e]">
              {productName}
            </p>
          </div>
          <Link
            href={productHref}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: chapterColor }}
          >
            {productCta} <FaArrowRight className="text-[9px]" />
          </Link>
        </aside>

        {/* Body */}
        <div className="space-y-5 p-8 md:p-10">
          <h2 className="font-serif text-2xl leading-snug text-[#1a1a2e] sm:text-[28px]">
            {heading}
          </h2>
          <p className="text-[15px] leading-relaxed text-[#4a4a5a]">{body}</p>
          <div
            className="rounded-2xl px-5 py-5"
            style={{ background: chapterBg }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: chapterColor }}
            >
              Where you land
            </p>
            <ul className="mt-3 grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
              {outcomes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-[#1a1a2e]"
                >
                  <span
                    className="mt-1 flex h-4 w-4 flex-none items-center justify-center rounded-full"
                    style={{ background: chapterColor }}
                  >
                    <FaCheck className="text-[8px] text-white" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}