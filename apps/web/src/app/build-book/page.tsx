"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaArrowLeft, FaFilePdf, FaPrint, FaSpinner, FaPen,
  FaImages, FaCartShopping, FaPhotoFilm, FaTableList,
  FaChartPie, FaArrowUpRightFromSquare, FaCircleExclamation,
  FaCalendarDays, FaHelmetSafety, FaCube, FaBook,
} from "react-icons/fa6";
import { useWizardStore } from "@/lib/store";
import { computeBudgetGraph } from "@before-the-build/shared";
import { saveBuildBook, saveWizardState } from "@/lib/supabase-sync";
import type { Product } from "@before-the-build/shared";

/* ── Helpers ── */

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtDecimal = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const BREAKDOWN_COLORS = ["#2d5a3d", "#d4a24c", "#d4956a", "#5b8c6e", "#87CEEB"];

const TABS = [
  { id: "overview", label: "Overview", icon: FaBook },
  { id: "cost", label: "Cost Estimator", icon: FaChartPie },
  { id: "timeline", label: "Timeline", icon: FaCalendarDays },
  { id: "contractor", label: "Contractor", icon: FaHelmetSafety },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function BuildBookPage() {
  const wizard = useWizardStore();
  const bookRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Save build book + wizard state to Supabase when viewing
  useEffect(() => {
    saveBuildBook().catch(console.error);
    saveWizardState(wizard).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Collect all selected products from moodboard state ── */
  const allPointedFlat = useMemo(() => Object.values(wizard.moodboardPointedItems).flat(), [wizard.moodboardPointedItems]);

  const selectedProducts: Product[] = useMemo(() => {
    const fromPointed = allPointedFlat
      .filter((p) => p.selectedProductIdx !== null && p.products[p.selectedProductIdx!])
      .map((p) => p.products[p.selectedProductIdx!]);
    return [...fromPointed, ...wizard.moodboardManualProducts];
  }, [allPointedFlat, wizard.moodboardManualProducts]);

  /* ── Matched labels: nice-to-haves only count if matched in moodboard ── */
  const matchedLabels = useMemo(() => {
    const set = new Set<string>();
    for (const pi of allPointedFlat) {
      if (pi.matchedItemLabel && pi.selectedProductIdx !== null) {
        set.add(pi.matchedItemLabel);
      }
    }
    return set;
  }, [allPointedFlat]);

  /* ── Compute actual room sqft from dimensions ── */
  const roomSqft = useMemo(() => {
    const wIn = (Number(wizard.roomWidth) || 0) * 12 + (Number(wizard.roomWidthIn) || 0);
    const lIn = (Number(wizard.roomLength) || 0) * 12 + (Number(wizard.roomLengthIn) || 0);
    if (!wIn || !lIn) return null;
    return Math.round((wIn * lIn) / 144);
  }, [wizard.roomWidth, wizard.roomWidthIn, wizard.roomLength, wizard.roomLengthIn]);

  /* ── Build the budget graph ── */
  const budgetGraph = useMemo(() => computeBudgetGraph({
    roomSize: wizard.bathroomSize,
    roomSqft,
    scope: wizard.scope,
    mustHaves: wizard.mustHaves,
    niceToHaves: wizard.niceToHaves.filter(nh => matchedLabels.has(nh)),
    includeNiceToHaves: true,
    customerBudget: wizard.budgetAmount,
    priceOverrides: wizard.priceOverrides,
  }), [wizard.bathroomSize, roomSqft, wizard.scope, wizard.mustHaves, wizard.niceToHaves, wizard.budgetAmount, wizard.priceOverrides, matchedLabels]);

  /* ── Moodboard drag positions for canvas ── */
  const getDefaultPosition = (idx: number, total: number, cw: number, ch: number) => {
    const cols = total <= 2 ? total : total <= 4 ? 2 : 3;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cellW = cw / cols;
    const cellH = ch / Math.ceil(total / cols);
    return { x: col * cellW + (cellW - 140) / 2, y: row * cellH + (cellH - 140) / 2 };
  };

  /* ── Parse price from string ── */
  const parsePrice = (priceStr: string): number | null => {
    const cleaned = priceStr.replace(/[^0-9.]/g, "");
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
  };

  /* ── Product summary with quantities and totals ── */
  const productSummary = useMemo(() => {
    const map = new Map<string, { product: Product; quantity: number; unitPrice: number | null }>();
    for (const p of selectedProducts) {
      const key = p.title + "|" + p.url;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += 1;
      } else {
        map.set(key, { product: p, quantity: 1, unitPrice: parsePrice(p.price) });
      }
    }
    return Array.from(map.values());
  }, [selectedProducts]);

  const productTotal = productSummary.reduce((sum, r) => {
    if (r.unitPrice != null) return sum + r.unitPrice * r.quantity;
    return sum;
  }, 0);

  /* ── Pie chart segments ── */
  const pieSegments = budgetGraph.breakdown.map((item, i) => ({
    pct: item.pct,
    color: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length],
    label: item.category,
    amount: fmt(item.amount),
  }));

  /* ── Project title ── */
  const projectTitle = "Bathroom Renovation";
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  /* Export PDF */
  const exportPDF = async () => {
    if (!bookRef.current) return;
    setExporting(true);
    // Temporarily switch to overview for full capture
    const prevTab = activeTab;
    setActiveTab("overview");
    // Wait for React render
    await new Promise((r) => setTimeout(r, 100));
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const printHiddenEls = bookRef.current.querySelectorAll(".print\\:hidden");
      printHiddenEls.forEach((el) => (el as HTMLElement).style.display = "none");

      const canvas = await html2canvas(bookRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#f8f7f4",
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const imgs = clonedDoc.querySelectorAll("img");
          imgs.forEach((img) => { img.crossOrigin = "anonymous"; });
        },
      });

      printHiddenEls.forEach((el) => (el as HTMLElement).style.display = "");

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

      pdf.save(`${projectTitle.toLowerCase().replace(/\s+/g, "-")}-build-book.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("PDF export failed. Some images may not be accessible for export. Please try printing instead.");
    }
    setActiveTab(prevTab);
    setExporting(false);
  };

  /* ── Phase groups for timeline summary ── */
  const PHASE_COLORS: Record<string, string> = {
    Planning: "#2d5a3d",
    Demolition: "#b45309",
    "Rough Work": "#d4956a",
    Installation: "#2563eb",
    Finishing: "#d4a24c",
  };

  return (
    <div className="min-h-screen bg-[#f0efe9]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e8e6e1] bg-white/95 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2d5a3d]">
                <FaCube className="text-sm text-white" />
              </div>
              <span className="text-sm font-bold text-[#1a1a2e]">Before The Build</span>
            </div>
            <span className="h-5 w-px bg-[#e8e6e1]" />
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-[#6a6a7a] hover:text-[#1a1a2e]">
              <FaArrowLeft className="text-xs" /> Dashboard
            </Link>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border border-[#e8e6e1] px-4 py-2 text-sm text-[#4a4a5a] hover:bg-[#f3f2ef]"
            >
              <FaPrint className="text-xs" /> Print
            </button>
            <button
              onClick={exportPDF}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#234a31] disabled:opacity-50"
            >
              {exporting ? (
                <><FaSpinner className="animate-spin text-xs" /> Exporting...</>
              ) : (
                <><FaFilePdf className="text-xs" /> Export PDF</>
              )}
            </button>
          </div>
        </div>
      </header>

      <div ref={bookRef} className="mx-auto max-w-6xl px-6 pt-6 pb-10">
        {/* ── Project header row ── */}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">{projectTitle}</h1>
            <p className="mt-0.5 text-sm text-[#6a6a7a]">{dateStr}</p>
          </div>
          <Link
            href="/renovate/bathroom"
            className="inline-flex items-center gap-2 rounded-lg bg-[#d4a24c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c4922c] transition print:hidden"
          >
            <FaPen className="text-xs" /> Edit Project
          </Link>
        </div>

        {/* ── Folder tabs ── */}
        <div className="flex items-end gap-0.5 print:hidden">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2 rounded-t-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-[#1a1a2e] shadow-sm z-10 -mb-px border border-[#e8e6e1] border-b-white"
                    : "bg-[#e8e6e1]/60 text-[#6a6a7a] hover:bg-[#e8e6e1] hover:text-[#4a4a5a]"
                }`}
              >
                <Icon className={`text-xs ${active ? "text-[#2d5a3d]" : "text-[#9a9aaa] group-hover:text-[#6a6a7a]"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Folder body ── */}
        <div className="rounded-b-2xl rounded-tr-2xl border border-[#e8e6e1] bg-white shadow-sm min-h-[60vh]">
          <div className="p-6">

            {/* ═══════ OVERVIEW TAB ═══════ */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* ── Summary cards row ── */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Cost Estimate card */}
                  <button
                    onClick={() => setActiveTab("cost")}
                    className="group rounded-xl border border-[#e8e6e1] bg-[#f8f7f4] p-4 text-left transition hover:border-[#2d5a3d]/30 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2d5a3d]/10">
                        <FaChartPie className="text-sm text-[#2d5a3d]" />
                      </div>
                      <span className="text-sm font-semibold text-[#1a1a2e]">Cost Estimate</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MiniPieChart segments={pieSegments} size={56} />
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-[#2d5a3d]">{fmt(budgetGraph.estimatedLow)}</p>
                        <p className="text-[10px] text-[#6a6a7a]">to {fmt(budgetGraph.estimatedHigh)}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {budgetGraph.breakdown.slice(0, 3).map((b, i) => (
                            <span key={b.category} className="flex items-center gap-1 text-[9px] text-[#6a6a7a]">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BREAKDOWN_COLORS[i] }} />
                              {b.category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Timeline card */}
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className="group rounded-xl border border-[#e8e6e1] bg-[#f8f7f4] p-4 text-left transition hover:border-[#2d5a3d]/30 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2d5a3d]/10">
                        <FaCalendarDays className="text-sm text-[#2d5a3d]" />
                      </div>
                      <span className="text-sm font-semibold text-[#1a1a2e]">Timeline</span>
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(PHASE_COLORS).map(([phase, color]) => (
                        <div key={phase} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs text-[#4a4a5a] flex-1">{phase}</span>
                          <div className="h-1.5 w-12 rounded-full bg-[#e8e6e1] overflow-hidden">
                            <div className="h-full rounded-full" style={{ backgroundColor: color, width: "60%" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </button>

                  {/* Contractor card */}
                  <button
                    onClick={() => setActiveTab("contractor")}
                    className="group rounded-xl border border-[#e8e6e1] bg-[#f8f7f4] p-4 text-left transition hover:border-[#d4a24c]/30 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4a24c]/10">
                        <FaHelmetSafety className="text-sm text-[#d4a24c]" />
                      </div>
                      <span className="text-sm font-semibold text-[#1a1a2e]">Contractor</span>
                    </div>
                    {budgetGraph.breakdown.find(b => b.category === "Labor") ? (
                      <div>
                        <p className="text-lg font-bold text-[#d4a24c]">
                          {fmt(budgetGraph.breakdown.find(b => b.category === "Labor")!.lowAmount)}
                          <span className="text-sm font-normal text-[#6a6a7a]"> – {fmt(budgetGraph.breakdown.find(b => b.category === "Labor")!.highAmount)}</span>
                        </p>
                        <p className="text-[10px] text-[#6a6a7a] mt-0.5">Estimated labor cost</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-[#9a9aaa]">No estimate yet</p>
                        <p className="text-[10px] text-[#6a6a7a] mt-0.5">Search for contractors</p>
                      </div>
                    )}
                  </button>
                </div>

                {/* ── Side-by-side: Rendering + Moodboard ── */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Rendering */}
                  <div className="rounded-xl border border-[#e8e6e1] bg-[#f8f7f4] overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8e6e1] bg-white">
                      <FaPhotoFilm className="text-sm text-[#2d5a3d]" />
                      <span className="text-sm font-bold text-[#1a1a2e]">2D Rendering</span>
                    </div>
                    <div className="p-4">
                      {wizard.mockupGeneratedImages.length > 0 ? (
                        <div className="grid gap-2 grid-cols-2">
                          {wizard.mockupGeneratedImages.map((imgUrl, i) => (
                            <div key={i} className="overflow-hidden rounded-lg border border-[#e8e6e1] bg-white shadow-sm">
                              <div className="relative aspect-[3/2] w-full">
                                <Image src={imgUrl} alt={`Mockup ${i + 1}`} fill className="object-cover" sizes="300px" unoptimized />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <FaPhotoFilm className="text-3xl text-[#d5d3cd] mb-2" />
                          <p className="text-sm text-[#9a9aaa]">No renderings generated yet.</p>
                          <p className="text-xs text-[#b5b5c5] mt-1">Generate mockups in the wizard to see them here.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Moodboard */}
                  <div className="rounded-xl border border-[#e8e6e1] bg-[#f8f7f4] overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8e6e1] bg-white">
                      <FaImages className="text-sm text-[#2d5a3d]" />
                      <span className="text-sm font-bold text-[#1a1a2e]">Moodboard</span>
                    </div>
                    <div className="p-4">
                      {selectedProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <FaImages className="text-3xl text-[#d5d3cd] mb-2" />
                          <p className="text-sm text-[#9a9aaa]">No items selected yet.</p>
                        </div>
                      ) : (
                        <div className="relative h-[300px] overflow-hidden rounded-lg border border-[#e8e6e1] bg-white">
                          {selectedProducts.map((p, i) => {
                            const pos = wizard.moodboardDragPositions[i] || getDefaultPosition(i, selectedProducts.length, 500, 300);
                            return (
                              <div key={i} className="absolute" style={{ left: pos.x * 500 / 900, top: pos.y * 300 / 520 }}>
                                {p.thumbnail ? (
                                  <div className="relative h-[100px] w-[100px]">
                                    <Image src={p.thumbnail} alt={p.title} fill className="object-contain" sizes="100px" unoptimized />
                                  </div>
                                ) : (
                                  <div className="flex h-[100px] w-[100px] items-center justify-center rounded-lg bg-[#f8f7f4]">
                                    <FaCartShopping className="text-xl text-[#d5d3cd]" />
                                  </div>
                                )}
                                <p className="mt-0.5 max-w-[100px] truncate text-center text-[8px] font-medium text-[#6a6a7a]">{p.title}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Product Selections ── */}
                {selectedProducts.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-[#1a1a2e] mb-3">
                      <FaCartShopping className="text-sm text-[#2d5a3d]" /> Product Selections
                    </h3>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                      {selectedProducts.map((p, i) => (
                        <div key={i} className="group overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:border-[#2d5a3d]/30 hover:shadow-md">
                          {p.thumbnail ? (
                            <div className="relative aspect-square w-full overflow-hidden bg-[#f8f7f4]">
                              <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="160px" unoptimized />
                            </div>
                          ) : (
                            <div className="flex aspect-square w-full items-center justify-center bg-[#f8f7f4]">
                              <FaCartShopping className="text-xl text-[#d5d3cd]" />
                            </div>
                          )}
                          <div className="p-2">
                            <p className="line-clamp-2 text-[10px] font-medium leading-tight text-[#1a1a2e]">{p.title}</p>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-xs font-bold text-[#2d5a3d]">{p.price || "$TBD"}</span>
                            </div>
                            {p.url && (
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-[#2d8a9a] hover:underline">
                                LINK <FaArrowUpRightFromSquare className="text-[7px]" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Product List & Summary ── */}
                {productSummary.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-[#1a1a2e] mb-3">
                      <FaTableList className="text-sm text-[#2d5a3d]" /> Product List &amp; Summary
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-[#e8e6e1]">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b-2 border-[#1a1a2e] bg-[#f8f7f4]">
                            <th className="py-3 px-4 font-bold text-[#1a1a2e]">Description</th>
                            <th className="py-3 px-4 font-bold text-[#1a1a2e]">Source</th>
                            <th className="py-3 px-4 font-bold text-[#1a1a2e]">Link</th>
                            <th className="py-3 px-4 text-center font-bold text-[#1a1a2e]">Qty</th>
                            <th className="py-3 px-4 text-right font-bold text-[#1a1a2e]">Unit Price</th>
                            <th className="py-3 px-4 text-right font-bold text-[#1a1a2e]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productSummary.map((row, i) => {
                            const totalForRow = row.unitPrice != null ? row.unitPrice * row.quantity : null;
                            return (
                              <tr key={i} className="border-b border-[#e8e6e1] hover:bg-[#f8f7f4] transition">
                                <td className="py-2.5 px-4 font-semibold text-[#1a1a2e] uppercase text-xs">{row.product.title}</td>
                                <td className="py-2.5 px-4 text-xs text-[#4a4a5a]">{row.product.source || "—"}</td>
                                <td className="py-2.5 px-4">
                                  {row.product.url ? (
                                    <a href={row.product.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#2d8a9a] hover:underline">
                                      SHOP NOW
                                    </a>
                                  ) : "—"}
                                </td>
                                <td className="py-2.5 px-4 text-center text-xs text-[#4a4a5a]">{row.quantity}</td>
                                <td className="py-2.5 px-4 text-right text-xs text-[#4a4a5a]">
                                  {row.unitPrice != null ? fmtDecimal(row.unitPrice) : "TBD"}
                                </td>
                                <td className="py-2.5 px-4 text-right text-xs font-semibold text-[#1a1a2e]">
                                  {totalForRow != null ? fmtDecimal(totalForRow) : "$0.00"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-[#1a1a2e] bg-[#f8f7f4]">
                            <td colSpan={5} className="py-3 px-4 text-right font-bold text-[#1a1a2e]">Products Total</td>
                            <td className="py-3 px-4 text-right text-base font-bold text-[#2d5a3d]">{fmtDecimal(productTotal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════ COST TAB ═══════ */}
            {activeTab === "cost" && (
              <div className="space-y-6">
                {/* Total estimate cards */}
                <div className="flex items-stretch gap-4">
                  <div className="flex-1 rounded-xl border border-[#2d5a3d]/20 bg-[#2d5a3d]/5 p-5">
                    <p className="text-xs font-medium text-[#6a6a7a]">Total Estimate</p>
                    <p className="mt-1 text-2xl font-bold text-[#2d5a3d]">
                      {fmt(budgetGraph.estimatedLow)} – {fmt(budgetGraph.estimatedHigh)}
                    </p>
                  </div>
                  {wizard.budgetAmount != null && wizard.budgetAmount > 0 && (
                    <div className="flex-1 rounded-xl border border-[#e8e6e1] bg-[#f8f7f4] p-5">
                      <p className="text-xs font-medium text-[#6a6a7a]">Your Budget</p>
                      <p className="mt-1 text-2xl font-bold text-[#1a1a2e]">{fmt(wizard.budgetAmount)}</p>
                    </div>
                  )}
                </div>

                {/* Breakdown table + pie */}
                <div className="flex items-start gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center border-b-2 border-[#1a1a2e] pb-2 mb-1">
                      <span className="flex-1 text-sm font-bold text-[#1a1a2e]">Cost Breakdown</span>
                      <span className="w-12 text-right text-sm font-bold text-[#6a6a7a]">%</span>
                      <span className="w-36 text-right text-sm font-bold text-[#1a1a2e]">Range</span>
                    </div>
                    {budgetGraph.breakdown.map((item, i) => (
                      <div key={item.category} className="flex items-center border-b border-[#e8e6e1] py-2.5">
                        <div className="flex flex-1 items-center gap-2.5">
                          <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }} />
                          <span className="text-sm text-[#1a1a2e]">{item.category}</span>
                        </div>
                        <span className="w-12 text-right text-sm text-[#6a6a7a]">{item.pct}%</span>
                        <span className="w-36 text-right text-sm font-medium text-[#1a1a2e]">
                          {item.lowAmount === item.highAmount
                            ? fmt(item.amount)
                            : `${fmt(item.lowAmount)}–${fmt(item.highAmount)}`}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center pt-3 mt-1">
                      <div className="flex flex-1 items-center gap-2.5">
                        <span className="h-3 w-3 shrink-0" />
                        <span className="text-sm font-bold text-[#2d5a3d]">Estimated Total</span>
                      </div>
                      <span className="w-12" />
                      <span className="w-36 text-right text-sm font-bold text-[#2d5a3d]">
                        {fmt(budgetGraph.estimatedLow)} – {fmt(budgetGraph.estimatedHigh)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <PieChart segments={pieSegments} size={200} />
                  </div>
                </div>

                {/* Rationale */}
                <p className="border-t border-[#e8e6e1] pt-4 text-xs italic leading-relaxed text-[#6a6a7a]">
                  {budgetGraph.rationale}
                </p>

                {/* Disclaimer */}
                <div className="flex items-start gap-2 rounded-lg border border-[#d4a24c]/30 bg-[#fef9ee] px-4 py-3">
                  <FaCircleExclamation className="mt-0.5 shrink-0 text-xs text-[#d4a24c]" />
                  <p className="text-[11px] leading-relaxed text-[#6a6a7a]">
                    <span className="font-semibold text-[#4a4a5a]">Disclaimer:</span> These figures are{" "}
                    <span className="font-semibold">estimates only</span> based on typical market rates and may vary depending on your location, contractor, materials chosen, and project complexity. Always obtain multiple quotes before committing.
                  </p>
                </div>

                {/* Item-level breakdown */}
                {budgetGraph.itemBreakdown.length > 0 && (
                  <div className="border-t border-[#e8e6e1] pt-5">
                    <h4 className="mb-3 text-sm font-bold text-[#1a1a2e]">Item Breakdown</h4>
                    <div className="overflow-x-auto rounded-xl border border-[#e8e6e1]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#e8e6e1] bg-[#f8f7f4] text-[10px] font-semibold uppercase tracking-wide text-[#6a6a7a]">
                            <th className="py-2 px-4">Item</th>
                            <th className="py-2 px-4 text-right">Material</th>
                            <th className="py-2 px-4 text-right">Labor</th>
                            <th className="py-2 px-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgetGraph.itemBreakdown.map((item) => {
                            const matFixed = item.materialLow === item.materialHigh;
                            const labFixed = item.laborLow === item.laborHigh;
                            const totFixed = item.totalLow === item.totalHigh;
                            return (
                              <tr key={item.label} className="border-b border-[#e8e6e1]/50 hover:bg-[#f8f7f4] transition">
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${item.source === "must-have" ? "bg-[#2d5a3d]" : "bg-[#d4a24c]"}`} />
                                    <span className="text-[#1a1a2e]">{item.label}</span>
                                    {item.overridden && (
                                      <span className="shrink-0 rounded bg-[#2d5a3d]/10 px-1 py-0.5 text-[8px] font-semibold text-[#2d5a3d]">REAL</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-right text-[#6a6a7a]">
                                  {matFixed ? fmt(item.materialLow) : `${fmt(item.materialLow)}–${fmt(item.materialHigh)}`}
                                </td>
                                <td className="py-2.5 px-4 text-right text-[#6a6a7a]">
                                  {labFixed ? fmt(item.laborLow) : `${fmt(item.laborLow)}–${fmt(item.laborHigh)}`}
                                </td>
                                <td className="py-2.5 px-4 text-right font-medium text-[#1a1a2e]">
                                  {totFixed ? fmt(item.totalLow) : `${fmt(item.totalLow)}–${fmt(item.totalHigh)}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════ TIMELINE TAB ═══════ */}
            {activeTab === "timeline" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1a1a2e]">Project Timeline</h2>
                  <Link
                    href="/renovate/bathroom/timeline"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#234a31] transition print:hidden"
                  >
                    <FaCalendarDays className="text-xs" /> Open Full Timeline
                  </Link>
                </div>

                {/* Phase overview */}
                <div className="rounded-xl border border-[#e8e6e1] overflow-hidden">
                  {Object.entries(PHASE_COLORS).map(([phase, color], i) => (
                    <div key={phase} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-[#e8e6e1]" : ""} hover:bg-[#f8f7f4] transition`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${color}15` }}>
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#1a1a2e]">{phase}</p>
                        <p className="text-xs text-[#6a6a7a]">
                          {phase === "Planning" && "Permits, design, procurement"}
                          {phase === "Demolition" && "Tear-out, disposal, prep"}
                          {phase === "Rough Work" && "Plumbing, electrical, framing"}
                          {phase === "Installation" && "Fixtures, tile, vanity"}
                          {phase === "Finishing" && "Paint, trim, final touches"}
                        </p>
                      </div>
                      <div className="w-48">
                        <div className="h-2.5 w-full rounded-full bg-[#e8e6e1] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: color,
                              width: phase === "Planning" ? "20%" : phase === "Demolition" ? "10%" : phase === "Rough Work" ? "25%" : phase === "Installation" ? "30%" : "15%",
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-right text-[#6a6a7a]">
                          {phase === "Planning" && "~1-2 weeks"}
                          {phase === "Demolition" && "~2-3 days"}
                          {phase === "Rough Work" && "~1-2 weeks"}
                          {phase === "Installation" && "~2-3 weeks"}
                          {phase === "Finishing" && "~3-5 days"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs italic text-[#6a6a7a]">
                  Use the full timeline planner to generate AI-powered tasks, manage phases, and track progress with Kanban, Gantt, or list views.
                </p>
              </div>
            )}

            {/* ═══════ CONTRACTOR TAB ═══════ */}
            {activeTab === "contractor" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1a1a2e]">Find a Contractor</h2>
                  <Link
                    href="/renovate/bathroom?step=contractor-search"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#d4a24c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c4922c] transition print:hidden"
                  >
                    <FaHelmetSafety className="text-xs" /> Search Contractors
                  </Link>
                </div>

                {/* Labor cost estimate */}
                {budgetGraph.breakdown.find(b => b.category === "Labor") && (
                  <div className="rounded-xl border border-[#d4a24c]/20 bg-[#d4a24c]/5 p-5">
                    <p className="text-xs font-medium text-[#6a6a7a]">Estimated Contractor / Labor Cost</p>
                    <p className="mt-1 text-2xl font-bold text-[#d4a24c]">
                      {fmt(budgetGraph.breakdown.find(b => b.category === "Labor")!.lowAmount)} – {fmt(budgetGraph.breakdown.find(b => b.category === "Labor")!.highAmount)}
                    </p>
                    <p className="mt-1 text-xs text-[#6a6a7a]">
                      This is the estimated labor portion of your renovation budget. Actual contractor quotes may vary.
                    </p>
                  </div>
                )}

                {/* CTA */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#e8e6e1] bg-[#f8f7f4] py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d4a24c]/10">
                    <FaHelmetSafety className="text-2xl text-[#d4a24c]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1a1a2e]">Find Contractors Near You</h3>
                  <p className="mt-2 max-w-md text-sm text-[#6a6a7a]">
                    Search for vetted, top-rated contractors in your area who specialize in bathroom renovations. Compare ratings, reviews, and get quotes.
                  </p>
                  <Link
                    href="/renovate/bathroom?step=contractor-search"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#d4a24c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c4922c] transition print:hidden"
                  >
                    <FaHelmetSafety className="text-xs" /> Search Contractors
                  </Link>
                </div>

                {/* Disclaimer */}
                <div className="flex items-start gap-2 rounded-lg border border-[#d4a24c]/30 bg-[#fef9ee] px-4 py-3">
                  <FaCircleExclamation className="mt-0.5 shrink-0 text-xs text-[#d4a24c]" />
                  <p className="text-[11px] leading-relaxed text-[#6a6a7a]">
                    Always obtain multiple quotes and verify contractor licenses, insurance, and references before hiring.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer inside folder */}
          <div className="border-t border-[#e8e6e1] px-6 py-4 text-center">
            <p className="text-xs text-[#9a9aaa]">
              Generated by Before The Build • {new Date().toLocaleDateString()} • For planning purposes only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared Components ── */

function MiniPieChart({ segments, size = 56 }: { segments: { pct: number; color: string }[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - 2) / 2;
  let cumulativeAngle = -90;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {segments.map((seg, i) => {
        const startAngle = cumulativeAngle;
        const sweepAngle = (seg.pct / 100) * 360;
        cumulativeAngle += sweepAngle;
        const startRad = toRad(startAngle);
        const endRad = toRad(startAngle + sweepAngle);
        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);
        const largeArc = sweepAngle > 180 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={seg.color}
            stroke="#fff"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}

function PieChart({ segments, size = 180 }: { segments: { pct: number; color: string; label: string; amount?: string }[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - 4) / 2;
  const [hovered, setHovered] = useState<number | null>(null);

  let cumulativeAngle = -90;
  const wedges = segments.map((seg) => {
    const startAngle = cumulativeAngle;
    const sweepAngle = (seg.pct / 100) * 360;
    cumulativeAngle += sweepAngle;
    return { ...seg, startAngle, sweepAngle };
  });

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {wedges.map((w, i) => {
          const isHovered = hovered === i;
          const r = isHovered ? radius : radius - 2;
          const startRad = toRad(w.startAngle);
          const endRad = toRad(w.startAngle + w.sweepAngle);
          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          const largeArc = w.sweepAngle > 180 ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return (
            <path
              key={i}
              d={d}
              fill={w.color}
              stroke="#fff"
              strokeWidth={2}
              className="transition-all duration-150"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer", filter: isHovered ? "brightness(1.15)" : undefined }}
            />
          );
        })}
      </svg>
      {hovered !== null && (
        <div className="pointer-events-none absolute rounded-md bg-[#1a1a2e]/90 px-2.5 py-1.5 text-white shadow-lg" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="text-[10px] text-white/70">{segments[hovered].label}</div>
          <div className="text-sm font-bold">{segments[hovered].amount ?? `${segments[hovered].pct}%`}</div>
        </div>
      )}
    </div>
  );
}
