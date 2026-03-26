"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaArrowRotateRight, FaChevronDown, FaChevronRight, FaArrowLeft,
  FaCartShopping, FaStar, FaWandMagicSparkles, FaArrowRight,
} from "react-icons/fa6";
import { useWizardStore } from "@/lib/store";

interface GeneratedImage {
  id: string;
  url: string;
  angle: string;
  prompt?: string;
}

interface Product {
  id: string;
  title: string;
  price: string;
  extractedPrice: number;
  source: string;
  thumbnail: string;
  rating: number;
  reviews: number;
  link: string;
  storeLogo: string;
}

const ANGLES = [
  { id: "full", label: "Full Room View", desc: "From the doorway" },
  { id: "vanity", label: "Vanity Area", desc: "Sink & mirror close-up" },
  { id: "shower", label: "Shower/Tub", desc: "Shower area detail" },
  { id: "detail", label: "Detail Shot", desc: "Fixtures & finishes" },
];

const CATEGORIES = [
  { id: "vanity", label: "Vanity & Sink", icon: "🪞" },
  { id: "toilet", label: "Toilet", icon: "🚽" },
  { id: "shower", label: "Shower / Tub", icon: "🚿" },
  { id: "tile", label: "Tile & Flooring", icon: "🏗️" },
  { id: "fixtures", label: "Fixtures", icon: "🔧" },
  { id: "lighting", label: "Lighting", icon: "💡" },
  { id: "mirror", label: "Mirror & Cabinet", icon: "🪟" },
  { id: "accessories", label: "Accessories", icon: "🧴" },
];

