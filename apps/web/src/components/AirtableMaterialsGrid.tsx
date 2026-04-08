"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { FaArrowUpRightFromSquare, FaFilter, FaXmark } from "react-icons/fa6";

interface AirtableMaterial {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  vendor: string;
  price: number | null;
  description: string;
  finish: string;
  imageUrl: string;
  link: string;
}

export default function AirtableMaterialsGrid() {
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
    () => [...new Set(materials.map((m) => m.finish).filter(Boolean))].sort(),
    [materials]
  );

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (filterCategory && m.category !== filterCategory) return false;
      if (filterVendor && m.vendor !== filterVendor) return false;
      if (filterFinish && m.finish !== filterFinish) return false;
      return true;
    });
  }, [materials, filterCategory, filterVendor, filterFinish]);

  const hasFilters = filterCategory || filterVendor || filterFinish;

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
        {filtered.map((m) => (
          <div
            key={m.id}
            className="group overflow-hidden rounded-xl border border-[#e8e6e1] bg-white shadow-sm transition hover:shadow-md"
          >
            {/* Image */}
            <div className="relative h-44 w-full bg-[#f9f8f6]">
              {m.imageUrl ? (
                <Image
                  src={m.imageUrl}
                  alt={m.name}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl text-[#d5d3cd]">
                  📦
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <h4 className="line-clamp-2 text-sm font-bold text-[#1a1a2e] leading-snug">
                {m.name}
              </h4>

              {m.vendor && (
                <div className="mt-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#9a9aaa]">Vendor</span>
                  <span className="ml-1.5 inline-block rounded-full border border-[#e8e6e1] bg-[#f9f8f6] px-2 py-0.5 text-xs font-medium text-[#1a1a2e]">
                    {m.vendor}
                  </span>
                </div>
              )}

              {m.price !== null && (
                <div className="mt-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#9a9aaa]">MSRP</span>
                  <p className="text-sm font-bold text-[#1a1a2e]">
                    ${typeof m.price === "number" ? m.price.toFixed(2) : m.price}
                  </p>
                </div>
              )}

              {m.description && (
                <div className="mt-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#9a9aaa]">
                    Description
                  </span>
                  <p className="line-clamp-2 text-xs text-[#4a4a5a]">{m.description}</p>
                </div>
              )}

              {m.finish && (
                <div className="mt-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#9a9aaa]">
                    Finishes
                  </span>
                  <span className="ml-1.5 inline-block rounded-full border border-[#e8e6e1] bg-[#f9f8f6] px-2 py-0.5 text-xs text-[#4a4a5a]">
                    {m.finish}
                  </span>
                </div>
              )}

              {m.link && (
                <a
                  href={m.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-[#2d5a3d] transition hover:underline"
                >
                  View Product <FaArrowUpRightFromSquare className="text-[8px]" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && materials.length > 0 && (
        <div className="mt-8 text-center text-sm text-[#7a7a8a]">
          No materials match the current filters.
        </div>
      )}
    </div>
  );
}
