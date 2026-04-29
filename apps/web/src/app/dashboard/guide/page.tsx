"use client";
import Link from "next/link";
import {
  FaClipboardList,
  FaBookOpen,
  FaHelmetSafety,
  FaArrowRight,
  FaTag,
  FaRegCompass,
  FaRegLightbulb,
  FaRegHandshake,
} from "react-icons/fa6";

/* ──────────────────────────────────────────────────────────────
 * Guide page — the customer’s journey, told as a short story.
 * Pricing & comparisons live on /dashboard/plans.
 * ────────────────────────────────────────────────────────────── */

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 pb-20">
      {/* ── Hero ── */}
      <header className="space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a6a7a]">
          Your renovation, step by step
        </p>
        <h1 className="font-serif text-4xl leading-tight text-[#1a1a2e] sm:text-5xl">
          You have a renovation in your head.
          <br />
          Let’s get it on paper — together.
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#4a4a5a]">
          Renovating is a story you’re the main character of. We’re the guide
          who walks beside you — from the first messy idea, to a plan
          contractors can actually bid, to the moment the keys are back in
          your hand.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <Link
            href="/dashboard/groundwork"
            className="inline-flex items-center gap-2 rounded-full bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#244a32]"
          >
            Start the journey <FaArrowRight className="text-[10px]" />
          </Link>
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-2 rounded-full border border-[#1a1a2e] px-5 py-2.5 text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#1a1a2e] hover:text-white"
          >
            <FaTag className="text-[10px]" /> See plans
          </Link>
        </div>
      </header>

      {/* ── Journey strip ── */}
      <section className="rounded-3xl border border-[#ece9e3] bg-[#faf8f3] p-8">
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6a6a7a]">
          Your three chapters
        </p>
        <ol className="grid gap-6 md:grid-cols-3">
          <Step
            num="01"
            color="#c08a5a"
            icon={<FaRegCompass />}
            title="Find your footing"
            blurb="Turn the renovation in your head into a brief contractors can bid the same way."
          />
          <Step
            num="02"
            color="#2d5a3d"
            icon={<FaRegLightbulb />}
            title="See the room"
            blurb="Lock in the look — finishes, fixtures, layout — so design decisions stop spiraling."
          />
          <Step
            num="03"
            color="#1a1a2e"
            icon={<FaRegHandshake />}
            title="Stand your ground"
            blurb="Bring an experienced contractor onto your side of the table when bids and changes get hard."
          />
        </ol>
      </section>

      {/* ── Chapter 1 ── */}
      <Chapter
        chapterLabel="Chapter 1"
        chapterColor="#c08a5a"
        chapterBg="#f6f3ed"
        icon={<FaClipboardList />}
        sceneSetting="It’s late. You’ve got tabs open, a Pinterest board, three bids that look nothing alike, and a quiet feeling that you’re about to make an expensive mistake."
        heading="You know what you want — but no one’s bidding the same thing."
        story={[
          "Every contractor walks the room and writes down what they think you want. Different scopes. Different assumptions. Different prices. You can’t tell who’s honest and who’s lowballing.",
          "Groundwork is the part of the story where you stop guessing. We walk you through a structured intake — what’s changing, what’s staying, the plumbing, the layout, the must-haves — and turn it into one clean brief every contractor reads the same way.",
        ]}
        outcome="By the end of this chapter, you have a contractor-ready scope, a realistic cost range, and a list of the questions that protect you from surprise change orders."
        productName="Groundwork"
        productHref="/dashboard/groundwork"
        productCta="Begin Groundwork"
      />

      {/* ── Chapter 2 ── */}
      <Chapter
        chapterLabel="Chapter 2"
        chapterColor="#2d5a3d"
        chapterBg="#eef3ee"
        icon={<FaBookOpen />}
        sceneSetting="The scope is locked. Now the question shifts: what does this room actually look like? Tile? Vanity? Lighting? Every choice talks to every other choice."
        heading="Now you can see it — before a single tile is cut."
        story={[
          "Without a visual, design decisions stretch on for weeks and cost you sleep. With one, the whole project clicks: contractors order the right things, your spouse stops second-guessing, and you stop saving 400 bookmarks you’ll never use.",
          "Build Book is where the project becomes real. A moodboard you actually trust, a render that shows the finished room, and a tidy PDF that walks the contractor through every finish on the wall.",
        ]}
        outcome="By the end of this chapter, you have a design you’re proud of, written down clearly enough that nobody — including you — can re-litigate it later."
        productName="Build Book"
        productHref="/dashboard/build-books"
        productCta="Open Build Book"
      />

      {/* ── Chapter 3 ── */}
      <Chapter
        chapterLabel="Chapter 3"
        chapterColor="#1a1a2e"
        chapterBg="#eef0f4"
        icon={<FaHelmetSafety />}
        sceneSetting="Bids land. Change orders show up. The contractor explains something in five sentences you can’t quite parse. You wish you had someone to call."
        heading="Bids land. Decisions get hard. You shouldn’t face them alone."
        story={[
          "Most homeowners only renovate a handful of times in their lives. Contractors do it every week. That gap is where money quietly leaks out — through change orders, vague exclusions, and “trust me” pricing.",
          "Contractor Advisor puts an experienced contractor on your side of the table. Book them by the hour for the moments that matter, or keep one on retainer through the whole project so nothing gets decided without a second pair of eyes.",
        ]}
        outcome="By the end of this chapter, you have a pro reading every bid, every change order, and every “we ran into something” call — translating contractor-speak into clear next steps."
        productName="Contractor Advisor"
        productHref="/dashboard/plans"
        productCta="Bring an advisor in"
      />

      {/* ── Closing ── */}
      <section className="overflow-hidden rounded-3xl border border-[#ece9e3] bg-gradient-to-br from-[#faf8f3] via-white to-[#f6f3ed] p-10 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a6a7a]">
          The ending you came here for
        </p>
        <h2 className="mt-3 font-serif text-3xl text-[#1a1a2e]">
          A renovation you trust — start to finish.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#4a4a5a]">
          Pick the chapter you’re in. Use one layer alone, or stack them. We’ll
          walk with you for as much of the story as you want.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard/groundwork"
            className="inline-flex items-center gap-2 rounded-full bg-[#2d5a3d] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#244a32]"
          >
            Start with Groundwork <FaArrowRight className="text-[10px]" />
          </Link>
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-2 rounded-full border border-[#1a1a2e] px-6 py-2.5 text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#1a1a2e] hover:text-white"
          >
            Compare plans
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Building blocks ── */

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
    <li className="relative rounded-2xl border border-[#ece9e3] bg-white p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: color + "1a", color }}
        >
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
          Step {num}
        </span>
      </div>
      <h3 className="mt-3 font-serif text-lg text-[#1a1a2e]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[#6a6a7a]">{blurb}</p>
    </li>
  );
}

