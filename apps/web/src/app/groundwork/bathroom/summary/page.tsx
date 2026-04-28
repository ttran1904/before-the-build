"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { FaSpinner } from "react-icons/fa6";
import {
  useGroundworkStore,
  getOpenItems,
  getAssumptions,
  getRealisticCostRange,
  projectTypeLabel,
} from "@/lib/groundwork/store";

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

export default function GroundworkSummaryPage() {
  const state = useGroundworkStore();
  // Wait for Zustand persist rehydration to avoid SSR/CSR mismatch.
  const hydrated = useSyncExternalStore(
    (cb) => useGroundworkStore.persist.onFinishHydration(cb),
    () => useGroundworkStore.persist.hasHydrated(),
    () => false
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
        .toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
  const cost = getRealisticCostRange(state);

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      <header className="border-b border-[#ece9e3] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center px-6">
          <div className="flex-1 text-sm font-semibold tracking-wide text-[#1a1a2e]">
            Groundwork · Bathroom
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/groundwork/bathroom"
              className="text-[#6a6a7a] underline transition hover:text-[#1a1a2e]"
            >
              Edit answers
            </Link>
            <button
              onClick={exportPDF}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-full bg-[#c08a5a] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#a87445] disabled:opacity-60"
            >
              {exporting ? <><FaSpinner className="animate-spin" /> Exporting…</> : "Download PDF"}
            </button>
          </div>
        </div>
      </header>

      <main ref={printRef} className="mx-auto w-full max-w-3xl space-y-10 px-6 py-12">
        <section>
          <h1 className="font-serif text-4xl text-[#1a1a2e]">
            Contractor-ready scope
          </h1>
          <p className="mt-2 text-sm text-[#6a6a7a]">
            Share this with bidders so every contractor is pricing the same
            project — not different interpretations.
          </p>
        </section>

        <Section title="Project overview">
          <Row k="Project type" v={projectTypeLabel(state.projectType)} />
          <Row k="Bathroom" v={lbl(state.bathroomKind)} />
          <Row k="Urgency" v={lbl(state.urgency)} />
          <Row k="Budget range (homeowner)" v={lbl(state.budgetTier)} />
          <Row k="Goals" v={state.goals.length ? state.goals.join(", ") : "—"} />
        </Section>

        <Section title="What is changing vs staying">
          <Row k="Vanity" v={lbl(state.vanity)} />
          <Row k="Toilet" v={lbl(state.toilet)} />
          <Row k="Shower / tub" v={lbl(state.showerTub)} />
          <Row k="Flooring" v={lbl(state.flooring)} />
          <Row k="Walls" v={lbl(state.walls)} />
          <Row k="Lighting" v={lbl(state.lighting)} />
        </Section>

        <Section title="Plumbing, electrical & layout">
          <Row
            k="Plumbing relocation"
            v={
              [state.vanity, state.toilet, state.showerTub, state.lighting].some(
                (x) => x === "relocate"
              )
                ? "Yes — see fixtures marked relocate above"
                : "No"
            }
          />
          <Row k="Electrical" v={lbl(state.electrical)} />
          <Row k="Layout / structural" v={lbl(state.layout)} />
        </Section>

        <Section title="Realistic cost range">
          <p className="text-2xl font-semibold text-[#1a1a2e]">{cost.label}</p>
          <p className="mt-1 text-xs text-[#6a6a7a]">
            Total project, materials + labor. Refined in the Guided tier with
            line-item breakdown.
          </p>
        </Section>

        <Section title="Open items (contractor to confirm)">
          {openItems.length === 0 ? (
            <p className="text-sm text-[#6a6a7a]">
              Nothing flagged — every scope question was answered.
            </p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#3a3a4a]">
              {openItems.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Assumption log">
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#3a3a4a]">
            {assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Section>

        {state.notes && (
          <Section title="Homeowner notes">
            <p className="whitespace-pre-wrap text-sm text-[#3a3a4a]">
              {state.notes}
            </p>
          </Section>
        )}

        {state.photos.length > 0 && (
          <Section title="Photos of current bathroom">
            <div className="grid grid-cols-3 gap-3">
              {state.photos.map((src, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={i}
                  src={src}
                  alt={`bathroom-${i}`}
                  className="h-32 w-full rounded-md object-cover"
                />
              ))}
            </div>
          </Section>
        )}

        {state.floorPlan.length > 0 && (
          <Section title="Floor plan">
            <div className="grid grid-cols-2 gap-3">
              {state.floorPlan.map((src, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={i}
                  src={src}
                  alt={`floor-plan-${i}`}
                  className="h-48 w-full rounded-md object-contain bg-white p-2"
                />
              ))}
            </div>
          </Section>
        )}

        <div className="flex justify-end pt-4">
          <Link
            href="/build-book/bathroom/design"
            className="rounded-full border border-[#1a1a2e] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#1a1a2e] transition hover:bg-[#1a1a2e] hover:text-white"
          >
            Continue into Build Book →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#ece9e3] bg-white p-6 shadow-sm">
      <h2 className="font-serif text-xl text-[#1a1a2e]">{title}</h2>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#f1ede5] py-2 text-sm last:border-b-0">
      <span className="text-[#6a6a7a]">{k}</span>
      <span className="text-right font-medium text-[#1a1a2e]">{v}</span>
    </div>
  );
}
