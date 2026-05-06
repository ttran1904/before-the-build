"use client";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  FaSpinner,
  FaCircleCheck,
  FaArrowRotateRight,
  FaArrowsLeftRight,
  FaCircleQuestion,
  FaTriangleExclamation,
  FaCircleInfo,
  FaPencil,
  FaHouse,
  FaClock,
  FaWallet,
  FaUser,
  FaLocationDot,
  FaCalendarDay,
  FaShield,
  FaBath as FaBath6,
  FaScrewdriverWrench,
} from "react-icons/fa6";
import {
  FaToilet,
  FaShower,
  FaBath,
  FaCrown,
  FaBolt,
  FaPaintRoller,
  FaLightbulb,
  FaWrench,
  FaTools,
  FaThLarge,
} from "react-icons/fa";
import {
  useGroundworkStore,
  getOpenItems,
  getAssumptions,
  projectTypeLabel,
  type GroundworkBathroomState,
} from "@/lib/groundwork/store";
import {
  getCostBreakdown,
  fmtRange,
  type BreakdownLine,
  type LineReadiness,
} from "@/lib/groundwork/cost-breakdown";
import {
  getScopeOfWork,
  getAssumptionLog,
  getOpenItemCards,
  getResponsibilityMatrix,
  getBudgetSensitivity,
  getReadinessScores,
  getReadinessReport,
  getReportMeta,
  type ScopeStatus,
  type Impact,
} from "@/lib/groundwork/scope-report";
import { GroundworkAutosave } from "@/lib/groundwork/Autosave";
import type { IconType } from "react-icons";

const SCOPE_LABELS: Record<string, string> = {
  keep: "Keep",
  replace: "Replace",
  relocate: "Relocate",
  unsure: "Unsure",
  paint_only: "Paint only",
  new_tile: "New tile",
  wallpaper: "Wallpaper",
  structural: "Structural",
  none: "No changes",
  new_outlets: "New outlets",
  new_fixtures: "New fixtures",
  major: "Major work",
  door: "Door only",
  wall: "One wall",
  full_layout: "Full layout",
  half_bath: "Half bath",
  three_quarter: "3/4 bath",
  full_bath: "Full bath",
  primary: "Primary suite",
  asap: "ASAP",
  soonish: "Soonish",
  no_rush: "No rush",
  above_100k: "Above $100,000",
  "50_to_100k": "$50,000 – $100,000",
  "25_to_50k": "$25,000 – $50,000",
  "10_to_25k": "$10,000 – $25,000",
  under_10k: "Under $10,000",
};

const lbl = (v: string | null) => (v ? SCOPE_LABELS[v] ?? v : "—");

const TONES = {
  keep: "border border-[#d6e3d8] bg-[#eef3ee] text-[#2d5a3d]",
  change: "border border-[#ecd6bc] bg-[#f6e4d4] text-[#8a4a1a]",
  changeBig: "border border-[#e2bf94] bg-[#f4d6b8] text-[#6a3a08]",
  unsure: "border border-[#ecdfa9] bg-[#fbf2d9] text-[#7a5a1a]",
  notSet: "border border-[#e8e6e1] bg-[#f8f7f4] text-[#6a6a7a]",
} as const;

function statusChip(v: string | null) {
  switch (v) {
    case "keep":
      return { label: "Keep", icon: FaCircleCheck, cls: TONES.keep };
    case "none":
      return { label: "No changes", icon: FaCircleCheck, cls: TONES.keep };
    case "replace":
      return { label: "Replace", icon: FaArrowRotateRight, cls: TONES.change };
    case "new_tile":
      return { label: "Replace", icon: FaThLarge, cls: TONES.change };
    case "wallpaper":
      return { label: "Replace", icon: FaPaintRoller, cls: TONES.change };
    case "paint_only":
      return { label: "Repaint", icon: FaPaintRoller, cls: TONES.change };
    case "new_outlets":
      return { label: "Add", icon: FaBolt, cls: TONES.change };
    case "new_fixtures":
      return { label: "Replace", icon: FaBolt, cls: TONES.change };
    case "door":
      return { label: "Move", icon: FaTools, cls: TONES.change };
    case "relocate":
      return { label: "Relocate", icon: FaArrowsLeftRight, cls: TONES.changeBig };
    case "major":
      return { label: "Major", icon: FaBolt, cls: TONES.changeBig };
    case "wall":
      return { label: "Move wall", icon: FaTools, cls: TONES.changeBig };
    case "full_layout":
      return { label: "New layout", icon: FaTools, cls: TONES.changeBig };
    case "structural":
      return { label: "Structural", icon: FaTools, cls: TONES.changeBig };
    case "unsure":
    case "not_sure":
      return { label: "Unsure", icon: FaCircleQuestion, cls: TONES.unsure };
    case null:
    case undefined:
    case "":
      return { label: "Not yet set", icon: FaCircleQuestion, cls: TONES.notSet };
    default:
      return { label: lbl(v), icon: FaCircleQuestion, cls: TONES.unsure };
  }
}

