"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { WizardTab } from "./types";

interface WizardChromeProps {
  tabs: WizardTab[];
  activeTab: string;
  brandTitle?: string;
  backHref?: string;
  onBack?: () => void;
  onSaveExit?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Hide the bottom Next button (e.g. when the answer auto-advances on click). */
  hideNext?: boolean;
  children: ReactNode;
}

export function WizardChrome({
  tabs,
  activeTab,
  brandTitle,
  backHref = "/dashboard",
  onBack,
  onSaveExit,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  hideNext = false,
  children,
}: WizardChromeProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="border-b border-[#ece9e3] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-6">
          <div className="flex-1 text-sm font-semibold tracking-wide text-[#1a1a2e]">
            {brandTitle ?? "Before the Build"}
          </div>
          <nav className="flex gap-10">
            {tabs.map((t) => {
              const active = t.id === activeTab;
              return (
                <span
                  key={t.id}
                  className={`relative pb-3 pt-3 text-sm transition ${
                    active ? "font-semibold text-[#1a1a2e]" : "text-[#9a9890]"
                  }`}
                >
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

      {/* ── Sub-bar: Back / Save & Exit ─────────────────────────── */}
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-8 text-sm">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-[#6a6a7a] transition hover:text-[#1a1a2e]"
          >
            &lt; Back
          </button>
        ) : (
          <Link
            href={backHref}
            className="text-[#6a6a7a] transition hover:text-[#1a1a2e]"
          >
            &lt; Back
          </Link>
        )}
        {onSaveExit ? (
          <button
            onClick={onSaveExit}
            className="text-[#6a6a7a] underline transition hover:text-[#1a1a2e]"
          >
            Save &amp; Exit
          </button>
        ) : (
          <Link
            href={backHref}
            className="text-[#6a6a7a] underline transition hover:text-[#1a1a2e]"
          >
            Save &amp; Exit
          </Link>
        )}
      </div>

      {/* ── Centered question area ──────────────────────────────── */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-12 pt-12">
        {children}
      </main>

      {/* ── Single primary action ───────────────────────────────── */}
      {!hideNext && (
        <div className="mx-auto flex w-full max-w-3xl justify-end px-6 pb-12">
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="rounded-full bg-[#c08a5a] px-10 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#a87445] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
