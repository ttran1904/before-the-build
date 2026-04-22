"use client";

import { FaPalette, FaStore, FaCouch, FaClockRotateLeft, FaLightbulb, FaArrowRight } from "react-icons/fa6";
import { groupStoresByCategory, type Store, type StoreCategory } from "@/lib/catalogue/stores";

interface StoreSelectorProps {
  onSelect: (store: Store) => void;
}

const CATEGORY_ICON: Record<StoreCategory, React.ReactNode> = {
  "Curated for you":           <FaPalette className="text-xs" />,
  "Big-box & DIY":             <FaStore className="text-xs" />,
  "Modern furniture & decor":  <FaCouch className="text-xs" />,
  "Vintage & artisan":         <FaClockRotateLeft className="text-xs" />,
  "Lighting specialists":      <FaLightbulb className="text-xs" />,
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

function StoreCard({ store, onSelect }: { store: Store; onSelect: (s: Store) => void }) {
  const isComingSoon = store.status === "coming_soon";
  return (
    <button
      onClick={() => onSelect(store)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2d5a3d] hover:shadow-md"
    >
      {/* Tile / logo area */}
      <div
        className="flex h-28 items-center justify-center"
        style={{ backgroundColor: store.accent }}
      >
        {store.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logo} alt={store.name} className="max-h-14 max-w-[70%] object-contain" />
        ) : (
          <span className="text-2xl font-bold tracking-tight text-[#1a1a2e]">
            {storeInitials(store.name)}
          </span>
        )}
        {isComingSoon && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a7a8a]">
            Coming soon
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-[#1a1a2e]">{store.name}</h4>
          <FaArrowRight className="mt-1 text-[10px] text-[#9a9aaa] transition group-hover:translate-x-0.5 group-hover:text-[#2d5a3d]" />
        </div>
        <p className="line-clamp-2 text-xs leading-snug text-[#7a7a8a]">{store.tagline}</p>
        {store.scaffold && (
          <p className="mt-1 text-[10px] font-medium text-[#9a9aaa]">
            {store.scaffold.priceTier} · {store.scaffold.styleVibes.slice(0, 2).join(" · ")}
          </p>
        )}
      </div>
    </button>
  );
}

export default function StoreSelector({ onSelect }: StoreSelectorProps) {
  const groups = groupStoresByCategory();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[#1a1a2e]">Pick a store</h2>
        <p className="mt-1 text-sm text-[#7a7a8a]">
          Browse curated bathroom items by retailer. Tap a store to see their collections.
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.category}>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f3f2ef] text-[#2d5a3d]">
              {CATEGORY_ICON[group.category]}
            </span>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4a4a5a]">
              {group.category}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {group.stores.map((store) => (
              <StoreCard key={store.id} store={store} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
