"use client";

import { useState } from "react";
import { FaArrowUpRightFromSquare, FaCircleInfo } from "react-icons/fa6";
import { getStoreLogoUrl, type Store } from "@/lib/catalogue/stores";

interface ComingSoonStoreProps {
  store: Store;
}

/**
 * Placeholder view shown for stores whose product pipeline isn't wired up yet.
 * Documents — for both the user and future engineers — exactly what categories
 * we plan to surface, the brand's style vibe, and how we plan to fetch data.
 */
export default function ComingSoonStore({ store }: ComingSoonStoreProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const scaffold = store.scaffold;
  if (!scaffold) return null;

  const logoUrl = getStoreLogoUrl(store);
  const showLogo = logoUrl && !logoFailed;

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: store.accent }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            {showLogo && (
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl!}
                  alt={`${store.name} logo`}
                  onError={() => setLogoFailed(true)}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7a7a8a]">
                {store.category} · {scaffold.priceTier}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#1a1a2e]">{store.name}</h2>
              <p className="mt-2 max-w-2xl text-sm text-[#4a4a5a]">{store.tagline}</p>
            </div>
          </div>
          <a
            href={scaffold.bathLandingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#1a1a2e] shadow-sm transition hover:bg-[#f9f8f6]"
          >
            Visit {store.name}
            <FaArrowUpRightFromSquare className="text-[10px]" />
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {scaffold.styleVibes.map((vibe) => (
            <span
              key={vibe}
              className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#4a4a5a]"
            >
              {vibe}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#e8e6e1] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-[#1a1a2e]">
            What we&apos;ll surface
          </h3>
          <ul className="space-y-2 text-sm text-[#4a4a5a]">
            {scaffold.expectedCategories.map((cat) => (
              <li key={cat} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2d5a3d]" />
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-dashed border-[#d5d3cd] bg-[#f9f8f6] p-5">
          <div className="mb-3 flex items-center gap-2">
            <FaCircleInfo className="text-xs text-[#7a7a8a]" />
            <h3 className="text-sm font-semibold text-[#1a1a2e]">Integration plan</h3>
          </div>
          <p className="text-sm leading-relaxed text-[#4a4a5a]">{scaffold.integrationNote}</p>
          <div className="mt-4 rounded-lg bg-white p-3 text-xs text-[#7a7a8a]">
            <p className="font-semibold text-[#4a4a5a]">Bath landing page</p>
            <a
              href={scaffold.bathLandingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-mono text-[#2d5a3d] hover:underline"
            >
              {scaffold.bathLandingUrl}
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e8e6e1] bg-white p-6 text-center">
        <p className="text-sm font-semibold text-[#1a1a2e]">
          Live products from {store.name} are on the way.
        </p>
        <p className="mt-1 text-xs text-[#7a7a8a]">
          In the meantime, browse Home Depot collections or your in-house designer&apos;s picks.
        </p>
      </div>
    </div>
  );
}
