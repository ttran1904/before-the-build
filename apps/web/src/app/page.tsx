import Link from "next/link";
import Image from "next/image";
import {
  FaHouse, FaCamera, FaPalette, FaSackDollar, FaBookOpen, FaCheck,
  FaStar, FaRobot, FaCompass, FaCouch, FaArrowsRotate,
  FaCartShopping, FaCalendarDays, FaShieldHalved, FaCertificate,
  FaRuler,
} from "react-icons/fa6";

/* ─── Room scene illustrations ─── */
const ROOMS: Record<string, { bg: string; label: string; image?: string; accents: React.ReactNode }> = {
  kitchen: {
    bg: "none",
    label: "Modern Farmhouse Kitchen",
    image: "/images/kitchen-remodel.png",
    accents: <></>,
  },
  coastal: {
    bg: "none",
    label: "Coastal Living Room",
    image: "/images/coastal-living room.png",
    accents: <></>,
  },
  japandi: {
    bg: "none",
    label: "Japandi Bedroom",
    image: "/images/japandi-bedroom.png",
    accents: <></>,
  },
  bathroom: {
    bg: "none",
    label: "Mid-Century Bathroom",
    image: "/images/midcentury-bathroom.png",
    accents: <></>,
  },
  industrial: {
    bg: "none",
    label: "Industrial Loft",
    image: "/images/industrial-loft.png",
    accents: <></>,
  },
};

function RoomScene({
  type,
  className = "",
}: {
  type: keyof typeof ROOMS;
  className?: string;
}) {
  const room = ROOMS[type];
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ background: room.image ? "none" : room.bg }}
    >
      {room.image && (
        <Image src={room.image} alt={room.label} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
      )}
      {room.accents}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/30 to-transparent p-4 pt-8">
        <span className="rounded-lg bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {room.label}
        </span>
      </div>
    </div>
  );
}