export default function VisualizePage() {
  const store = useWizardStore();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const [activeCategory, setActiveCategory] = useState("vanity");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>("vanity");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const generateImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const res = await fetch("/api/ai/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: store.style || "modern",
          scope: store.scope || "full",
          mustHaves: store.mustHaves,
          budgetTier: store.budgetTier || "mid",
          bathroomSize: store.bathroomSize,
        }),
      });
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      setImages([]);
    }
    setLoadingImages(false);
  }, [store.style, store.scope, store.mustHaves, store.budgetTier, store.bathroomSize]);

  const fetchProducts = useCallback(async (category: string) => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        category,
        budget: store.budgetTier || "mid",
        style: store.style || "",
      });
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    }
    setLoadingProducts(false);
  }, [store.budgetTier, store.style]);

  useEffect(() => {
    generateImages();
  }, [generateImages]);

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory, fetchProducts]);

  const totalCost = selectedProducts.reduce((sum, p) => sum + p.extractedPrice, 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f4]">
      {/* Header */}
      <header className="border-b border-[#e8e6e1] bg-white px-6 py-3">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <Link href="/renovate/bathroom" className="flex items-center gap-2 text-sm text-[#6a6a7a] hover:text-[#1a1a2e]">
            <FaArrowLeft className="text-xs" /> Back to Questionnaire
          </Link>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-[#2d5a3d]/10 px-3 py-1 text-xs font-medium text-[#2d5a3d]">
              {store.style || "Modern"} • {store.budgetTier || "Mid"}-Range • {store.scope || "Full"} Remodel
            </span>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#234a31]"
            >
              Continue to Timeline <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main content: images + side panel */}
      <div className="flex flex-1">
        {/* Left: Room Visualization */}
        <div className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1a1a2e]">Your Bathroom Design</h1>
            <button
              onClick={generateImages}
              disabled={loadingImages}
              className="flex items-center gap-2 rounded-lg border border-[#d5d3cd] bg-white px-4 py-2 text-sm font-medium text-[#4a4a5a] transition hover:bg-[#f8f7f4] disabled:opacity-50"
            >
              <FaArrowRotateRight className={`text-xs ${loadingImages ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>

          {/* Main image */}
          <div className="relative mb-4 aspect-square max-h-[520px] w-full overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white shadow-lg">
            {loadingImages ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-[#2d5a3d] border-t-transparent" />
                  <p className="text-sm text-[#6a6a7a]">Generating your bathroom design...</p>
                </div>
              </div>
            ) : images.length > 0 ? (
              <Image
                src={images[activeImage]?.url || ""}
                alt={images[activeImage]?.angle || "Room visualization"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-[#6a6a7a]">No images generated yet</p>
              </div>
            )}
          </div>

          {/* Angle selector thumbnails */}
          <div className="flex gap-3">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === activeImage ? "border-[#2d5a3d] shadow-md" : "border-[#e8e6e1]"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.angle}
                  fill
                  className="object-cover"
                  sizes="112px"
                  unoptimized
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1">
                  <span className="text-[10px] font-medium text-white">
                    {ANGLES[i]?.label || img.angle}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Materials Side Panel */}
        <aside className="w-[420px] shrink-0 overflow-y-auto border-l border-[#e8e6e1] bg-white">
          {/* Panel header */}
          <div className="sticky top-0 z-10 border-b border-[#e8e6e1] bg-white p-4">
            <div className="flex items-center gap-2">
              <FaCartShopping className="text-[#2d5a3d]" />
              <h2 className="text-lg font-bold text-[#1a1a2e]">Materials & Products</h2>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="rounded-full bg-[#2d5a3d]/10 px-2 py-1 text-[#2d5a3d]">
                💰 {store.budgetTier || "Mid"}-Range
              </span>
              <span className="rounded-full bg-[#f8f7f4] px-2 py-1 text-[#4a4a5a]">
                🎨 {store.style || "Modern"}
              </span>
            </div>
          </div>

          {/* Category accordion */}
          <div className="divide-y divide-[#e8e6e1]">
            {CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() => {
                    setExpandedCat(expandedCat === cat.id ? null : cat.id);
                    setActiveCategory(cat.id);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f8f7f4]"
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="flex-1 text-sm font-medium text-[#1a1a2e]">{cat.label}</span>
                  {expandedCat === cat.id ? (
                    <FaChevronDown className="text-xs text-[#9a9aaa]" />
                  ) : (
                    <FaChevronRight className="text-xs text-[#9a9aaa]" />
                  )}
                </button>

                {expandedCat === cat.id && (
                  <div className="px-4 pb-4">
                    {loadingProducts ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="flex animate-pulse gap-3">
                            <div className="h-16 w-16 shrink-0 rounded-lg bg-[#f3f2ef]" />
                            <div className="flex-1 space-y-2 py-1">
                              <div className="h-3 w-3/4 rounded bg-[#f3f2ef]" />
                              <div className="h-3 w-1/2 rounded bg-[#f3f2ef]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {products.map((product) => {
                          const isSelected = selectedProducts.some((p) => p.id === product.id);
                          return (
                            <div
                              key={product.id}
                              className={`flex gap-3 rounded-xl border p-3 transition ${
                                isSelected ? "border-[#2d5a3d] bg-[#2d5a3d]/5" : "border-[#e8e6e1] hover:border-[#d5d3cd]"
                              }`}
                            >
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                                <Image
                                  src={product.thumbnail}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-medium text-[#1a1a2e]">
                                  {product.title}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-sm font-bold text-[#2d5a3d]">{product.price}</span>
                                  <span className="text-[10px]">{product.storeLogo}</span>
                                  <span className="text-[10px] text-[#6a6a7a]">{product.source}</span>
                                </div>
                                {product.rating > 0 && (
                                  <div className="mt-1 flex items-center gap-1">
                                    <FaStar className="text-[10px] text-yellow-500" />
                                    <span className="text-[10px] text-[#6a6a7a]">
                                      {product.rating} ({product.reviews})
                                    </span>
                                  </div>
                                )}
                                <button
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
                                    } else {
                                      setSelectedProducts([...selectedProducts, product]);
                                    }
                                  }}
                                  className={`mt-2 rounded-md px-3 py-1 text-[10px] font-semibold transition ${
                                    isSelected
                                      ? "bg-[#2d5a3d] text-white"
                                      : "bg-[#f3f2ef] text-[#4a4a5a] hover:bg-[#e8e6e1]"
                                  }`}
                                >
                                  {isSelected ? "✓ Added" : "+ Add to Project"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="sticky bottom-0 border-t border-[#e8e6e1] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-[#6a6a7a]">Selected Items ({selectedProducts.length})</span>
              <span className="text-xl font-bold text-[#1a1a2e]">
                ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Link
              href="/renovate/bathroom/timeline"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d5a3d] py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
            >
              <FaWandMagicSparkles className="text-xs" /> Continue to Timeline
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
