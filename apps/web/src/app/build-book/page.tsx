"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaArrowLeft, FaFilePdf, FaPrint, FaSpinner, FaCheck,
  FaChartPie, FaHammer, FaClock, FaImages, FaCartShopping,
} from "react-icons/fa6";
import { useWizardStore, useMoodboardStore } from "@/lib/store";

/* ── Helpers ── */

const SCOPE_LABELS: Record<string, string> = {
  cosmetic: "Cosmetic Refresh",
  partial: "Partial Renovation",
  full: "Full Renovation",
  addition: "Room Addition",
};

const BUDGET_LABELS: Record<string, string> = {
  basic: "Budget-Friendly",
  mid: "Mid-Range",
  high: "High-End",
};

const BUDGET_RANGES: Record<string, Record<string, string>> = {
  small: { basic: "$3,000 – $6,000", mid: "$8,000 – $15,000", high: "$20,000 – $35,000" },
  medium: { basic: "$5,000 – $10,000", mid: "$15,000 – $25,000", high: "$30,000 – $50,000" },
  large: { basic: "$8,000 – $15,000", mid: "$20,000 – $35,000", high: "$40,000 – $75,000" },
};

interface Task {
  name: string;
  phase: string;
  duration_days: number;
  status: string;
}

export default function BuildBookPage() {
  const wizard = useWizardStore();
  const moodboard = useMoodboardStore();
  const bookRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const budgetRange = BUDGET_RANGES[wizard.bathroomSize]?.[wizard.budgetTier || "mid"] || "–";

  /* Generate AI summary */
  const generateSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/ai/budget-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: wizard.goal,
          scope: wizard.scope,
          mustHaves: wizard.mustHaves,
          niceToHaves: wizard.niceToHaves,
          budgetTier: wizard.budgetTier,
          bathroomSize: wizard.bathroomSize,
          style: wizard.style,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch {
      setAiSummary("Unable to generate summary. Please ensure your project details are complete.");
    }
    setLoadingSummary(false);
  }, [wizard]);

  /* Fetch tasks */
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: wizard.scope || "full",
          goal: wizard.goal || "update_style",
          budgetTier: wizard.budgetTier || "mid",
        }),
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      setTasks([]);
    }
    setLoadingTasks(false);
  }, [wizard]);

  useEffect(() => {
    if (wizard.goal) {
      generateSummary();
      fetchTasks();
    }
  }, [wizard.goal, generateSummary, fetchTasks]);

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

  const totalDays = tasks.reduce((sum, t) => sum + t.duration_days, 0);
  const phases = [...new Set(tasks.map((t) => t.phase))];
  const savedItems = moodboard.items.filter((i) => i.saved);

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#e8e6e1] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/renovate/bathroom/timeline" className="flex items-center gap-2 text-sm text-[#6a6a7a] hover:text-[#1a1a2e]">
            <FaArrowLeft className="text-xs" /> Back to Timeline
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
        </div>

        {/* Project Overview */}
        <Section icon={<FaChartPie />} title="Project Overview">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoCard label="Goal" value={wizard.goal ? wizard.goal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Not set"} />
            <InfoCard label="Scope" value={SCOPE_LABELS[wizard.scope || ""] || "Not set"} />
            <InfoCard label="Budget" value={BUDGET_LABELS[wizard.budgetTier || ""] || "Not set"} />
            <InfoCard label="Budget Range" value={budgetRange} />
          </div>
        </Section>

        {/* AI Summary */}
        <Section icon={<FaHammer />} title="AI Project Summary">
          {loadingSummary ? (
            <div className="flex items-center gap-3 py-4">
              <FaSpinner className="animate-spin text-[#2d5a3d]" />
              <span className="text-sm text-[#6a6a7a]">Generating project summary...</span>
            </div>
          ) : aiSummary ? (
            <p className="leading-relaxed text-[#4a4a5a]">{aiSummary}</p>
          ) : (
            <p className="text-sm text-[#9a9aaa]">Complete the questionnaire to generate an AI summary.</p>
          )}
        </Section>

        {/* Must-Haves & Nice-to-Haves */}
        {(wizard.mustHaves.length > 0 || wizard.niceToHaves.length > 0) && (
          <Section icon={<FaCheck />} title="Features & Fixtures">
            <div className="grid gap-6 sm:grid-cols-2">
              {wizard.mustHaves.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#2d5a3d]">Must-Haves</h4>
                  <ul className="space-y-1.5">
                    {wizard.mustHaves.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-[#4a4a5a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2d5a3d]" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {wizard.niceToHaves.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6a6a7a]">Nice-to-Haves</h4>
                  <ul className="space-y-1.5">
                    {wizard.niceToHaves.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-[#6a6a7a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9a9aaa]" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Moodboard */}
        {savedItems.length > 0 && (
          <Section icon={<FaImages />} title={`Design Inspiration (${savedItems.length} saved)`}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {savedItems.slice(0, 10).map((item) => (
                <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Inspiration"}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              ))}
              {savedItems.length > 10 && (
                <div className="flex aspect-square items-center justify-center rounded-lg bg-[#f3f2ef] text-sm font-medium text-[#6a6a7a]">
                  +{savedItems.length - 10} more
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Budget Breakdown */}
        <Section icon={<FaCartShopping />} title="Budget Summary">
          <div className="rounded-xl border border-[#e8e6e1] bg-[#f8f7f4] p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#6a6a7a]">Room Size</p>
                <p className="text-sm font-semibold text-[#1a1a2e] capitalize">{wizard.bathroomSize || "Medium"}</p>
              </div>
              <div>
                <p className="text-xs text-[#6a6a7a]">Budget Tier</p>
                <p className="text-sm font-semibold text-[#1a1a2e]">{BUDGET_LABELS[wizard.budgetTier || ""] || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-[#6a6a7a]">Estimated Range</p>
                <p className="text-lg font-bold text-[#2d5a3d]">{budgetRange}</p>
              </div>
              <div>
                <p className="text-xs text-[#6a6a7a]">Renovation Type</p>
                <p className="text-sm font-semibold text-[#1a1a2e]">{SCOPE_LABELS[wizard.scope || ""] || "Not set"}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Timeline */}
        <Section icon={<FaClock />} title="Project Timeline">
          {loadingTasks ? (
            <div className="flex items-center gap-3 py-4">
              <FaSpinner className="animate-spin text-[#2d5a3d]" />
              <span className="text-sm text-[#6a6a7a]">Loading timeline...</span>
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex gap-6 text-sm">
                <span className="text-[#6a6a7a]">Total tasks: <strong className="text-[#1a1a2e]">{tasks.length}</strong></span>
                <span className="text-[#6a6a7a]">Est. duration: <strong className="text-[#1a1a2e]">{Math.ceil(totalDays / 7)} weeks</strong></span>
              </div>
              {phases.map((phase) => {
                const phaseTasks = tasks.filter((t) => t.phase === phase);
                const phaseDays = phaseTasks.reduce((sum, t) => sum + t.duration_days, 0);
                return (
                  <div key={phase} className="rounded-lg border border-[#e8e6e1] bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#1a1a2e]">{phase}</h4>
                      <span className="text-xs text-[#9a9aaa]">{phaseDays} days</span>
                    </div>
                    <ul className="space-y-1">
                      {phaseTasks.map((t) => (
                        <li key={t.name} className="flex items-center justify-between text-xs text-[#4a4a5a]">
                          <span>{t.name}</span>
                          <span className="text-[#9a9aaa]">{t.duration_days}d</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#9a9aaa]">No tasks generated yet.</p>
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
    <div className="mb-6 rounded-2xl border border-[#e8e6e1] bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1a1a2e]">
        <span className="text-[#2d5a3d]">{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e8e6e1] bg-[#f8f7f4] p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#9a9aaa]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1a1a2e]">{value}</p>
    </div>
  );
}