/* ─── Gantt bar placeholder ─── */
function GanttRow({
  task,
  color,
  widthPercent,
  offsetPercent,
}: {
  task: string;
  color: string;
  widthPercent: number;
  offsetPercent: number;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-36 shrink-0 truncate text-sm text-[#4a4a5a]">{task}</span>
      <div className="relative h-7 flex-1 rounded bg-[#f3f2ef]">
        <div
          className="absolute top-0 h-full rounded"
          style={{
            background: color,
            width: `${widthPercent}%`,
            left: `${offsetPercent}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ━━━ Top Nav ━━━ */}
      <header className="sticky top-0 z-50 border-b border-[#e8e6e1] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <FaHouse className="text-xl text-[#2d5a3d]" />
            <span className="text-xl font-bold tracking-tight text-[#1a1a2e]">
              Before The Build
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/explore" className="text-sm font-medium text-[#4a4a5a] transition hover:text-[#1a1a2e]">
              Explore
            </Link>
            <Link href="/design" className="text-sm font-medium text-[#4a4a5a] transition hover:text-[#1a1a2e]">
              Design
            </Link>
            <Link href="/dashboard/projects" className="text-sm font-medium text-[#4a4a5a] transition hover:text-[#1a1a2e]">
              Projects
            </Link>
            <Link href="/chat" className="text-sm font-medium text-[#4a4a5a] transition hover:text-[#1a1a2e]">
              AI Chat
            </Link>
            <Link href="/build-book" className="text-sm font-medium text-[#4a4a5a] transition hover:text-[#1a1a2e]">
              Build Book
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-[#d5d3cd] px-5 py-2 text-sm font-medium text-[#1a1a2e] transition hover:bg-[#f8f7f4]">
              Sign In
            </button>
            <Link
              href="/dashboard"
              className="rounded-full bg-[#2d5a3d] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#234a31]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ━━━ Hero Section ━━━ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8f7f4] to-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-20 lg:flex-row lg:py-28">
          <div className="max-w-xl text-center lg:text-left">
            <span className="mb-4 inline-block rounded-full bg-[#2d5a3d]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#2d5a3d] uppercase">
              All-in-one renovation platform
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#1a1a2e] md:text-5xl lg:text-6xl">
              Plan, Design &amp; <br />
              <span className="text-[#2d5a3d]">Build Smarter</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[#5a5a6a]">
              From inspiration to contractor-ready build books — scan your rooms, 
              explore styles, manage budgets &amp; timelines, and bring your dream 
              renovation to life with AI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/dashboard"
                className="rounded-full bg-[#2d5a3d] px-8 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-[#2d5a3d]/20 transition hover:bg-[#234a31]"
              >
                Start Your Project
              </Link>
              <Link
                href="/explore"
                className="rounded-full border border-[#d5d3cd] px-8 py-3.5 text-center text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#f8f7f4]"
              >
                Browse Inspiration
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-[#7a7a8a] sm:justify-center lg:justify-start">
              <span className="flex items-center gap-1.5">✓ Free to start</span>
              <span className="flex items-center gap-1.5">✓ AI-powered</span>
              <span className="flex items-center gap-1.5">✓ No credit card</span>
            </div>
          </div>
          {/* Hero mock — design visualization */}
          <div className="relative w-full max-w-xl lg:max-w-lg">
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-3 shadow-2xl shadow-black/5">
              <div
                className="relative aspect-[4/3] overflow-hidden rounded-xl"
              >
                <Image src="/images/kitchen-remodel.png" alt="Kitchen Remodel Preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
                {/* Overlay content */}
                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#2d5a3d]/30" />
                    <div className="h-3 w-3 rounded-full bg-[#d4956a]/30" />
                    <div className="h-3 w-3 rounded-full bg-[#e8d5b7]/50" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-white/80 p-2 shadow-sm backdrop-blur-sm">
                        <FaCompass className="text-base text-[#2d5a3d]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#1a1a2e]">Kitchen Remodel</div>
                        <div className="text-xs text-[#6a6a7a]">3D Design Preview</div>
                      </div>
                    </div>
                    {/* Mock furniture items */}
                    <div className="flex gap-2">
                      {["Island Counter", "Pendant Lights", "Cabinet Set"].map((item) => (
                        <div key={item} className="rounded-lg bg-white/80 px-3 py-1.5 text-xs text-[#4a4a5a] shadow-sm backdrop-blur-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating budget card */}
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-[#e8e6e1] bg-white px-4 py-3 shadow-lg">
              <div className="text-xs font-medium text-[#7a7a8a]">Budget</div>
              <div className="text-lg font-bold text-[#2d5a3d]">$47,200</div>
              <div className="mt-1 h-1.5 w-24 rounded-full bg-[#e8e6e1]">
                <div className="h-full w-[65%] rounded-full bg-[#2d5a3d]" />
              </div>
            </div>
            {/* Floating AI card */}
            <div className="absolute -right-3 -top-3 rounded-xl border border-[#e8e6e1] bg-white px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <FaRobot className="text-lg text-[#2d5a3d]" />
                <div>
                  <div className="text-xs font-medium text-[#1a1a2e]">AI Assistant</div>
                  <div className="text-xs text-[#7a7a8a]">&quot;Try marble countertops!&quot;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Trusted By / Stats Bar ━━━ */}
      <section className="border-y border-[#e8e6e1] bg-[#fafaf8]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-16 gap-y-4 px-6 py-8 text-center">
          {[
            { value: "12,400+", label: "Projects Created" },
            { value: "98%", label: "Satisfaction Rate" },
            { value: "$2.3M+", label: "Budget Managed" },
            { value: "850+", label: "Contractors Connected" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-[#1a1a2e]">{stat.value}</div>
              <div className="text-xs text-[#7a7a8a]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ Trending Design Inspiration (Houzz-style) ━━━ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#1a1a2e]">Trending Designs</h2>
              <p className="mt-2 text-[#6a6a7a]">
                Explore curated home styles and save your favorites to mood boards
              </p>
            </div>
            <Link href="/explore" className="hidden text-sm font-semibold text-[#2d5a3d] hover:underline md:block">
              View All →
            </Link>
          </div>

          {/* Gallery grid — Houzz-style masonry-ish layout */}
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
            <RoomScene type="kitchen" className="aspect-square md:col-span-2 md:row-span-2 md:aspect-auto" />
            <RoomScene type="coastal" className="aspect-square" />
            <RoomScene type="japandi" className="aspect-square" />
            <RoomScene type="bathroom" className="aspect-square" />
            <RoomScene type="industrial" className="aspect-square" />
          </div>

          {/* Category pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              "Kitchen", "Bathroom", "Living Room", "Bedroom", "Outdoor",
              "Basement", "Office", "Laundry", "Dining Room",
            ].map((cat) => (
              <button
                key={cat}
                className="rounded-full border border-[#e8e6e1] bg-white px-4 py-2 text-xs font-medium text-[#4a4a5a] transition hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5 hover:text-[#2d5a3d]"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ How It Works ━━━ */}
      <section className="bg-[#f8f7f4] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-[#1a1a2e]">
            Your Renovation, Simplified
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[#6a6a7a]">
            Everything you need from first idea to handing your contractor a complete build book
          </p>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                icon: <FaCamera className="text-xl text-[#8a7050]" />,
                title: "Scan & Capture",
                desc: "Use LiDAR to scan rooms or upload photos. AI extracts dimensions, layout, and existing features.",
                color: "#e8d5b7",
              },
              {
                step: "02",
                icon: <FaPalette className="text-xl text-[#3d7a4d]" />,
                title: "Explore & Design",
                desc: "Browse trending styles, save to mood boards, and design rooms in interactive 2D & 3D views.",
                color: "#bde0c0",
              },
              {
                step: "03",
                icon: <FaSackDollar className="text-xl text-[#6a509a]" />,
                title: "Budget & Estimate",
                desc: "Track costs with material vs labor splits, real-time price trends, and must-have vs nice-to-have tagging.",
                color: "#d4c5e8",
              },
              {
                step: "04",
                icon: <FaBookOpen className="text-xl text-[#a0704a]" />,
                title: "Build Book",
                desc: "Generate a contractor-ready document with layouts, budgets, timelines, and product links.",
                color: "#f0d0b0",
              },
            ].map((item) => (
              <div key={item.step} className="group relative">
                <div
                  className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: item.color }}
                >
                  {item.icon}
                </div>
                <div className="text-xs font-bold tracking-wider text-[#2d5a3d] uppercase">
                  Step {item.step}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-[#1a1a2e]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6a6a7a]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Budget & Cost Estimation (Realm / HomeZada style) ━━━ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#2d5a3d] uppercase">
                Budget Management
              </span>
              <h2 className="mt-3 text-3xl font-bold text-[#1a1a2e]">
                Know Every Dollar <br />Before You Spend It
              </h2>
              <p className="mt-4 text-[#6a6a7a] leading-relaxed">
                Like Realm&apos;s precision meets HomeZada&apos;s tracking. Get real-time cost 
                estimates, track actual vs budgeted spending, and never be surprised 
                by hidden costs.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Must-have vs Nice-to-have cost tagging",
                  "Material vs labor cost breakdown",
                  "Real-time material price trends",
                  "AI suggests companion fixes to save money",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#4a4a5a]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2d5a3d]/10">
                      <FaCheck className="text-[10px] text-[#2d5a3d]" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock budget dashboard card */}
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-6 shadow-xl shadow-black/5">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1a1a2e]">Kitchen Remodel Budget</h3>
                <span className="rounded-full bg-[#2d5a3d]/10 px-3 py-1 text-xs font-medium text-[#2d5a3d]">
                  On Track
                </span>
              </div>
              {/* Summary numbers */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-[#f8f7f4] p-4">
                  <div className="text-xs text-[#7a7a8a]">Total Budget</div>
                  <div className="text-xl font-bold text-[#1a1a2e]">$47,200</div>
                </div>
                <div className="rounded-xl bg-[#f8f7f4] p-4">
                  <div className="text-xs text-[#7a7a8a]">Spent</div>
                  <div className="text-xl font-bold text-[#d4956a]">$28,340</div>
                </div>
                <div className="rounded-xl bg-[#eef7ee] p-4">
                  <div className="text-xs text-[#7a7a8a]">Remaining</div>
                  <div className="text-xl font-bold text-[#2d5a3d]">$18,860</div>
                </div>
              </div>
              {/* Mock bar chart */}
              <div className="mt-6 space-y-3">
                {[
                  { label: "Cabinets", budget: 12000, spent: 8300, color: "#2d5a3d" },
                  { label: "Countertops", budget: 8000, spent: 7500, color: "#d4956a" },
                  { label: "Flooring", budget: 6500, spent: 4200, color: "#87CEEB" },
                  { label: "Appliances", budget: 9000, spent: 5300, color: "#d4c5e8" },
                  { label: "Labor", budget: 11700, spent: 3040, color: "#e8d5b7" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-[#4a4a5a]">{row.label}</span>
                      <span className="text-[#7a7a8a]">
                        ${row.spent.toLocaleString()} / ${row.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#f3f2ef]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(row.spent / row.budget) * 100}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Pie chart placeholder */}
              <div className="mt-6 flex items-center gap-6 rounded-xl border border-[#e8e6e1] p-4">
                <div className="relative h-20 w-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f2ef" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2d5a3d" strokeWidth="3" strokeDasharray="40 60" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#d4956a" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="-40" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#87CEEB" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="-65" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#1a1a2e]">60%</div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#2d5a3d]" /> Materials 40%</span>
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#d4956a]" /> Labor 25%</span>
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#87CEEB]" /> Fixtures 20%</span>
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#f3f2ef]" /> Other 15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Project Management (Asana-style) ━━━ */}
      <section className="bg-[#f8f7f4] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Mock Gantt + Kanban */}
            <div className="space-y-6">
              {/* Gantt Chart mock */}
              <div className="rounded-2xl border border-[#e8e6e1] bg-white p-6 shadow-xl shadow-black/5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-[#1a1a2e]">Timeline</h3>
                  <div className="flex gap-1">
                    {["Gantt", "Board", "List"].map((v) => (
                      <button
                        key={v}
                        className={`rounded-md px-3 py-1 text-xs font-medium ${v === "Gantt" ? "bg-[#2d5a3d] text-white" : "text-[#7a7a8a] hover:bg-[#f3f2ef]"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Month header */}
                <div className="mb-2 flex items-center gap-3">
                  <span className="w-36 shrink-0" />
                  <div className="flex flex-1 justify-between text-xs text-[#9a9aaa]">
                    <span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                  </div>
                </div>
                <GanttRow task="Demo & Tear-Out" color="#d4956a" widthPercent={15} offsetPercent={0} />
                <GanttRow task="Rough Plumbing" color="#2d5a3d" widthPercent={20} offsetPercent={12} />
                <GanttRow task="Electrical Work" color="#87CEEB" widthPercent={18} offsetPercent={15} />
                <GanttRow task="Cabinet Install" color="#d4c5e8" widthPercent={15} offsetPercent={32} />
                <GanttRow task="Countertop Install" color="#e8d5b7" widthPercent={10} offsetPercent={45} />
                <GanttRow task="Painting & Trim" color="#bde0c0" widthPercent={20} offsetPercent={55} />
                <GanttRow task="Final Inspection" color="#f0d0b0" widthPercent={8} offsetPercent={78} />
              </div>

              {/* Kanban mini preview */}
              <div className="rounded-2xl border border-[#e8e6e1] bg-white p-6 shadow-xl shadow-black/5">
                <h3 className="mb-4 font-semibold text-[#1a1a2e]">Task Board</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      status: "To Do",
                      color: "#e8e6e1",
                      tasks: ["Order backsplash tile", "Get permit sign-off"],
                    },
                    {
                      status: "In Progress",
                      color: "#87CEEB",
                      tasks: ["Install cabinets"],
                    },
                    {
                      status: "Review",
                      color: "#d4c5e8",
                      tasks: ["Countertop measurement"],
                    },
                    {
                      status: "Done",
                      color: "#bde0c0",
                      tasks: ["Demo complete", "Plumbing rough-in"],
                    },
                  ].map((col) => (
                    <div key={col.status}>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#4a4a5a]">
                        <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                        {col.status}
                      </div>
                      <div className="space-y-2">
                        {col.tasks.map((t) => (
                          <div key={t} className="rounded-lg border border-[#e8e6e1] bg-[#fafaf8] px-3 py-2 text-xs text-[#4a4a5a]">
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text content */}
            <div>
              <span className="text-xs font-bold tracking-wider text-[#2d5a3d] uppercase">
                Project Management
              </span>
              <h2 className="mt-3 text-3xl font-bold text-[#1a1a2e]">
                Manage Like a Pro, <br />No Experience Needed
              </h2>
              <p className="mt-4 leading-relaxed text-[#6a6a7a]">
                Gantt timelines, Kanban boards, and smart task tracking — all 
                tailored for home renovation. AI auto-generates milestones 
                and flags delays before they become problems.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Drag-and-drop Gantt charts with dependencies",
                  "Kanban board: To Do → In Progress → Done",
                  "Invite contractors, vendors & family members",
                  "AI flags risks and suggests schedule fixes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#4a4a5a]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2d5a3d]/10">
                      <FaCheck className="text-[10px] text-[#2d5a3d]" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/projects"
                className="mt-8 inline-block rounded-full bg-[#2d5a3d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#234a31]"
              >
                Start a Project →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ AI Design Assistant (SketchUp-style) ━━━ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#2d5a3d] uppercase">
                AI-Powered Design
              </span>
              <h2 className="mt-3 text-3xl font-bold text-[#1a1a2e]">
                Your Personal <br />Design Assistant
              </h2>
              <p className="mt-4 leading-relaxed text-[#6a6a7a]">
                Scan your room with LiDAR, and our AI builds an interactive 2D/3D 
                model. Drag and drop furniture, get smart recommendations, and 
                visualize your renovation before spending a dime.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: <FaCamera className="text-lg text-[#2d5a3d]" />, label: "LiDAR Room Scan" },
                  { icon: <FaCouch className="text-lg text-[#2d5a3d]" />, label: "Drag & Drop Furniture" },
                  { icon: <FaArrowsRotate className="text-lg text-[#2d5a3d]" />, label: "2D ↔ 3D Toggle" },
                  { icon: <FaCartShopping className="text-lg text-[#2d5a3d]" />, label: "Shop Matching Items" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3 rounded-xl border border-[#e8e6e1] bg-white px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2d5a3d]/10">{f.icon}</span>
                    <span className="text-sm font-medium text-[#4a4a5a]">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Mock 3D design UI */}
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-4 shadow-xl shadow-black/5">
              <div className="mb-3 flex items-center gap-2 border-b border-[#e8e6e1] pb-3">
                <button className="rounded-md bg-[#2d5a3d] px-3 py-1 text-xs font-medium text-white">3D View</button>
                <button className="rounded-md px-3 py-1 text-xs font-medium text-[#7a7a8a] hover:bg-[#f3f2ef]">2D Plan</button>
                <div className="ml-auto flex gap-1">
                  <span className="rounded bg-[#f3f2ef] px-2 py-1 text-xs text-[#7a7a8a]">↩ Undo</span>
                  <span className="flex items-center gap-1 rounded bg-[#f3f2ef] px-2 py-1 text-xs text-[#7a7a8a]"><FaRuler className="text-[10px]" /> Measure</span>
                </div>
              </div>
              <div
                className="relative aspect-[16/10] overflow-hidden rounded-lg"
              >
                <Image src="/images/3d-plan.png" alt="3D Room Design View" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                {/* Overlay content */}
                <div className="relative flex h-full flex-col justify-between p-5">
                  {/* Room elements */}
                  <div className="flex justify-between">
                    <div className="rounded-lg bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm">
                      <div className="text-xs font-medium text-[#4a4a5a]">12&apos; × 14&apos;</div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm">
                      <svg width="12" height="12" viewBox="0 0 12 12" className="text-[#6a6a7a]">
                        <rect x="1" y="1" width="4" height="4" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                        <rect x="7" y="1" width="4" height="4" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                        <rect x="1" y="7" width="4" height="4" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                        <rect x="7" y="7" width="4" height="4" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      <div className="text-xs font-medium text-[#4a4a5a]">Window</div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex gap-2">
                      <div className="h-12 w-16 rounded-md border-2 border-dashed border-[#b8a88a]/60 bg-white/20" />
                      <div className="h-8 w-12 rounded-md border-2 border-dashed border-[#b8a88a]/60 bg-white/20" />
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm">
                      <div className="text-xs font-semibold text-[#2d5a3d]">+ Add Furniture</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Furniture sidebar mock */}
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {[
                  { name: "Sofa", price: "$899", bg: "#e8d5b7", icon: <FaCouch className="text-sm text-[#8a7050]" /> },
                  { name: "Coffee Table", price: "$349", bg: "#d4c5e8", icon: <svg width="18" height="12" viewBox="0 0 18 12"><rect x="1" y="2" width="16" height="4" rx="1" fill="#6a509a" opacity=".6"/><rect x="2" y="7" width="2" height="4" rx=".5" fill="#6a509a" opacity=".4"/><rect x="14" y="7" width="2" height="4" rx=".5" fill="#6a509a" opacity=".4"/></svg> },
                  { name: "Floor Lamp", price: "$129", bg: "#bde0c0", icon: <svg width="14" height="20" viewBox="0 0 14 20"><line x1="7" y1="4" x2="7" y2="18" stroke="#3d7a4d" strokeWidth="1.5"/><circle cx="7" cy="3" r="3" fill="#3d7a4d" opacity=".5"/><rect x="4" y="18" width="6" height="2" rx="1" fill="#3d7a4d" opacity=".4"/></svg> },
                  { name: "Rug 8×10", price: "$599", bg: "#f0d0b0", icon: <svg width="20" height="14" viewBox="0 0 20 14"><rect x="1" y="1" width="18" height="12" rx="1" fill="#a0704a" opacity=".4"/><rect x="3" y="3" width="14" height="8" rx=".5" fill="#a0704a" opacity=".3"/></svg> },
                  { name: "Bookshelf", price: "$449", bg: "#dce8f0", icon: <svg width="16" height="18" viewBox="0 0 16 18"><rect x="1" y="1" width="14" height="16" rx="1" fill="none" stroke="#4a6fa5" strokeWidth="1.2" opacity=".6"/><line x1="1" y1="6" x2="15" y2="6" stroke="#4a6fa5" strokeWidth="1" opacity=".4"/><line x1="1" y1="11" x2="15" y2="11" stroke="#4a6fa5" strokeWidth="1" opacity=".4"/></svg> },
                ].map((item) => (
                  <div key={item.name} className="shrink-0 rounded-lg border border-[#e8e6e1] p-2">
                    <div className="relative mb-2 flex h-12 w-16 items-center justify-center rounded" style={{ background: item.bg }}>
                      {item.icon}
                    </div>
                    <div className="text-xs font-medium text-[#4a4a5a]">{item.name}</div>
                    <div className="text-xs text-[#2d5a3d]">{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Build Book Preview ━━━ */}
      <section className="bg-[#1a1a2e] py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <span className="text-xs font-bold tracking-wider text-[#bde0c0] uppercase">
            The Final Deliverable
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white">
            Your Build Book — Everything in One Place
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#9a9ab0]">
            A shareable, contractor-ready document with floor plans, 3D renders, 
            budgets, timelines, product links, and movement flow simulations.
          </p>
          {/* Mock build book spread */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { title: "Floor Plans", image: "/images/2d-plan.png" },
              { title: "3D Renders", image: "/images/3d-plan.png" },
              { title: "Budget Report", icon: <FaSackDollar className="text-3xl text-white" />, bg: "linear-gradient(135deg, #4a6fa5 0%, #6a8fc5 100%)" },
              { title: "Timeline", icon: <FaCalendarDays className="text-3xl text-white" />, bg: "linear-gradient(135deg, #8a6aaa 0%, #a080c0 100%)" },
            ].map((item) => (
              <div
                key={item.title}
                className="relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-xl p-4"
                style={{ background: item.bg || "none" }}
              >
                {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" sizes="25vw" />}
                {item.image && <div className="absolute inset-0 bg-black/30" />}
                {item.icon && <span className="mb-3">{item.icon}</span>}
                <span className="relative text-sm font-semibold text-white">{item.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/build-book"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#1a1a2e] transition hover:bg-zinc-100"
            >
              See Sample Build Book
            </Link>
            <span className="text-sm text-[#7a7a9a]">Export as PDF or share a live link</span>
          </div>
        </div>
      </section>

      {/* ━━━ Find Professionals (Houzz-style) ━━━ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#1a1a2e]">Find Trusted Professionals</h2>
            <p className="mt-2 text-[#6a6a7a]">
              Connect with vetted contractors, designers, and vendors in your area
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Sarah Chen", role: "Interior Designer", rating: "4.9", reviews: 127, color: "#e8d5b7" },
              { name: "Mike Torres", role: "General Contractor", rating: "4.8", reviews: 89, color: "#bde0c0" },
              { name: "Lisa Park", role: "Kitchen Specialist", rating: "5.0", reviews: 64, color: "#d4c5e8" },
              { name: "James Wright", role: "Electrician", rating: "4.7", reviews: 215, color: "#dce8f0" },
            ].map((pro) => (
              <div key={pro.name} className="rounded-2xl border border-[#e8e6e1] bg-white p-5 transition hover:shadow-lg">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: pro.color.replace("e8", "a8").replace("bd", "6d").replace("d4", "8a") }}
                  >
                    {pro.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a1a2e]">{pro.name}</div>
                    <div className="text-xs text-[#7a7a8a]">{pro.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaStar className="text-sm text-yellow-500" />
                  <span className="font-medium text-[#1a1a2e]">{pro.rating}</span>
                  <span className="text-[#7a7a8a]">({pro.reviews} reviews)</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-[#f8f7f4] px-3 py-1 text-xs text-[#6a6a7a]"><FaShieldHalved className="text-[10px] text-[#2d5a3d]" /> Licensed</span>
                  <span className="flex items-center gap-1 rounded-full bg-[#f8f7f4] px-3 py-1 text-xs text-[#6a6a7a]"><FaCertificate className="text-[10px] text-[#2d5a3d]" /> Insured</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/explore" className="text-sm font-semibold text-[#2d5a3d] hover:underline">
              Browse All Professionals →
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ CTA Section ━━━ */}
      <section className="bg-gradient-to-r from-[#2d5a3d] to-[#3d7a5d] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to Start Your Renovation?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join thousands of homeowners who planned smarter and built better.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#2d5a3d] transition hover:bg-zinc-100"
            >
              Get Started Free
            </Link>
            <Link
              href="/explore"
              className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore Styles
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ Footer ━━━ */}
      <footer className="border-t border-[#e8e6e1] bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <FaHouse className="text-lg text-[#2d5a3d]" />
                <span className="font-bold text-[#1a1a2e]">Before The Build</span>
              </div>
              <p className="text-sm text-[#7a7a8a]">
                Plan, design, and build your dream renovation with AI.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">Product</h4>
              <ul className="space-y-2 text-sm text-[#7a7a8a]">
                <li><Link href="/explore" className="hover:text-[#1a1a2e]">Explore</Link></li>
                <li><Link href="/design" className="hover:text-[#1a1a2e]">Design</Link></li>
                <li><Link href="/build-book" className="hover:text-[#1a1a2e]">Build Book</Link></li>
                <li><Link href="/chat" className="hover:text-[#1a1a2e]">AI Chat</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">Resources</h4>
              <ul className="space-y-2 text-sm text-[#7a7a8a]">
                <li><span className="hover:text-[#1a1a2e] cursor-pointer">Pricing</span></li>
                <li><span className="hover:text-[#1a1a2e] cursor-pointer">Blog</span></li>
                <li><span className="hover:text-[#1a1a2e] cursor-pointer">Help Center</span></li>
                <li><span className="hover:text-[#1a1a2e] cursor-pointer">API</span></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#1a1a2e]">Company</h4>
              <ul className="space-y-2 text-sm text-[#7a7a8a]">
                <li><span className="hover:text-[#1a1a2e] cursor-pointer">About</span></li>
                <li><span className="hover:text-[#1a1a2e] cursor-pointer">Careers</span></li>
                <li><Link href="/privacy-policy" className="hover:text-[#1a1a2e] cursor-pointer">Privacy</Link></li>
                <li><span className="hover:text-[#1a1a2e] cursor-pointer">Terms</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-[#e8e6e1] pt-6 text-center text-xs text-[#9a9aaa]">
            © 2026 Before The Build. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
