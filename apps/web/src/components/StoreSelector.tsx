"use client";

import { useMemo, useState } from "react";
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
            className="max-h-[60%] max-w-[75%] object-contain"
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
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-[#1a1a2e]">Pick a store</h2>
        <p className="text-xs text-[#7a7a8a]">
          Browse curated bathroom items by retailer.
        </p>
      </div>

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {filters.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-[#2d5a3d] bg-[#2d5a3d] text-white"
                  : "border-[#e8e6e1] bg-white text-[#4a4a5a] hover:border-[#2d5a3d] hover:text-[#2d5a3d]"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {visibleStores.map((store) => (
          <StoreTile key={store.id} store={store} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