interface ScopeCardItem {
  key: string;
  label: string;
  icon: IconType;
  value: string | null;
}

type TabId = "overview" | "scope" | "budget" | "decisions" | "roles" | "readiness";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "scope", label: "Scope of Work" },
  { id: "budget", label: "Budget" },
  { id: "decisions", label: "Decisions" },
  { id: "roles", label: "Responsibilities" },
  { id: "readiness", label: "Readiness" },
];

export default function GroundworkSummaryPage() {
  const state = useGroundworkStore();
  const hydrated = useSyncExternalStore(
    (cb) => useGroundworkStore.persist.onFinishHydration(cb),
    () => useGroundworkStore.persist.hasHydrated(),
    () => false,
  );
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [printAll, setPrintAll] = useState(false);

  const exportPDF = async () => {
    if (!printRef.current) return;
    setExporting(true);
    setPrintAll(true);
    // give React a frame to render every section
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 50));
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#faf8f3",
        logging: false,
        imageTimeout: 15000,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      const slug = (projectTypeLabel(state.projectType) ?? "bathroom-groundwork")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      pdf.save(slug + "-groundwork.pdf");
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("PDF export failed. Try Print → Save as PDF instead.");
    }
    setPrintAll(false);
    setExporting(false);
  };

  if (!hydrated) return null;

  const openItems = getOpenItems(state);
  const assumptions = getAssumptions(state);
  const breakdown = getCostBreakdown(state);
  const meta = getReportMeta(state);
  const scopeOfWork = getScopeOfWork(state);
  const assumptionLog = getAssumptionLog(state);
  const openItemCards = getOpenItemCards(state);
  const responsibility = getResponsibilityMatrix(state);
  const sensitivity = getBudgetSensitivity(state);
  const readiness = getReadinessScores(state);
  const readinessReport = getReadinessReport(state);

  const scopeItems: ScopeCardItem[] = [
    { key: "vanity", label: "Vanity", icon: FaWrench, value: state.vanity },
    { key: "toilet", label: "Toilet", icon: FaToilet, value: state.toilet },
    { key: "showerTub", label: "Shower / tub", icon: FaShower, value: state.showerTub },
    { key: "flooring", label: "Flooring", icon: FaThLarge, value: state.flooring },
    { key: "walls", label: "Walls", icon: FaPaintRoller, value: state.walls },
    { key: "lighting", label: "Lighting", icon: FaLightbulb, value: state.lighting },
    { key: "electrical", label: "Electrical", icon: FaBolt, value: state.electrical },
    { key: "layout", label: "Layout", icon: FaTools, value: state.layout },
  ];

  const bathroomIcon =
    state.bathroomKind === "primary"
      ? FaCrown
      : state.bathroomKind === "half_bath"
      ? FaToilet
      : state.bathroomKind === "three_quarter"
      ? FaShower
      : FaBath;

  const showTab = (id: TabId) => printAll || activeTab === id;

  return (
    <>
      <GroundworkAutosave />
      <div className="min-h-screen bg-[#faf8f3]">
        <header className="border-b border-[#ece9e3] bg-white">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-6">
            <div className="flex-1 text-sm font-semibold tracking-wide text-[#1a1a2e]">
              Groundwork Scope · Bathroom
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-[#f0ede8] px-4 py-1.5 text-xs font-semibold text-[#1a1a2e] transition hover:bg-[#e8e6e1]"
              >
                <FaHouse className="text-[10px]" />
                Back to Dashboard
              </Link>
              <Link
                href="/groundwork/bathroom"
                className="inline-flex items-center gap-2 rounded-full bg-[#f0ede8] px-4 py-1.5 text-xs font-semibold text-[#1a1a2e] transition hover:bg-[#e8e6e1]"
              >
                <FaPencil className="text-[10px]" />
                Edit answers
              </Link>
              <button
                onClick={exportPDF}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-full bg-[#c08a5a] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#a87445] disabled:opacity-60"
              >
                {exporting ? (
                  <>
                    <FaSpinner className="animate-spin" /> Exporting…
                  </>
                ) : (
                  "Download PDF"
                )}
              </button>
            </div>
          </div>
        </header>

        <main ref={printRef} className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
          {/* ── Formal Ground Report header (hero card) ──────────── */}
          <ReportHeroCard
            meta={meta}
            state={state}
            breakdown={breakdown}
            bathroomIcon={bathroomIcon}
          />

          {/* ── Tab strip (hidden in PDF) ───────────────────────── */}
          {!printAll && (
            <nav className="flex flex-wrap gap-1.5 rounded-full border border-[#ece9e3] bg-white p-1 shadow-sm">
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-[#1a1a2e] text-white shadow-sm"
                        : "text-[#6a6a7a] hover:bg-[#f0ede8] hover:text-[#1a1a2e]"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* ─────────── OVERVIEW TAB ─────────── */}
          {showTab("overview") && (
            <section className="space-y-8">
              {printAll && <TabHeading n="00" title="Overview" hint="The gist" />}

              {/* Scope cards — preserved */}
              <Section title="What's changing vs staying">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {scopeItems.map((it) => (
                    <ScopeCard key={it.key} item={it} />
                  ))}
                </div>
              </Section>

              {/* Budget snapshot — also surfaced on overview for at-a-glance value */}
              <Section title="Estimated cost breakdown">
                <CostTable breakdown={breakdown} readiness={readiness} />
              </Section>

              {/* Quick callouts — preserved */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Callout
                  title="Ask each contractor to confirm these"
                  icon={FaTriangleExclamation}
                  tone="warn"
                  items={openItems}
                  emptyText="Nothing flagged — every scope question was answered."
                />
                <Callout
                  title="What this estimate already assumes"
                  icon={FaCircleInfo}
                  tone="info"
                  items={assumptions}
                />
              </div>

              {state.notes && (
                <Section title="Homeowner notes">
                  <p className="whitespace-pre-wrap text-sm text-[#3a3a4a]">{state.notes}</p>
                </Section>
              )}

              {state.photos.length > 0 && (
                <Section title="Photos of current bathroom">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {state.photos.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt={`bathroom-${i}`}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </Section>
              )}

              {state.floorPlan.length > 0 && (
                <Section title="Floor plan">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {state.floorPlan.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt={`floor-plan-${i}`}
                        className="h-56 w-full rounded-lg bg-white object-contain p-2"
                      />
                    ))}
                  </div>
                </Section>
              )}
            </section>
          )}

          {/* ─────────── SCOPE OF WORK TAB ─────────── */}
          {showTab("scope") && (
            <section className="space-y-6">
              <TabHeading
                n="01"
                title="Scope of Work"
                hint="Items explicitly included in this renovation"
              />
              <ScopeOfWorkTable rows={scopeOfWork} />
            </section>
          )}

          {/* ─────────── BUDGET TAB ─────────── */}
          {showTab("budget") && (
            <section className="space-y-8">
              <TabHeading
                n="02"
                title="Budget Sensitivity Range"
                hint="Based on defined scope + material assumptions"
              />
              <BudgetTiers data={sensitivity} />

              <Section title="Estimated cost breakdown">
                <CostTable breakdown={breakdown} readiness={readiness} showReadiness />
              </Section>
            </section>
          )}

          {/* ─────────── DECISIONS TAB ─────────── */}
          {showTab("decisions") && (
            <section className="space-y-10">
              <div>
                <TabHeading
                  n="03"
                  title="Assumption Log"
                  hint="What builders will price that you haven't confirmed"
                />
                <AssumptionLogList rows={assumptionLog} />
              </div>

              <div>
                <TabHeading
                  n="04"
                  title="Open Items"
                  hint="Decisions needed before bids are comparable"
                />
                <OpenItemsGrid cards={openItemCards} />
              </div>
            </section>
          )}

          {/* ─────────── ROLES TAB ─────────── */}
          {showTab("roles") && (
            <section className="space-y-6">
              <TabHeading
                n="05"
                title="Responsibility Matrix"
                hint="Who supplies and who installs each item"
              />
              <ResponsibilityTable rows={responsibility} />
              <div className="flex items-start gap-3 border-l-2 border-[#c08a5a] bg-white px-5 py-4 text-sm leading-relaxed text-[#3a3a4a]">
                <span>
                  Items marked <strong>Owner-supplied</strong> must be on-site and confirmed before
                  the corresponding phase begins. Late or incorrect deliveries are the most common
                  source of construction delays and change orders.
                </span>
              </div>
            </section>
          )}

          {/* ─────────── READINESS TAB ─────────── */}
          {showTab("readiness") && (
            <section className="space-y-6">
              <TabHeading
                n="06"
                title="Readiness Summary"
                hint="How close this scope is to bid-ready, by category"
              />
              <ReadinessGrid r={readiness} />
              <ReadinessBreakdown report={readinessReport} />
              <div className="rounded-2xl border border-[#ece9e3] bg-white px-6 py-5 shadow-sm">
                <p
                  className="text-sm leading-relaxed text-[#3a3a4a]"
                  dangerouslySetInnerHTML={{
                    __html: readiness.narrative.replace(
                      /\*\*(.+?)\*\*/g,
                      '<strong class="text-[#1a1a2e]">$1</strong>',
                    ),
                  }}
                />
              </div>
              <div className="rounded-2xl border border-[#ece9e3] bg-white px-6 py-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c08a5a]">
                      Next step
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#3a3a4a]">
                      Ready to go further?{" "}
                      <strong className="text-[#1a1a2e]">A Build Book</strong> resolves every open
                      item — finish selections, fixture specs, room renderings, and a complete
                      builder-ready package. This is the full Before the Build experience.
                    </p>
                  </div>
                  <Link
                    href="/build-book/bathroom/design"
                    className="inline-flex items-center justify-center rounded-full bg-[#1a1a2e] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#2a2a4e]"
                  >
                    Explore Build Book →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Footer (always visible) */}
          <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#ece9e3] pt-6 text-[11px] uppercase tracking-[0.18em] text-[#9a9aaa]">
            <span>Before the Build · Groundwork</span>
            <span className="normal-case tracking-normal text-[#9a9aaa]">
              {meta.reportId} · Confidential
            </span>
          </footer>
          <p className="text-[11px] leading-relaxed text-[#b0a99c]">
            This Ground Report is a scope definition document only. It is not a design specification,
            contractor bid, or construction contract. Budget ranges are estimates based on declared
            scope and regional averages; actual costs will vary. Before the Build does not guarantee
            bid outcomes. All assumption flags should be discussed directly with your contractor
            prior to signing.
          </p>
        </main>
      </div>
    </>
  );
}

/* ────────────────── Layout primitives ───────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-serif text-xl text-[#1a1a2e]">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function TabHeading({ n, title, hint }: { n: string; title: string; hint: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[#ece9e3] pb-3">
      <h2 className="font-serif text-2xl text-[#1a1a2e]">
        <span className="mr-3 text-[#c08a5a]">{n}</span>
        {title}
      </h2>
      <span className="hidden text-right text-xs text-[#9a9aaa] sm:inline">{hint}</span>
    </div>
  );
}

function Fact({ icon: Icon, k, v }: { icon: IconType; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#f8f7f4] px-3 py-3">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-[#1a1a2e]">
        <Icon className="text-base" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6a6a7a]">{k}</p>
        <p className="truncate text-sm font-medium text-[#1a1a2e]">{v}</p>
      </div>
    </div>
  );
}

function ScopeCard({ item }: { item: ScopeCardItem }) {
  const Icon = item.icon;
  const chip = statusChip(item.value);
  const ChipIcon = chip.icon;
  return (
    <div className="rounded-2xl border border-[#ece9e3] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f0ede8] text-[#1a1a2e]">
          <Icon className="text-base" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1a1a2e]">{item.label}</p>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip.cls}`}
          >
            <ChipIcon className="text-[9px]" />
            {chip.label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────── New Ground Report blocks ─────────────────── */

function ReportHeroCard({
  meta,
  state,
  breakdown,
  bathroomIcon,
}: {
  meta: ReturnType<typeof getReportMeta>;
  state: GroundworkBathroomState;
  breakdown: ReturnType<typeof getCostBreakdown>;
  bathroomIcon: IconType;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#ece9e3] bg-white shadow-sm">
      <div className="px-8 pt-7 pb-7">
        {/* Title row + cost block */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a9aaa]">
              Contractor-ready Scope Report
            </p>
            <h1 className="mt-1.5 font-serif text-3xl leading-tight text-[#1a1a2e] sm:text-4xl">
              {meta.title}
            </h1>
          </div>
          <div className="rounded-2xl border border-[#cfe0d2] bg-[#eef3ee] px-5 py-3.5 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2d5a3d]">
              Realistic cost range
            </p>
            <p className="mt-0.5 font-serif text-2xl text-[#1a1a2e] sm:text-3xl">
              {fmtRange(breakdown.totalLow, breakdown.totalHigh)}
            </p>
            <p className="mt-0.5 text-[10px] text-[#6a6a7a]">
              Materials + labor + 10% contingency
            </p>
          </div>
        </div>

        {/* Unified 4-up meta + facts grid (2 rows) */}
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#f1ede5] pt-5 sm:grid-cols-4">
          <MetaCell icon={FaUser} k="Homeowner" v={meta.homeowner} />
          <MetaCell icon={FaLocationDot} k="Property" v={meta.property} />
          <MetaCell icon={FaCalendarDay} k="Report" v={meta.reportPeriod} />
          <ReadinessCell pct={meta.bidReadiness} />

          <MetaCell icon={FaBath6} k="Bathroom" v={lbl(state.bathroomKind)} />
          <MetaCell icon={FaScrewdriverWrench} k="Project" v={projectTypeLabel(state.projectType)} />
          <MetaCell icon={FaClock} k="Urgency" v={lbl(state.urgency)} />
          <MetaCell icon={FaWallet} k="Homeowner budget" v={lbl(state.budgetTier)} />
        </div>

        {state.goals.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6a6a7a]">
              Goals:
            </span>
            {state.goals.map((g) => (
              <span
                key={g}
                className="rounded-full bg-[#f8f7f4] px-3 py-1 text-xs font-medium text-[#1a1a2e] ring-1 ring-[#ece9e3]"
              >
                {g.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaCell({
  k,
  v,
  icon: Icon,
}: {
  k: string;
  v: string;
  icon?: IconType;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && (
        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center text-[#9a9aaa]">
          <Icon className="text-[13px]" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9aaa]">{k}</p>
        <p className="mt-1 truncate text-sm font-medium text-[#1a1a2e]">{v}</p>
      </div>
    </div>
  );
}

function ReadinessCell({ pct }: { pct: number }) {
  const palette =
    pct >= 80
      ? { bg: "bg-[#e8f0e9]", border: "border-[#cfe0d2]", text: "text-[#2d5a3d]" }
      : pct >= 60
      ? { bg: "bg-[#fbf2d9]", border: "border-[#ecdfa9]", text: "text-[#7a5a1a]" }
      : { bg: "bg-[#f6e4d4]", border: "border-[#ecd6bc]", text: "text-[#8a4a1a]" };
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center text-[#9a9aaa]">
        <FaShield className="text-[13px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9aaa]">
          Bid Readiness
        </p>
        <span
          className={`mt-1 inline-flex items-baseline gap-1 rounded-full border ${palette.border} ${palette.bg} px-2.5 py-0.5 ${palette.text}`}
        >
          <span className="font-serif text-lg leading-none">{pct}</span>
          <span className="text-[10px] font-semibold leading-none">%</span>
        </span>
      </div>
    </div>
  );
}

function statusToneClass(s: ScopeStatus) {
  switch (s) {
    case "DEFINED":
      return "text-[#2d5a3d]";
    case "ASSUMED":
      return "text-[#7a5a1a]";
    case "EXCLUDED":
      return "text-[#8a4a1a]";
  }
}

function ScopeOfWorkTable({
  rows,
}: {
  rows: ReturnType<typeof getScopeOfWork>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ece9e3] bg-white p-6 text-center text-sm text-[#6a6a7a]">
        Answer the scope questions to build out a line-by-line scope of work here.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ece9e3] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#ece9e3] text-[11px] uppercase tracking-[0.18em] text-[#c08a5a]">
            <th className="w-[18%] px-5 py-3 text-left font-semibold">Item</th>
            <th className="px-5 py-3 text-left font-semibold">As defined</th>
            <th className="w-[12%] px-5 py-3 text-left font-semibold">Status</th>
            <th className="w-[16%] px-5 py-3 text-left font-semibold">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.item} className="border-t border-[#f1ede5] align-top">
              <td className="px-5 py-4 font-semibold text-[#1a1a2e]">{r.item}</td>
              <td className="px-5 py-4 leading-relaxed text-[#3a3a4a]">
                <RichText text={r.asDefined} />
              </td>
              <td
                className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusToneClass(
                  r.status,
                )}`}
              >
                {r.status}
              </td>
              <td className="px-5 py-4 text-xs text-[#9a9aaa]">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RichText({ text }: { text: string }) {
  // very small bold parser for **…**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="text-[#1a1a2e]">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function impactClass(i: Impact) {
  return i === "High"
    ? "text-[#8a4a1a]"
    : i === "Mid"
    ? "text-[#7a5a1a]"
    : "text-[#9a9aaa]";
}

function AssumptionLogList({
  rows,
}: {
  rows: ReturnType<typeof getAssumptionLog>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ece9e3] bg-white p-6 text-center text-sm text-[#6a6a7a]">
        No standing assumptions yet.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-[#ece9e3] bg-white">
      {rows.map((r, idx) => (
        <div
          key={r.id}
          className={`grid grid-cols-[40px_1fr_90px] items-start gap-4 px-5 py-4 ${
            idx > 0 ? "border-t border-[#f1ede5]" : ""
          }`}
        >
          <span className="text-xs font-semibold tracking-wider text-[#9a9aaa]">{r.id}</span>
          <p className="text-sm leading-relaxed text-[#3a3a4a]">
            {r.text.split(r.highlight).map((seg, i, arr) => (
              <span key={i}>
                {seg}
                {i < arr.length - 1 && (
                  <span className="text-[#c08a5a]">{r.highlight}</span>
                )}
              </span>
            ))}
          </p>
          <span className={`text-xs font-semibold ${impactClass(r.impact)}`}>
            {r.impact} impact
          </span>
        </div>
      ))}
    </div>
  );
}

function OpenItemsGrid({
  cards,
}: {
  cards: ReturnType<typeof getOpenItemCards>;
}) {
  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ece9e3] bg-white p-6 text-center text-sm text-[#6a6a7a]">
        Nothing open — every decision is logged.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map((c) => (
        <div key={c.title} className="rounded-2xl border border-[#ece9e3] bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c08a5a]">
            {c.category}
          </p>
          <p className="mt-2 font-semibold text-[#1a1a2e]">{c.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#3a3a4a]">{c.body}</p>
        </div>
      ))}
    </div>
  );
}

function ResponsibilityTable({
  rows,
}: {
  rows: ReturnType<typeof getResponsibilityMatrix>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ece9e3] bg-white p-6 text-center text-sm text-[#6a6a7a]">
        Responsibilities populate as you confirm scope items.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ece9e3] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#ece9e3] text-[11px] uppercase tracking-[0.18em] text-[#c08a5a]">
            <th className="w-[26%] px-5 py-3 text-left font-semibold">Item</th>
            <th className="w-[18%] px-5 py-3 text-left font-semibold">Supplied by</th>
            <th className="w-[18%] px-5 py-3 text-left font-semibold">Installed by</th>
            <th className="px-5 py-3 text-left font-semibold">Timing note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.item} className="border-t border-[#f1ede5] align-top">
              <td className="px-5 py-4 font-semibold text-[#1a1a2e]">{r.item}</td>
              <td className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2d5a3d]">
                {r.suppliedBy}
              </td>
              <td className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2d5a3d]">
                {r.installedBy}
              </td>
              <td className="px-5 py-4 text-xs leading-relaxed text-[#9a9aaa]">{r.timing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BudgetTiers({
  data,
}: {
  data: ReturnType<typeof getBudgetSensitivity>;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#ece9e3] bg-white">
        <div className="grid grid-cols-1 divide-y divide-[#f1ede5] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {data.tiers.map((t) => (
            <div key={t.label} className="p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9aaa]">
                {t.label}
              </p>
              <p
                className={`mt-3 font-serif text-3xl ${
                  t.emphasis ? "text-[#c08a5a]" : "text-[#1a1a2e]"
                }`}
              >
                {t.amount}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[#9a9aaa]">{t.blurb}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-start gap-3 border-l-2 border-[#c08a5a] bg-white px-5 py-4 text-sm leading-relaxed text-[#3a3a4a]">
        <span>
          <strong className="text-[#1a1a2e]">Why the range is wide:</strong> {data.whyWide}
        </span>
      </div>
    </div>
  );
}

function ReadinessGrid({ r }: { r: ReturnType<typeof getReadinessScores> }) {
  const items: Array<[string, number]> = [
    ["Scope definition", r.scopeDefinition],
    ["Finish selections", r.finishSelections],
    ["Structural clarity", r.structuralClarity],
    ["Fixture specs", r.fixtureSpecs],
  ];
  return (
    <div className="rounded-2xl border border-[#ece9e3] bg-white">
      <div className="grid grid-cols-2 divide-x divide-[#f1ede5] sm:grid-cols-4">
        {items.map(([k, v]) => (
          <div key={k} className="p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a9aaa]">
              {k}
            </p>
            <p className="mt-3 font-serif text-3xl text-[#1a1a2e]">{v}%</p>
            <div className="mt-3 h-1 w-full rounded-full bg-[#f0ede8]">
              <div
                className="h-1 rounded-full bg-[#2d5a3d]"
                style={{ width: `${v}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessBreakdown({
  report,
}: {
  report: ReturnType<typeof getReadinessReport>;
}) {
  const totalOpen = report.allMissing.length;
  return (
    <div className="rounded-2xl border border-[#ece9e3] bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-[#f1ede5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c08a5a]">
            What's still open
          </p>
          <h3 className="mt-1 font-serif text-2xl text-[#1a1a2e]">
            {totalOpen === 0
              ? "Every category is defined."
              : `${totalOpen} ${totalOpen === 1 ? "decision" : "decisions"} would tighten this scope`}
          </h3>
        </div>
        <p className="text-xs text-[#6a6a7a] sm:max-w-xs sm:text-right">
          We track every intake answer behind the scenes — these are the ones still
          unresolved or marked "not sure".
        </p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#f1ede5] sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
        {report.dimensions.map((d, i) => {
          const open = d.facts.filter((f) => f.relevant && !f.resolved);
          const tone =
            d.score >= 80
              ? "text-[#2d5a3d]"
              : d.score >= 60
              ? "text-[#7a5a1a]"
              : "text-[#8a4a1a]";
          return (
            <div
              key={d.key}
              className={`p-6 ${i % 2 === 1 ? "" : ""} ${
                i >= 2 ? "sm:border-t sm:border-[#f1ede5]" : ""
              }`}
            >
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
                  {d.label}
                </p>
                <p className={`font-serif text-2xl leading-none ${tone}`}>{d.score}%</p>
              </div>
              <p className="mt-2 text-xs text-[#6a6a7a]">{d.blurb}</p>
              <p className="mt-3 text-[11px] text-[#9a9aaa]">
                {d.resolved} of {d.total} resolved
              </p>
              {open.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {open.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-start gap-2 text-xs leading-snug text-[#3a3a4a]"
                    >
                      <FaCircleQuestion className="mt-0.5 flex-none text-[#c08a5a]" />
                      <span>
                        <span className="font-medium text-[#1a1a2e]">{f.label}</span>
                        {f.hint && (
                          <span className="text-[#6a6a7a]"> — {f.hint}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#eef3ee] px-3 py-1 text-[11px] font-medium text-[#2d5a3d]">
                  <FaCircleCheck /> All set
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────── Existing Cost Breakdown table (preserved) ── */

function readinessBadge(r: LineReadiness) {
  if (r === "firm")
    return {
      icon: FaCircleCheck,
      label: "Firm",
      cls: "bg-[#eef3ee] text-[#2d5a3d] border-[#d6e3d8]",
      title: "High confidence — driven by code minimums or fixed labor.",
    };
  if (r === "estimated")
    return {
      icon: FaCircleInfo,
      label: "Estimated",
      cls: "bg-[#fbf2d9] text-[#7a5a1a] border-[#ecdfa9]",
      title: "Mid confidence — depends on a finish or fixture spec.",
    };
  return {
    icon: FaTriangleExclamation,
    label: "Rough",
    cls: "bg-[#f6e4d4] text-[#8a4a1a] border-[#ecd6bc]",
    title: "Low confidence — open decision or behind-wall discovery.",
  };
}

function CostTable({
  breakdown,
  readiness,
  showReadiness,
}: {
  breakdown: ReturnType<typeof getCostBreakdown>;
  readiness?: ReturnType<typeof getReadinessScores>;
  showReadiness?: boolean;
}) {
  if (breakdown.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ece9e3] bg-white p-6 text-center text-sm text-[#6a6a7a]">
        Nothing to estimate yet — answer the scope questions to see a line-item breakdown here.
      </div>
    );
  }
  const groups: Array<{
    name: BreakdownLine["category"];
    rows: BreakdownLine[];
    low: number;
    high: number;
  }> = [];
  for (const cat of ["Materials", "Labor", "Permits & Fees"] as const) {
    const rows = breakdown.lines.filter((l) => l.category === cat);
    if (rows.length === 0) continue;
    const low = rows.reduce((n, r) => n + r.low, 0);
    const high = rows.reduce((n, r) => n + r.high, 0);
    groups.push({ name: cat, rows, low, high });
  }
  const colSpan = showReadiness ? 4 : 3;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ece9e3] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-[#f8f7f4] text-xs uppercase tracking-wider text-[#6a6a7a]">
          <tr>
            <th className="px-5 py-3 text-left font-semibold">Item</th>
            <th className="px-5 py-3 text-left font-semibold">Description</th>
            {showReadiness && (
              <th className="px-5 py-3 text-left font-semibold">Confidence</th>
            )}
            <th className="px-5 py-3 text-right font-semibold">Estimated cost</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Group key={g.name} group={g} showReadiness={showReadiness} />
          ))}
          <tr className="border-t-2 border-[#1a1a2e] bg-[#e8e6e1]">
            <td className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#1a1a2e]">
              Subtotal
            </td>
            <td
              className="px-5 py-3 text-xs text-[#3a3a4a]"
              colSpan={showReadiness ? 2 : 1}
            >
              Materials + labor + permits
            </td>
            <td className="px-5 py-3 text-right text-sm font-bold text-[#1a1a2e]">
              {fmtRange(breakdown.subtotalLow, breakdown.subtotalHigh)}
            </td>
          </tr>
          <tr className="bg-[#fbeede]">
            <td className="px-5 py-3 text-sm font-semibold text-[#7a4a18]">20% contingency</td>
            <td
              className="px-5 py-3 text-xs text-[#7a4a18]"
              colSpan={showReadiness ? 2 : 1}
            >
              Buffer for change orders & surprises behind walls
            </td>
            <td className="px-5 py-3 text-right font-semibold text-[#7a4a18]">
              {fmtRange(breakdown.contingencyLow, breakdown.contingencyHigh)}
            </td>
          </tr>
          <tr className="bg-[#1a1a2e] text-white">
            <td className="px-5 py-4 text-sm font-bold uppercase tracking-wider">Total</td>
            <td
              className="px-5 py-4 text-xs text-[#bdbab0]"
              colSpan={showReadiness ? 2 : 1}
            >
              All-in estimate{readiness ? ` · ${readiness.overall}% defined` : ""}
            </td>
            <td className="px-5 py-4 text-right font-serif text-xl">
              {fmtRange(breakdown.totalLow, breakdown.totalHigh)}
            </td>
          </tr>
          {showReadiness && (
            <tr>
              <td colSpan={colSpan} className="bg-[#faf8f3] px-5 py-3 text-[11px] text-[#6a6a7a]">
                <span className="font-semibold text-[#1a1a2e]">Reading the confidence column:</span>{" "}
                <span className="text-[#2d5a3d]">Firm</span> = locked by code or fixed labor.{" "}
                <span className="text-[#7a5a1a]">Estimated</span> = depends on a spec you haven't
                set yet. <span className="text-[#8a4a1a]">Rough</span> = open decision or
                behind-wall surprise risk — these are the numbers that move the most.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Group({
  group,
  showReadiness,
}: {
  group: { name: BreakdownLine["category"]; rows: BreakdownLine[]; low: number; high: number };
  showReadiness?: boolean;
}) {
  const colSpan = showReadiness ? 4 : 3;
  return (
    <>
      <tr className="border-t-[3px] border-[#1a1a2e] bg-[#1a1a2e]">
        <td
          colSpan={colSpan}
          className="px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
        >
          {group.name}
        </td>
      </tr>
      {group.rows.map((r) => {
        const b = readinessBadge(r.readiness);
        const BIcon = b.icon;
        return (
          <tr key={r.item} className="border-t border-[#f1ede5]">
            <td className="py-3 pl-10 pr-5 font-medium text-[#1a1a2e]">{r.item}</td>
            <td className="px-5 py-3 text-[#6a6a7a]">{r.description}</td>
            {showReadiness && (
              <td className="px-5 py-3">
                <span
                  title={b.title}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${b.cls}`}
                >
                  <BIcon className="text-[9px]" />
                  {b.label}
                </span>
              </td>
            )}
            <td className="px-5 py-3 text-right text-[#1a1a2e]">{fmtRange(r.low, r.high)}</td>
          </tr>
        );
      })}
      <tr className="border-t border-[#ece9e3] bg-[#f0ede8]">
        <td className="py-2.5 pl-10 pr-5 text-xs font-bold uppercase tracking-wider text-[#1a1a2e]">
          {group.name} subtotal
        </td>
        <td className="bg-[#f0ede8]" colSpan={showReadiness ? 2 : 1} />
        <td className="px-5 py-2.5 text-right text-sm font-bold text-[#1a1a2e]">
          {fmtRange(group.low, group.high)}
        </td>
      </tr>
    </>
  );
}

function Callout({
  title,
  icon: Icon,
  tone,
  items,
  emptyText,
}: {
  title: string;
  icon: IconType;
  tone: "warn" | "info";
  items: string[];
  emptyText?: string;
}) {
  const palette =
    tone === "warn"
      ? { bar: "bg-[#c08a5a]", chip: "bg-[#f6e4d4] text-[#8a4a1a]", border: "border-[#ece9e3]" }
      : { bar: "bg-[#2d5a3d]", chip: "bg-[#eef3ee] text-[#234a31]", border: "border-[#ece9e3]" };
  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${palette.border}`}
    >
      <div className={`flex items-center gap-3 ${palette.chip} px-5 py-3`}>
        <Icon className="text-base" />
        <p className="text-sm font-semibold leading-tight">{title}</p>
      </div>
      <div className="px-5 py-4">
        {items.length === 0 ? (
          <p className="text-sm text-[#6a6a7a]">{emptyText ?? "Nothing here."}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it}
                className="flex items-start gap-3 rounded-lg bg-[#faf8f3] px-3 py-2 text-sm text-[#3a3a4a]"
              >
                <span
                  className={`mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full ${palette.bar}`}
                />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
