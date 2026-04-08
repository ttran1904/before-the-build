"use client";

import { useState } from "react";
import { FaStore, FaPalette, FaArrowLeft } from "react-icons/fa6";
import CollectionGrid from "@/components/CollectionGrid";
import CollectionDetail from "@/components/CollectionDetail";
import AirtableMaterialsGrid from "@/components/AirtableMaterialsGrid";
import type { HDCollection } from "@/lib/catalogue/home-depot-collections";
import type { Product } from "@/lib/moodboard/types";

type CatalogueSource = "home_depot" | "designer";

interface CatalogueViewProps {
  selectedProducts?: Product[];
  onToggleProduct?: (product: Product) => void;
}

export default function CatalogueView({ selectedProducts = [], onToggleProduct }: CatalogueViewProps) {
  const [source, setSource] = useState<CatalogueSource>("home_depot");
  const [activeCollection, setActiveCollection] = useState<HDCollection | null>(null);

  // When a Home Depot collection card is clicked → show its products
  if (activeCollection) {
    return (
      <div>
        <button
          onClick={() => setActiveCollection(null)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#2d5a3d] transition hover:text-[#234a31]"
        >
          <FaArrowLeft className="text-xs" />
          Back to Collections
        </button>
        <CollectionDetail collection={activeCollection} selectedProducts={selectedProducts} onToggleProduct={onToggleProduct} />
      </div>
    );
  }

  return (
    <div>
      {/* Source Toggle */}
      <div className="mb-6 flex items-center gap-2">
        <div className="inline-flex rounded-xl border border-[#e8e6e1] bg-[#f9f8f6] p-1">
          <button
            onClick={() => setSource("home_depot")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              source === "home_depot"
                ? "bg-white text-[#1a1a2e] shadow-sm"
                : "text-[#7a7a8a] hover:text-[#4a4a5a]"
            }`}
          >
            <FaStore className="text-xs" />
            Home Depot
          </button>
          <button
            onClick={() => setSource("designer")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              source === "designer"
                ? "bg-white text-[#1a1a2e] shadow-sm"
                : "text-[#7a7a8a] hover:text-[#4a4a5a]"
            }`}
          >
            <FaPalette className="text-xs" />
            Designer Picks
          </button>
        </div>

        <p className="ml-3 text-xs text-[#9a9aaa]">
          {source === "home_depot"
            ? "Browse curated bathroom collections from Home Depot"
            : "Materials hand-picked by your in-house designer"}
        </p>
      </div>

      {/* Content */}
      {source === "home_depot" ? (
        <CollectionGrid onSelect={setActiveCollection} />
      ) : (
        <AirtableMaterialsGrid />
      )}
    </div>
  );
}
