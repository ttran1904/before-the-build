"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaCheck, FaStar, FaArrowUpRightFromSquare } from "react-icons/fa6";
import type { HDCollection } from "@/lib/catalogue/home-depot-collections";
import type { Product as MoodboardProduct } from "@/lib/moodboard/types";

interface Product {
  id: string;
  title: string;
  price: string;
  extractedPrice: number;
  link: string;
  image: string;
  store: string;
  brand: string;
  rating: number | null;
  reviews: number | null;
  badge: string | null;
  freeDelivery: boolean;
  modelNumber: string;
}

interface CollectionDetailProps {
  collection: HDCollection;
  selectedProducts?: MoodboardProduct[];
  onToggleProduct?: (product: MoodboardProduct) => void;
}

export default function CollectionDetail({ collection, selectedProducts = [], onToggleProduct }: CollectionDetailProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/catalogue/collection-products?collectionId=${encodeURIComponent(collection.id)}`
        );
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products || []);
          if (data.error && data.products?.length === 0) {
            setError(data.error);
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, [collection.id]);

  const toMoodboardProduct = (p: Product): MoodboardProduct => ({
    title: p.title,
    price: p.price,
    source: p.store || "Home Depot",
    url: p.link,
    thumbnail: p.image,
    images: p.image ? [p.image] : [],
    specs: {},
  });

  const isProductSelected = (p: Product) =>
    selectedProducts.some((sp) => sp.url === p.link || sp.title === p.title);

  const handleToggle = (p: Product) => {
    if (onToggleProduct) onToggleProduct(toMoodboardProduct(p));
  };

  return (
    <div>
      {/* Collection header */}
      <div className="mb-6 flex items-start gap-6">
        <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a1a2e]">{collection.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#7a7a8a]">
            {collection.styles.map((s) => (
              <span key={s} className="rounded-full bg-[#f3f2ef] px-2.5 py-0.5 font-medium text-[#4a4a5a]">
                {s}
              </span>
            ))}
            <span>Bathroom</span>
          </div>
          <p className="mt-2 text-sm text-[#4a4a5a]">{collection.description}</p>
          <a
            href={collection.hdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#f96302] transition hover:underline"
          >
            View on Home Depot <FaArrowUpRightFromSquare className="text-[8px]" />
          </a>
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-[#f3f2ef]" style={{ height: 280 }} />
          ))}
        </div>
      ) : error && products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d5d3cd] p-12 text-center">
          <p className="text-sm text-[#7a7a8a]">{error}</p>
          <p className="mt-1 text-xs text-[#9a9aaa]">
            Make sure SERPAPI_KEY is set in your .env.local
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => {
            const isSelected = isProductSelected(p);
            return (
              <div
                key={p.id}
                onClick={() => handleToggle(p)}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
                  isSelected ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/20" : "border-[#e8e6e1]"
                }`}
              >
                {/* Badge */}
                {p.badge && (
                  <div className="absolute left-2 top-2 z-10 rounded bg-[#f96302] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {p.badge}
                  </div>
                )}

                {/* Image */}
                <div className="relative h-44 w-full bg-[#f9f8f6]">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  )}

                  {/* Selection tick */}
                  {isSelected && (
                    <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#2d5a3d] shadow">
                      <FaCheck className="text-[10px] text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="line-clamp-2 text-xs font-semibold text-[#1a1a2e] leading-snug">
                    {p.title}
                  </h4>

                  {p.brand && (
                    <p className="mt-0.5 text-[10px] text-[#9a9aaa]">by {p.brand}</p>
                  )}

                  {p.rating != null && p.rating > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#f59e0b]">
                      <FaStar />
                      <span className="text-[#4a4a5a]">
                        {p.rating} {p.reviews ? `(${p.reviews.toLocaleString()})` : ""}
                      </span>
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1a1a2e]">{p.price}</span>
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#9a9aaa] transition hover:text-[#4a4a5a]"
                      title="View on store"
                    >
                      <FaArrowUpRightFromSquare className="text-[10px]" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
