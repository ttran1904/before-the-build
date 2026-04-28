"use client";

import { useMemo, useState } from "react";
import {
  FaThLarge,
  FaPalette,
  FaStore,
  FaCouch,
  FaClock,
  FaLightbulb,
} from "react-icons/fa";
import {
  STORES,
  STORE_CATEGORY_ORDER,
  getStoreLogoUrl,
  type Store,
  type StoreCategory,
} from "@/lib/catalogue/stores";

interface StoreSelectorProps {
  onSelect: (store: Store) => void;
}

type Filter = "All" | StoreCategory;

const FILTER_ICON: Record<Filter, React.ReactNode> = {
  "All":                       <FaThLarge />,
  "Curated for you":           <FaPalette />,
  "Big-box & DIY":             <FaStore />,
  "Modern furniture & decor":  <FaCouch />,
  "Vintage & artisan":         <FaClock />,
  "Lighting specialists":      <FaLightbulb />,
};

function storeInitials(name: string): string {
  return name
    .replace(/&/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function StoreTile({ store, onSelect }: { store: Store; onSelect: (s: Store) => void }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = getStoreLogoUrl(store);
  const showLogo = logoUrl && !logoFailed;
  const isComingSoon = store.status === "coming_soon";

  return (
    <button
      onClick={() => onSelect(store)}
      className="group flex flex-col items-center text-center"
    >
      <div
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-[#e8e6e1] transition group-hover:-translate-y-0.5 group-hover:border-[#2d5a3d] group-hover:shadow-md"
        style={{ backgroundColor: store.accent }}
      >
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl!}
            alt={`${store.name} logo`}
            onError={() => setLogoFailed(true)}
            className="max-h-[65%] max-w-[80%] object-contain"
          />
        ) : (
          <span className="text-xl font-bold tracking-tight text-[#1a1a2e]">
            {storeInitials(store.name)}
          </span>
        )}
        {isComingSoon && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#7a7a8a]">
            Soon
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-1 w-full text-[12px] font-semibold text-[#1a1a2e]">
        {store.name}
      </p>
      {store.scaffold && (
        <p className="text-[10px] text-[#9a9aaa]">{store.scaffold.priceTier}</p>
      )}
    </button>
  );
}

export default function StoreSelector({ onSelect }: StoreSelectorProps) {
  const [filter, setFilter] = useState<Filter>("All");

  const filters: Filter[] = ["All", ...STORE_CATEGORY_ORDER];

  const visibleStores = useMemo(
    () => (filter === "All" ? STORES : STORES.filter((s) => s.category === filter)),
    [filter]
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold text-[#1a1a2e]">Pick a store</h2>
        <p className="text-xs text-[#7a7a8a]">
          Browse curated bathroom items by retailer.
        </p>
      </div>

      {/* Centered, rounded-square filter chips with icons */}
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {filters.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? "border-[#2d5a3d] bg-[#2d5a3d] text-white shadow-sm"
                  : "border-[#e8e6e1] bg-white text-[#4a4a5a] hover:border-[#2d5a3d] hover:text-[#2d5a3d]"
              }`}
            >
              <span className={`text-sm ${active ? "text-white" : "text-[#7a7a8a]"}`}>
                {FILTER_ICON[f]}
              </span>
              {f}
            </button>
          );
        })}
      </div>

      {/* True grid: wraps onto multiple rows. Caps out at ~5 cols on big screens. */}
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visibleStores.map((store) => (
          <StoreTile key={store.id} store={store} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
