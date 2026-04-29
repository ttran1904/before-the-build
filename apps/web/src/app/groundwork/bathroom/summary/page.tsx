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
  getRealisticCostRange,
  projectTypeLabel,
} from "@/lib/groundwork/store";
import {
  getCostBreakdown,
  fmtRange,
  type BreakdownLine,
} from "@/lib/groundwork/cost-breakdown";
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

/** Map a fixture/scope status string -> color + icon for the chip. */
function statusChip(v: string | null) {
  switch (v) {
    case "keep":
      return { label: "Keep", icon: FaCircleCheck, cls: "bg-[#eef3ee] text-[#234a31]" };
    case "replace":
      return { label: "Replace", icon: FaArrowRotateRight, cls: "bg-[#f0ede8] text-[#1a1a2e]" };
    case "relocate":
      return { label: "Relocate", icon: FaArrowsLeftRight, cls: "bg-[#fbeede] text-[#7a4a18]" };
    case "unsure":
      return { label: "Unsure", icon: FaCircleQuestion, cls: "bg-[#f3efe7] text-[#6a6a7a]" };
    case "paint_only":
      return { label: "Paint only", icon: FaPaintRoller, cls: "bg-[#f0ede8] text-[#1a1a2e]" };
    case "new_tile":
      return { label: "New tile", icon: FaThLarge, cls: "bg-[#f0ede8] text-[#1a1a2e]" };
    case "wallpaper":
      return { label: "Wallpaper", icon: FaPaintRoller, cls: "bg-[#f0ede8] text-[#1a1a2e]" };
    case "none":
      return { label: "No changes", icon: FaCircleCheck, cls: "bg-[#eef3ee] text-[#234a31]" };
    case "new_outlets":
      return { label: "New outlets", icon: FaBolt, cls: "bg-[#f0ede8] text-[#1a1a2e]" };
    case "new_fixtures":
      return { label: "New fixtures", icon: FaBolt, cls: "bg-[#f0ede8] text-[#1a1a2e]" };
    case "major":
      return { label: "Major work", icon: FaBolt, cls: "bg-[#fbeede] text-[#7a4a18]" };
    case "door":
      return { label: "Door only", icon: FaTools, cls: "bg-[#f0ede8] text-[#1a1a2e]" };
    case "wall":
      return { label: "One wall", icon: FaTools, cls: "bg-[#fbeede] text-[#7a4a18]" };
    case "full_layout":
      return { label: "Full layout", icon: FaTools, cls: "bg-[#fbeede] text-[#7a4a18]" };
    default:
      return { label: lbl(v), icon: FaCircleQuestion, cls: "bg-[#f3efe7] text-[#6a6a7a]" };
  }
}

interface ScopeCardItem {
  key: string;
  label: string;
  icon: IconType;
  value: string | null;
}

