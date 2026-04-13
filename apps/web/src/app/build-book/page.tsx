"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaArrowLeft, FaFilePdf, FaPrint, FaSpinner, FaPen,
  FaImages, FaCartShopping, FaPhotoFilm, FaTableList,
  FaChartPie, FaArrowUpRightFromSquare, FaCircleExclamation,
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

export default function BuildBookPage() {
  const wizard = useWizardStore();
  const bookRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

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

  /* ── Build the budget graph (matches wizard computation exactly) ── */
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
    return { x: col * cellW + (cellW - 160) / 2, y: row * cellH + (cellH - 160) / 2 };
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

  /* Export PDF */
  const exportPDF = async () => {
    if (!bookRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(bookRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8f7f4",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save("build-book.pdf");
    } catch (e) {
      console.error("PDF export failed:", e);
    }
    setExporting(false);
  };

  /* ── Pie chart segments for budget breakdown ── */
  const pieSegments = budgetGraph.breakdown.map((item, i) => ({
    pct: item.pct,
    color: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length],
    label: item.category,
    amount: fmt(item.amount),
  }));

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#e8e6e1] bg-white/90 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-[#6a6a7a] hover:text-[#1a1a2e]">
            <FaArrowLeft className="text-xs" /> Back to Dashboard
          </Link>
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

      {/* Book Content */}
      <div ref={bookRef} className="mx-auto max-w-5xl px-6 py-10">
        {/* Title page */}
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-[#2d5a3d]">Before The Build</p>
          <h1 className="mt-2 text-4xl font-bold text-[#1a1a2e]">Build Book</h1>
          <p className="mt-2 text-sm text-[#6a6a7a]">
            Bathroom Renovation • {wizard.style ? `${wizard.style.charAt(0).toUpperCase()}${wizard.style.slice(1)} Style` : "Design"} • {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          <Link
            href="/renovate/bathroom"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#d4a24c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c4922c] transition print:hidden"
          >
            <FaPen className="text-xs" /> Modify Project &amp; Update Build Book
          </Link>
        </div>

        {/* ─── 1. MOODBOARD ─── */}
        <Section icon={<FaImages />} title="Moodboard">
          {selectedProducts.length === 0 ? (
            <p className="text-sm text-[#9a9aaa]">No items selected yet. Go to Items &amp; Materials to build your moodboard.</p>
          ) : (
            <div className="relative h-[520px] overflow-hidden rounded-xl border border-[#e8e6e1] bg-white">
              {selectedProducts.map((p, i) => {
                const pos = wizard.moodboardDragPositions[i] || getDefaultPosition(i, selectedProducts.length, 900, 520);
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{ left: pos.x, top: pos.y }}
                  >
                    {p.thumbnail ? (
                      <div className="relative h-[160px] w-[160px]">
                        <Image
                          src={p.thumbnail}
                          alt={p.title}
                          fill
                          className="object-contain"
                          sizes="160px"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-[160px] w-[160px] items-center justify-center rounded-lg bg-[#f8f7f4]">
                        <FaCartShopping className="text-2xl text-[#d5d3cd]" />
                      </div>
                    )}
                    <p className="mt-1 max-w-[160px] truncate text-center text-[10px] font-medium text-[#6a6a7a]">{p.title}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ─── 2. REAL MOCKUP RENDERINGS ─── */}
        {wizard.mockupGeneratedImages.length > 0 && (
          <Section icon={<FaPhotoFilm />} title="Real Mockup Renderings">
            <p className="mb-4 text-sm text-[#6a6a7a]">
              AI-generated renovation previews based on your bathroom photos and selected products.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {wizard.mockupGeneratedImages.map((imgUrl, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-[#e8e6e1] bg-white shadow-sm">
                  <div className="relative aspect-[3/2] w-full">
                    <Image src={imgUrl} alt={`Mockup angle ${i + 1}`} fill className="object-cover" sizes="600px" unoptimized />
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs font-medium text-[#2d5a3d]">Angle {i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ─── 3. PRODUCT SELECTIONS ─── */}
        {selectedProducts.length > 0 && (
          <Section icon={<FaCartShopping />} title="Product Selections">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {selectedProducts.map((p, i) => (
                <div key={i} className="group overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:border-[#2d5a3d]/30 hover:shadow-md">
                  {p.thumbnail ? (
                    <div className="relative aspect-square w-full overflow-hidden bg-[#f8f7f4]">
                      <Image src={p.thumbnail} alt={p.title} fill className="object-cover" sizes="200px" unoptimized />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-[#f8f7f4]">
                      <FaCartShopping className="text-2xl text-[#d5d3cd]" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-medium leading-tight text-[#1a1a2e]">{p.title}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#2d5a3d]">{p.price || "$TBD"}</span>
                    </div>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#2d8a9a] hover:underline"
                      >
                        LINK <FaArrowUpRightFromSquare className="text-[8px]" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ─── 4. PRODUCT LIST & SUMMARY (Spreadsheet) ─── */}
        {productSummary.length > 0 && (
          <Section icon={<FaTableList />} title="Product List &amp; Summary">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1a1a2e]">
                    <th className="py-3 pr-4 font-bold text-[#1a1a2e]">Description</th>
                    <th className="py-3 pr-4 font-bold text-[#1a1a2e]">Source</th>
                    <th className="py-3 pr-4 font-bold text-[#1a1a2e]">Link</th>
                    <th className="py-3 pr-4 text-center font-bold text-[#1a1a2e]">Quantity</th>
                    <th className="py-3 pr-4 text-right font-bold text-[#1a1a2e]">Price Per Item</th>
                    <th className="py-3 text-right font-bold text-[#1a1a2e]">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {productSummary.map((row, i) => {
                    const totalForRow = row.unitPrice != null ? row.unitPrice * row.quantity : null;
                    return (
                      <tr key={i} className="border-b border-[#e8e6e1] hover:bg-[#f8f7f4] transition">
                        <td className="py-3 pr-4 font-semibold text-[#1a1a2e] uppercase text-xs">{row.product.title}</td>
                        <td className="py-3 pr-4 text-[#4a4a5a]">{row.product.source || "—"}</td>
                        <td className="py-3 pr-4">
                          {row.product.url ? (
                            <a href={row.product.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2d8a9a] hover:underline">
                              SHOP NOW
                            </a>
                          ) : "—"}
                        </td>
                        <td className="py-3 pr-4 text-center text-[#4a4a5a]">{row.quantity}</td>
                        <td className="py-3 pr-4 text-right text-[#4a4a5a]">
                          {row.unitPrice != null ? fmtDecimal(row.unitPrice) : "TBD"}
                        </td>
                        <td className="py-3 text-right font-semibold text-[#1a1a2e]">
                          {totalForRow != null ? fmtDecimal(totalForRow) : "$0.00"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#1a1a2e]">
                    <td colSpan={5} className="py-3 pr-4 text-right font-bold text-[#1a1a2e]">Products Total</td>
                    <td className="py-3 text-right text-lg font-bold text-[#2d5a3d]">{fmtDecimal(productTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Section>
        )}

        {/* ─── 5. BUDGET ESTIMATOR BREAKDOWN ─── */}
        <Section icon={<FaChartPie />} title="Budget Estimator Breakdown">
          {/* Total estimate card */}
          <div className="mb-6 flex items-stretch gap-4">
            <div className="flex-1 rounded-xl border border-[#2d5a3d]/20 bg-[#2d5a3d]/5 p-4">
              <p className="text-xs font-medium text-[#6a6a7a]">Total Estimate</p>
              <p className="mt-1 text-xl font-bold text-[#2d5a3d]">
                {fmt(budgetGraph.estimatedLow)} – {fmt(budgetGraph.estimatedHigh)}
              </p>
            </div>
            {wizard.budgetAmount != null && wizard.budgetAmount > 0 && (
              <div className="flex-1 rounded-xl border border-[#e8e6e1] bg-white p-4">
                <p className="text-xs font-medium text-[#6a6a7a]">Your Budget</p>
                <p className="mt-1 text-xl font-bold text-[#1a1a2e]">{fmt(wizard.budgetAmount)}</p>
              </div>
            )}
          </div>

          {/* Breakdown table + pie */}
          <div className="flex items-start gap-8">
            {/* Table */}
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

            {/* Pie chart */}
            <div className="shrink-0">
              <PieChart segments={pieSegments} size={180} />
            </div>
          </div>

          {/* Rationale */}
          <p className="mt-5 border-t border-[#e8e6e1] pt-4 text-xs italic leading-relaxed text-[#6a6a7a]">
            {budgetGraph.rationale}
          </p>

          {/* Disclaimer */}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#d4a24c]/30 bg-[#fef9ee] px-4 py-3">
            <FaCircleExclamation className="mt-0.5 shrink-0 text-xs text-[#d4a24c]" />
            <p className="text-[11px] leading-relaxed text-[#6a6a7a]">
              <span className="font-semibold text-[#4a4a5a]">Disclaimer:</span> These figures are{" "}
              <span className="font-semibold">estimates only</span> based on typical market rates and may vary depending on your location, contractor, materials chosen, and project complexity. Always obtain multiple quotes before committing.
            </p>
          </div>

          {/* Item-level breakdown */}
          {budgetGraph.itemBreakdown.length > 0 && (
            <div className="mt-6 border-t border-[#e8e6e1] pt-5">
              <h4 className="mb-3 text-sm font-bold text-[#1a1a2e]">Item Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e8e6e1] text-[10px] font-semibold uppercase tracking-wide text-[#6a6a7a]">
                      <th className="py-2">Item</th>
                      <th className="py-2 text-right">Material</th>
                      <th className="py-2 text-right">Labor</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetGraph.itemBreakdown.map((item) => {
                      const matFixed = item.materialLow === item.materialHigh;
                      const labFixed = item.laborLow === item.laborHigh;
                      const totFixed = item.totalLow === item.totalHigh;
                      return (
                        <tr key={item.label} className="border-b border-[#e8e6e1]/50 hover:bg-[#f8f7f4] transition">
                          <td className="py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${item.source === "must-have" ? "bg-[#2d5a3d]" : "bg-[#d4a24c]"}`} />
                              <span className="text-[#1a1a2e]">{item.label}</span>
                              {item.overridden && (
                                <span className="shrink-0 rounded bg-[#2d5a3d]/10 px-1 py-0.5 text-[8px] font-semibold text-[#2d5a3d]">REAL</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 text-right text-[#6a6a7a]">
                            {matFixed ? fmt(item.materialLow) : `${fmt(item.materialLow)}–${fmt(item.materialHigh)}`}
                          </td>
                          <td className="py-2.5 text-right text-[#6a6a7a]">
                            {labFixed ? fmt(item.laborLow) : `${fmt(item.laborLow)}–${fmt(item.laborHigh)}`}
                          </td>
                          <td className="py-2.5 text-right font-medium text-[#1a1a2e]">
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
        </Section>

        {/* Footer */}
        <div className="mt-12 border-t border-[#e8e6e1] pt-6 text-center">
          <p className="text-xs text-[#9a9aaa]">
            Generated by Before The Build • {new Date().toLocaleDateString()} • For planning purposes only
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Shared Components ── */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 rounded-2xl border border-[#e8e6e1] bg-white p-6 shadow-sm print:break-inside-avoid">
      <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-[#1a1a2e]">
        <span className="text-[#2d5a3d]">{icon}</span> {title}
      </h2>
      {children}
    </div>
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
