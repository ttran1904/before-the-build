"use client";

import Image from "next/image";
import { HOME_DEPOT_COLLECTIONS, type HDCollection } from "@/lib/catalogue/home-depot-collections";

interface CollectionGridProps {
  onSelect: (collection: HDCollection) => void;
}

export default function CollectionGrid({ onSelect }: CollectionGridProps) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {HOME_DEPOT_COLLECTIONS.map((col) => (
        <button
          key={col.id}
          onClick={() => onSelect(col)}
          className="group overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white text-left shadow-sm transition hover:shadow-md"
        >
          {/* Image */}
          <div className="relative h-44 w-full overflow-hidden">
            <Image
              src={col.image}
              alt={col.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          </div>

          {/* Info */}
          <div className="px-4 py-3">
            <h3 className="text-sm font-bold text-[#1a1a2e] leading-tight">
              {col.name}
            </h3>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-[#7a7a8a]">
              <span className="rounded-full bg-[#f3f2ef] px-2.5 py-0.5 font-medium text-[#4a4a5a]">
                {col.style}
              </span>
              <span>Bathroom</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