export default function GroundworkSummaryPage() {
  const state = useGroundworkStore();
  const hydrated = useSyncExternalStore(
    (cb) => useGroundworkStore.persist.onFinishHydration(cb),
    () => useGroundworkStore.persist.hasHydrated(),
    () => false,
  );
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportPDF = async () => {
    if (!printRef.current) return;
    setExporting(true);
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
    setExporting(false);
  };

  if (!hydrated) return null;

  const openItems = getOpenItems(state);
  const assumptions = getAssumptions(state);
  const range = getRealisticCostRange(state);
  const breakdown = getCostBreakdown(state);

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

  return (
    <>
      <GroundworkAutosave />
      <div className="min-h-screen bg-[#faf8f3]">
        <header className="border-b border-[#ece9e3] bg-white">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-6">
            <div className="flex-1 text-sm font-semibold tracking-wide text-[#1a1a2e]">
              Groundwork Scope · Bathroom
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/groundwork/bathroom"
                className="rounded-full bg-[#f0ede8] px-4 py-1.5 text-xs font-semibold text-[#1a1a2e] transition hover:bg-[#e8e6e1]"
              >
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

        <main ref={printRef} className="mx-auto w-full max-w-5xl space-y-8 px-6 py-10">
          {/* ── Hero: realistic cost range pinned at the top ───────── */}
          <section className="rounded-3xl border border-[#ece9e3] bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a6a7a]">
                  Contractor-ready scope
                </p>
                <h1 className="mt-2 font-serif text-4xl text-[#1a1a2e]">
                  {projectTypeLabel(state.projectType)}
                  <span className="text-[#9a9aaa]"> · </span>
                  {lbl(state.bathroomKind)}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-[#6a6a7a]">
                  Share this with bidders so every contractor is pricing the
                  same project — not different interpretations.
                </p>
              </div>
              <div className="rounded-2xl bg-[#f8f7f4] px-6 py-5 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a6a7a]">
                  Realistic cost range
                </p>
                <p className="mt-1 font-serif text-3xl text-[#1a1a2e]">
                  {range.label}
                </p>
                <p className="mt-1 text-[11px] text-[#9a9aaa]">
                  Total project · materials + labor + 20% contingency
                </p>
              </div>
            </div>

            {/* Quick facts */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact icon={bathroomIcon} k="Bathroom" v={lbl(state.bathroomKind)} />
              <Fact icon={FaTools} k="Project" v={projectTypeLabel(state.projectType)} />
              <Fact
                icon={FaCircleInfo}
                k="Urgency"
                v={lbl(state.urgency)}
              />
              <Fact
                icon={FaCircleInfo}
                k="Homeowner budget"
                v={lbl(state.budgetTier)}
              />
            </div>

            {state.goals.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6a6a7a]">
                  Goals:
                </span>
                {state.goals.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-[#f0ede8] px-3 py-1 text-xs font-medium text-[#1a1a2e]"
                  >
                    {g.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── Scope cards: each fixture/element with status chip ── */}
          <Section title="What's changing vs staying">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {scopeItems.map((it) => (
                <ScopeCard key={it.key} item={it} />
              ))}
            </div>
          </Section>

          {/* ── Cost breakdown table ──────────────────────────────── */}
          <Section title="Estimated cost breakdown">
            <CostTable breakdown={breakdown} />
          </Section>

          {/* ── Open items + Assumption log ───────────────────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Callout
              title="Open items"
              subtitle="Ask each contractor to confirm these"
              icon={FaTriangleExclamation}
              tone="warn"
              items={openItems}
              emptyText="Nothing flagged — every scope question was answered."
            />
            <Callout
              title="Assumption log"
              subtitle="What this estimate assumes"
              icon={FaCircleInfo}
              tone="info"
              items={assumptions}
            />
          </div>

          {state.notes && (
            <Section title="Homeowner notes">
              <p className="whitespace-pre-wrap text-sm text-[#3a3a4a]">
                {state.notes}
              </p>
            </Section>
          )}

          {state.photos.length > 0 && (
            <Section title="Photos of current bathroom">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {state.photos.map((src, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
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
                  /* eslint-disable-next-line @next/next/no-img-element */
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

          <div className="flex justify-end pt-4">
            <Link
              href="/build-book/bathroom/design"
              className="rounded-full bg-[#1a1a2e] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#2a2a4e]"
            >
              Continue into Build Book →
            </Link>
          </div>
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

function Fact({ icon: Icon, k, v }: { icon: IconType; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#f8f7f4] px-3 py-3">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-[#1a1a2e]">
        <Icon className="text-base" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6a6a7a]">
          {k}
        </p>
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0ede8] text-[#1a1a2e]">
          <Icon className="text-lg" />
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${chip.cls}`}
        >
          <ChipIcon className="text-[10px]" />
          {chip.label}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#1a1a2e]">{item.label}</p>
    </div>
  );
}

function CostTable({ breakdown }: { breakdown: ReturnType<typeof getCostBreakdown> }) {
  if (breakdown.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ece9e3] bg-white p-6 text-center text-sm text-[#6a6a7a]">
        Nothing to estimate yet — answer the scope questions to see a line-item
        breakdown here.
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
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ece9e3] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-[#f8f7f4] text-xs uppercase tracking-wider text-[#6a6a7a]">
          <tr>
            <th className="px-5 py-3 text-left font-semibold">Item</th>
            <th className="px-5 py-3 text-left font-semibold">Description</th>
            <th className="px-5 py-3 text-right font-semibold">Estimated cost</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Group key={g.name} group={g} />
          ))}
          <tr className="border-t border-[#ece9e3] bg-[#faf8f3]">
            <td className="px-5 py-3 text-sm font-semibold text-[#1a1a2e]">
              Subtotal
            </td>
            <td className="px-5 py-3 text-xs text-[#6a6a7a]">
              Materials + labor + permits
            </td>
            <td className="px-5 py-3 text-right font-semibold text-[#1a1a2e]">
              {fmtRange(breakdown.subtotalLow, breakdown.subtotalHigh)}
            </td>
          </tr>
          <tr className="bg-[#fbeede]">
            <td className="px-5 py-3 text-sm font-semibold text-[#7a4a18]">
              20% contingency
            </td>
            <td className="px-5 py-3 text-xs text-[#7a4a18]">
              Buffer for change orders & surprises behind walls
            </td>
            <td className="px-5 py-3 text-right font-semibold text-[#7a4a18]">
              {fmtRange(breakdown.contingencyLow, breakdown.contingencyHigh)}
            </td>
          </tr>
          <tr className="bg-[#1a1a2e] text-white">
            <td className="px-5 py-4 text-sm font-bold uppercase tracking-wider">
              Total
            </td>
            <td className="px-5 py-4 text-xs text-[#bdbab0]">All-in estimate</td>
            <td className="px-5 py-4 text-right font-serif text-xl">
              {fmtRange(breakdown.totalLow, breakdown.totalHigh)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Group({
  group,
}: {
  group: { name: BreakdownLine["category"]; rows: BreakdownLine[]; low: number; high: number };
}) {
  return (
    <>
      <tr className="border-t border-[#ece9e3] bg-white">
        <td
          colSpan={3}
          className="px-5 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a6a7a]"
        >
          {group.name}
        </td>
      </tr>
      {group.rows.map((r) => (
        <tr key={r.item} className="border-t border-[#f1ede5]">
          <td className="px-5 py-3 font-medium text-[#1a1a2e]">{r.item}</td>
          <td className="px-5 py-3 text-[#6a6a7a]">{r.description}</td>
          <td className="px-5 py-3 text-right text-[#1a1a2e]">
            {fmtRange(r.low, r.high)}
          </td>
        </tr>
      ))}
      <tr className="bg-[#faf8f3]">
        <td className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#6a6a7a]">
          {group.name} subtotal
        </td>
        <td />
        <td className="px-5 py-2 text-right text-xs font-semibold text-[#1a1a2e]">
          {fmtRange(group.low, group.high)}
        </td>
      </tr>
    </>
  );
}

function Callout({
  title,
  subtitle,
  icon: Icon,
  tone,
  items,
  emptyText,
}: {
  title: string;
  subtitle: string;
  icon: IconType;
  tone: "warn" | "info";
  items: string[];
  emptyText?: string;
}) {
  const palette =
    tone === "warn"
      ? { bar: "bg-[#c08a5a]", chip: "bg-[#fbeede] text-[#7a4a18]", border: "border-[#ece9e3]" }
      : { bar: "bg-[#2d5a3d]", chip: "bg-[#eef3ee] text-[#234a31]", border: "border-[#ece9e3]" };
  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${palette.border}`}
    >
      <div className={`flex items-center gap-3 ${palette.chip} px-5 py-3`}>
        <Icon className="text-base" />
        <div>
          <p className="text-sm font-semibold leading-tight">{title}</p>
          <p className="text-[11px] opacity-80">{subtitle}</p>
        </div>
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