function Chapter({
  chapterLabel,
  chapterColor,
  chapterBg,
  icon,
  sceneSetting,
  heading,
  story,
  outcome,
  productName,
  productHref,
  productCta,
}: {
  chapterLabel: string;
  chapterColor: string;
  chapterBg: string;
  icon: React.ReactNode;
  sceneSetting: string;
  heading: string;
  story: string[];
  outcome: string;
  productName: string;
  productHref: string;
  productCta: string;
}) {
  return (
    <section className="grid gap-8 md:grid-cols-[260px,1fr]">
      {/* Left rail */}
      <aside className="md:sticky md:top-24 md:self-start">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
          style={{ backgroundColor: chapterBg, color: chapterColor }}
        >
          {icon}
        </div>
        <p
          className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ color: chapterColor }}
        >
          {chapterLabel}
        </p>
        <p className="mt-1 font-serif text-xl text-[#1a1a2e]">{productName}</p>
        <Link
          href={productHref}
          className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
          style={{ backgroundColor: chapterColor }}
        >
          {productCta} <FaArrowRight className="text-[9px]" />
        </Link>
      </aside>

      {/* Story column */}
      <div className="space-y-5">
        <p
          className="rounded-xl border-l-4 px-4 py-3 text-sm italic leading-relaxed text-[#4a4a5a]"
          style={{ borderColor: chapterColor, backgroundColor: chapterBg + "80" }}
        >
          {sceneSetting}
        </p>
        <h2 className="font-serif text-2xl leading-snug text-[#1a1a2e] sm:text-3xl">
          {heading}
        </h2>
        {story.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-[#4a4a5a] sm:text-base">
            {para}
          </p>
        ))}
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: chapterColor + "33", backgroundColor: "white" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: chapterColor }}>
            Where you land
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#4a4a5a]">{outcome}</p>
        </div>
      </div>
    </section>
  );
}
