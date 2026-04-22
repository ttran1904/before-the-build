"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { FaCheck, FaFilter, FaXmark, FaArrowUpRightFromSquare } from "react-icons/fa6";
import type { Product as MoodboardProduct } from "@before-the-build/shared";

interface AirtableMaterial {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  vendor: string;
  vendors: string[];
  price: number | null;
  description: string;
  finish: string;
  finishes: string[];
  imageUrl: string;
  link: string;
}

interface AirtableMaterialsGridProps {
  selectedProducts?: MoodboardProduct[];
  onToggleProduct?: (product: MoodboardProduct) => void;
}

export default function AirtableMaterialsGrid({
  selectedProducts = [],
  onToggleProduct,
}: AirtableMaterialsGridProps = {}) {
  const [materials, setMaterials] = useState<AirtableMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterFinish, setFilterFinish] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/catalogue/airtable");
        const data = await res.json();
        if (!cancelled) {
          setMaterials(data.materials || []);
          if (data.error && data.materials?.length === 0) {
            setError(data.error);
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load designer materials");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Derive unique filter options
  const categories = useMemo(
    () => [...new Set(materials.map((m) => m.category).filter(Boolean))].sort(),
    [materials]
  );
  const vendors = useMemo(
    () => [...new Set(materials.map((m) => m.vendor).filter(Boolean))].sort(),
    [materials]
  );
  const finishes = useMemo(
    () => [...new Set(materials.flatMap((m) => m.finishes ?? (m.finish ? [m.finish] : [])).filter(Boolean))].sort(),
    [materials]
  );

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (filterCategory && m.category !== filterCategory) return false;
      if (filterVendor && !(m.vendors ?? [m.vendor]).includes(filterVendor)) return false;
      if (filterFinish && !(m.finishes ?? [m.finish]).includes(filterFinish)) return false;
      return true;
    });
  }, [materials, filterCategory, filterVendor, filterFinish]);

  const hasFilters = filterCategory || filterVendor || filterFinish;

  // Convert an Airtable material into the shared MoodboardProduct shape.
  // Crucially: include link + description in `specs` so the shared
  // `parseTileDimensions` helper can extract dimensions from the URL slug
  // (many product URLs contain things like "12x24-tile") or from the
  // designer's description text.
  const toMoodboardProduct = (m: AirtableMaterial): MoodboardProduct => ({
    title: m.name,
    price: m.price !== null ? `$${typeof m.price === "number" ? m.price.toFixed(2) : m.price}` : "",
    source: m.vendor || "Designer Picks",
    url: m.link || `airtable:${m.id}`,
    thumbnail: m.imageUrl,
    images: m.imageUrl ? [m.imageUrl] : [],
    specs: {
      ...(m.category ? { category: m.category } : {}),
      ...(m.subCategory ? { sub_category: m.subCategory } : {}),
      ...(m.finishes?.length ? { finishes: m.finishes.join(", ") } : {}),
      ...(m.vendors?.length ? { vendors: m.vendors.join(", ") } : {}),
      ...(m.description ? { description: m.description } : {}),
      ...(m.link ? { link: m.link } : {}),
    },
  });

  const isSelected = (m: AirtableMaterial) => {
    const url = m.link || `airtable:${m.id}`;
    return selectedProducts.some((sp) => sp.url === url || sp.title === m.name);
  };

  const handleToggle = (m: AirtableMaterial) => {
    if (onToggleProduct) onToggleProduct(toMoodboardProduct(m));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-[#f3f2ef]" style={{ height: 300 }} />
        ))}
      </div>
    );
  }

  if (error && materials.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d3cd] p-12 text-center">
        <p className="mb-2 text-lg font-semibold text-[#4a4a5a]">Airtable Not Connected</p>
        <p className="text-sm text-[#7a7a8a]">{error}</p>
        <div className="mx-auto mt-4 max-w-md rounded-lg bg-[#f9f8f6] p-4 text-left text-xs text-[#4a4a5a]">
          <p className="mb-2 font-semibold">To connect your designer&apos;s Airtable:</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              Go to{" "}
              <a
                href="https://airtable.com/create/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#2d5a3d] underline"
              >
                airtable.com/create/tokens
              </a>{" "}
              and create a Personal Access Token
            </li>
            <li>Add these to your <code className="rounded bg-[#e8e6e1] px-1">.env.local</code>:</li>
          </ol>
          <pre className="mt-2 overflow-x-auto rounded bg-[#1a1a2e] p-3 text-green-400">
{`AIRTABLE_PAT=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TABLE_NAME=Materials`}
          </pre>
          <p className="mt-2 text-[#9a9aaa]">
            The Base ID is in your Airtable URL: airtable.com/<strong>appXXXX</strong>/...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar — mirrors the Airtable screenshot (Category, Sub Category, Vendor, Finishes, etc.) */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FaFilter className="text-xs text-[#9a9aaa]" />

        {/* Category */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-[#e8e6e1] bg-white px-3 py-2 text-xs text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Vendor */}
        <select
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
          className="rounded-lg border border-[#e8e6e1] bg-white px-3 py-2 text-xs text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d]"
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        {/* Finish */}
        <select
          value={filterFinish}
          onChange={(e) => setFilterFinish(e.target.value)}
          className="rounded-lg border border-[#e8e6e1] bg-white px-3 py-2 text-xs text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d]"
        >
          <option value="">All Finishes</option>
          {finishes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setFilterCategory("");
              setFilterVendor("");
              setFilterFinish("");
            }}
            className="flex items-center gap-1 rounded-full bg-[#2d5a3d]/10 px-3 py-1.5 text-xs font-medium text-[#2d5a3d] transition hover:bg-[#2d5a3d]/20"
          >
            Clear <FaXmark className="text-[8px]" />
          </button>
        )}

        <span className="ml-auto text-xs text-[#9a9aaa]">
          {filtered.length} material{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Materials grid (matches your designer's Airtable card layout) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((m) => {
          const selected = isSelected(m);
          return (
          <div
            key={m.id}
            onClick={() => handleToggle(m)}
            className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
              selected ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/20" : "border-[#e8e6e1]"
            }`}
          >
            {/* Image — flush to all edges */}
            <div className="relative aspect-square w-full bg-[#f9f8f6]">
              {m.imageUrl ? (
                <Image
                  src={m.imageUrl}
                  alt={m.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-[#c5c3bd]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                    <path d="M3 17l5-5 4 4 3-3 6 6" />
                  </svg>
                  <span className="text-[10px] font-medium uppercase tracking-wider">No image</span>
                </div>
              )}

              {/* Selection indicator */}
              <div className="absolute right-2 top-2">
                {selected ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2d5a3d] shadow">
                    <FaCheck className="text-[10px] text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-[#c5c3be] bg-white/80 shadow-sm transition group-hover:border-[#2d5a3d]" />
                )}
              </div>

              {/* External link to product page (used for dimension scraping) */}
              {m.link && (
                <a
                  href={m.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-2 bottom-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#9a9aaa] shadow-sm transition hover:bg-white hover:text-[#2d5a3d]"
                  title="View product details"
                >
                  <FaArrowUpRightFromSquare className="text-[9px]" />
                </a>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-2.5">
              <h4 className="line-clamp-2 text-[13px] font-bold text-[#1a1a2e] leading-snug">
                {m.name}
              </h4>

              {m.category && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-[#9a9aaa]">Category</span>
                  <span className="inline-block rounded bg-[#fde9d6] px-1.5 py-0.5 text-[10px] font-medium text-[#7a4a1a]">
                    {m.category}
                  </span>
                </div>
              )}

              {(m.vendors?.length ?? 0) > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#9a9aaa]">Vendor</span>
                  {m.vendors.map((v) => (
                    <span
                      key={v}
                      className="inline-block rounded bg-[#e6f0ff] px-1.5 py-0.5 text-[10px] font-medium text-[#1a3a7a]"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}

              {(m.finishes?.length ?? 0) > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#9a9aaa]">Finish</span>
                  {m.finishes.map((fin) => (
                    <span
                      key={fin}
                      className="inline-block rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] text-[#4a4a5a]"
                    >
                      {fin}
                    </span>
                  ))}
                </div>
              )}

              {/* Price — bottom-right, larger */}
              {m.price !== null && (
                <div className="mt-auto pt-2 flex justify-start">
                  <span className="text-base font-extrabold text-[#1a1a2e]">
                    ${typeof m.price === "number" ? m.price.toFixed(2) : m.price}
                  </span>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {filtered.length === 0 && materials.length > 0 && (
        <div className="mt-8 text-center text-sm text-[#7a7a8a]">
          No materials match the current filters.
        </div>
      )}
    </div>
  );
}
