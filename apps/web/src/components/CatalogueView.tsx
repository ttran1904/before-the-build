"use client";

import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import CollectionGrid from "@/components/CollectionGrid";
import CollectionDetail from "@/components/CollectionDetail";
import AirtableMaterialsGrid from "@/components/AirtableMaterialsGrid";
import StoreSelector from "@/components/StoreSelector";
import ComingSoonStore from "@/components/ComingSoonStore";
import type { HDCollection } from "@/lib/catalogue/home-depot-collections";
import type { Store } from "@/lib/catalogue/stores";
import type { Product } from "@before-the-build/shared";

interface CatalogueViewProps {
  selectedProducts?: Product[];
  onToggleProduct?: (product: Product) => void;
}

export default function CatalogueView({ selectedProducts = [], onToggleProduct }: CatalogueViewProps) {
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [activeCollection, setActiveCollection] = useState<HDCollection | null>(null);

  // ── Step 1: no store picked → show the storefront grid ──
  if (!activeStore) {
    return <StoreSelector onSelect={setActiveStore} />;
  }

  // Helper: back-button row used at the top of every drilled-in view
  const BackBar = ({ onBack, label }: { onBack: () => void; label: string }) => (
    <button
      onClick={onBack}
      className="mb-6 flex items-center gap-2 text-sm font-medium text-[#2d5a3d] transition hover:text-[#234a31]"
    >
      <FaArrowLeft className="text-xs" />
      {label}
    </button>
  );

  // ── Step 3: a Home Depot collection was opened from the store view ──
  if (activeCollection) {
    return (
      <div>
        <BackBar onBack={() => setActiveCollection(null)} label="Back to Collections" />
        <CollectionDetail
          collection={activeCollection}
          selectedProducts={selectedProducts}
          onToggleProduct={onToggleProduct}
        />
      </div>
    );
  }

  // ── Step 2: a store was picked → render the right product surface ──
  const renderStoreContent = () => {
    switch (activeStore.id) {
      case "home_depot":
        return <CollectionGrid onSelect={setActiveCollection} />;
      case "in_house":
        return (
          <AirtableMaterialsGrid
            selectedProducts={selectedProducts}
            onToggleProduct={onToggleProduct}
          />
        );
      default:
        return <ComingSoonStore store={activeStore} />;
    }
  };

  return (
    <div>
      <BackBar
        onBack={() => {
          setActiveCollection(null);
          setActiveStore(null);
        }}
        label="Back to Stores"
      />
      {renderStoreContent()}
    </div>
  );
}
