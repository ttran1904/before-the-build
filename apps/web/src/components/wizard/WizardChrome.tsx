"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import type { WizardTab } from "./types";

interface WizardChromeProps {
  tabs: WizardTab[];
  activeTab: string;
  /** Tabs the user is allowed to jump back to (already visited). */
  visitedTabs?: string[];
  onTabClick?: (tabId: string) => void;
  brandTitle?: string;
  backHref?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Optional warning text shown next to the Next button (e.g. "Pick an answer to continue."). */
  nextWarning?: string;
  /** Hide the bottom Next button (e.g. when the answer auto-advances on click). */
  hideNext?: boolean;
  /** When true, replace question area with a centered loading state. */
  finishing?: boolean;
  /** Loading label shown while finishing. */
  finishingLabel?: string;
  children: ReactNode;
}

export function WizardChrome({
  tabs,
  activeTab,
  visitedTabs = [],
  onTabClick,
  brandTitle,
  backHref = "/dashboard",
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  nextWarning,
  hideNext = false,
  finishing = false,
  finishingLabel = "Generating your scope…",
  children,
}: WizardChromeProps) {
  const visited = new Set(visitedTabs);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Top bar: Back icon · brand · clickable tab nav ─────── */}
      <header className="border-b border-[#ece9e3] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-6">
          <Link
            href={backHref}
            className="flex flex-none items-center gap-2 rounded-full bg-[#f0ede8] px-4 py-1.5 text-xs font-semibold text-[#1a1a2e] transition hover:bg-[#e8e6e1]"
          >
            <FaArrowLeft className="text-xs" />
            <span>Dashboard</span>
          </Link>
          <div className="flex-1 text-sm font-semibold tracking-wide text-[#1a1a2e]">
            {brandTitle ?? "Before the Build"}
          </div>
          <nav className="flex gap-10">
            {tabs.map((t) => {
              const active = t.id === activeTab;
              const accessible = active || visited.has(t.id);
              const className = `relative pb-3 pt-3 text-sm transition ${
                active
                  ? "font-semibold text-[#1a1a2e]"
                  : accessible
                  ? "text-[#4a4a5a] hover:text-[#1a1a2e] cursor-pointer"
                  : "text-[#bdbab0] cursor-not-allowed"
              }`;
              return accessible && !active && onTabClick ? (
                <button key={t.id} onClick={() => onTabClick(t.id)} className={className}>
                  {t.label}
                </button>
              ) : (
                <span key={t.id} className={className} aria-current={active ? "step" : undefined}>
                  {t.label}
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#1a1a2e]" />
                  )}
                </span>
              );
            })}
          </nav>
          <div className="flex-1" />
        </div>
      </header>

      {/* ── Centered question area (autosaves silently) ───────── */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-stretch justify-center px-6 pb-12 pt-12">
        {finishing ? (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e8e6e1] border-t-[#c08a5a]" />
            <p className="font-serif text-2xl text-[#1a1a2e]">{finishingLabel}</p>
            <p className="text-sm text-[#6a6a7a]">
              Compiling your answers into a contractor-ready scope.
            </p>
          </div>
        ) : (
          children
        )}
      </main>

      {/* ── Step navigation: Back (left) · Next (right) ─────────── */}
      {!finishing && (
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pb-12">
        {onBack ? (
          <button
            onClick={onBack}
            className="rounded-full bg-[#e8e6e1] px-8 py-3 text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#d5d3cd]"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {!hideNext ? (
          <div className="flex flex-col items-end gap-2">
            {nextWarning && (
              <p className="text-xs font-medium text-[#c08a5a]">{nextWarning}</p>
            )}
            <button
              onClick={onNext}
              aria-disabled={nextDisabled}
              className={`rounded-full bg-[#c08a5a] px-10 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#a87445] ${
                nextDisabled ? "opacity-40" : ""
              }`}
            >
              {nextLabel}
            </button>
          </div>
        ) : (
          <span />
        )}
      </div>
      )}
    </div>
  );
}