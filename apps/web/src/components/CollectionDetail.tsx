"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaHeart, FaRegHeart, FaStar, FaArrowUpRightFromSquare, FaTruck } from "react-icons/fa6";
import type { HDCollection } from "@/lib/catalogue/home-depot-collections";
import { useMoodboardStore } from "@/lib/store";
import SaveToBoardModal from "@/components/SaveToBoardModal";

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
}

export default function CollectionDetail({ collection }: CollectionDetailProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { items: savedItems } = useMoodboardStore();
  const [savingProduct, setSavingProduct] = useState<Product | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/catalogue/collection-products?q=${encodeURIComponent(collection.serpQuery)}`
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
  }, [collection.serpQuery]);

  const handleHeartClick = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setSavingProduct(product);
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
            const isSaved = savedItems.some((s) => s.id === p.id);
            return (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-xl border border-[#e8e6e1] bg-white shadow-sm transition hover:shadow-md"
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

                  {/* Heart */}
                  <button
                    onClick={(e) => handleHeartClick(p, e)}
                    className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full transition ${
                      isSaved
                        ? "bg-red-500 text-white shadow"
                        : "bg-white/80 text-[#4a4a5a] opacity-0 shadow-md group-hover:opacity-100 hover:bg-white"
                    }`}
                  >
                    {isSaved ? <FaHeart className="text-xs" /> : <FaRegHeart className="text-xs" />}
                  </button>
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
                  </div>

                  {p.freeDelivery && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#2d5a3d]">
                      <FaTruck className="text-[8px]" />
                      Free Delivery
                    </div>
                  )}

                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-[#f96302] transition hover:underline"
                  >
                    View on Home Depot <FaArrowUpRightFromSquare className="text-[8px]" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save-to-board modal */}
      {savingProduct && (
        <SaveToBoardModal
          open={!!savingProduct}
          onClose={() => setSavingProduct(null)}
          image={{
            id: savingProduct.id,
            url: savingProduct.image,
            title: savingProduct.title,
            tags: [...collection.styles.map(s => s.toLowerCase()), "bathroom", "product"],
          }}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}
