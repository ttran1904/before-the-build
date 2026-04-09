"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FaHouse, FaMagnifyingGlass, FaArrowLeft, FaClipboardList,
  FaXmark, FaImages, FaSwatchbook,
} from "react-icons/fa6";
import RoomCategoryBar from "@/components/RoomCategoryBar";
import MasonryGallery from "@/components/MasonryGallery";
import MoodboardPanel from "@/components/MoodboardPanel";
import ExploreFilterPanel from "@/components/ExploreFilterPanel";
import CatalogueView from "@/components/CatalogueView";
import { useMoodboardStore } from "@/lib/store";

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  tags: string[];
  source?: string;
  sourceUrl?: string;
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorePageContent />
    </Suspense>
  );
}

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const fromMoodboard = searchParams.get("from") === "moodboard";
  const [selectedRoom, setSelectedRoom] = useState("bathroom");
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodboardOpen, setMoodboardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"inspiration" | "catalogue">("inspiration");
  const moodboardCount = useMoodboardStore((s) => s.items.length);
  const abortControllerRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (style: string, color: string, size: string, query: string) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (style !== "all") params.set("style", style);
      if (color) params.set("color", color);
      if (size) params.set("size", size);
      if (query) params.set("query", query);
      const res = await fetch(`/api/inspiration?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      setImages(data.images || []);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setImages([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // Auto-trigger search whenever filters change
  useEffect(() => {
    runSearch(selectedStyle, selectedColor, selectedSize, activeSearch);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [selectedStyle, selectedColor, selectedSize, activeSearch, runSearch]);

  const handleSearchSubmit = () => {
    setActiveSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Back to Moodboard bar — only shown when navigated from renovation step 5 */}
      {fromMoodboard && (
        <div className="sticky top-0 z-40 border-b border-[#2d5a3d]/20 bg-[#2d5a3d]/5 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center px-6 py-2.5">
            <Link
              href="/renovate/bathroom?step=moodboard"
              className="flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#234a31]"
            >
              <FaArrowLeft className="text-xs" />
              Back to Moodboard
            </Link>
            <span className="ml-4 text-sm text-[#4a4a5a]">
              Save images to your moodboard, then return to continue your renovation.
            </span>
          </div>
        </div>
      )}

      {/* Top Nav */}
      <header className={`sticky ${fromMoodboard ? 'top-[52px]' : 'top-0'} z-30 border-b border-[#e8e6e1] bg-white/90 backdrop-blur-md`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <FaHouse className="text-xl text-[#2d5a3d]" />
            <span className="text-xl font-bold tracking-tight text-[#1a1a2e]">
              Before The Build
            </span>
          </Link>

          {/* Center: Nav + Tab Toggle */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/explore" className="text-sm font-semibold text-[#2d5a3d]">
              Explore
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-[#4a4a5a] transition hover:text-[#1a1a2e]">
              Dashboard
            </Link>
            <span className="mx-1 h-5 w-px bg-[#e8e6e1]" />
            {/* Inspiration / Store Catalogue toggle */}
            <div className="flex items-center rounded-full border border-[#e8e6e1] bg-[#f7f6f3] p-0.5">
              <button
                onClick={() => setActiveTab("inspiration")}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeTab === "inspiration"
                    ? "bg-[#2d5a3d] text-white shadow-sm"
                    : "text-[#7a7a8a] hover:text-[#4a4a5a]"
                }`}
              >
                <FaImages className="text-[10px]" />
                Inspiration
              </button>
              <button
                onClick={() => setActiveTab("catalogue")}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeTab === "catalogue"
                    ? "bg-[#2d5a3d] text-white shadow-sm"
                    : "text-[#7a7a8a] hover:text-[#4a4a5a]"
                }`}
              >
                <FaSwatchbook className="text-[10px]" />
                Store Catalogue
              </button>
            </div>
          </div>

          <button
            onClick={() => setMoodboardOpen(true)}
            className="relative flex items-center gap-2 rounded-full border border-[#2d5a3d] bg-[#2d5a3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#234a31]"
          >
            <FaClipboardList className="text-white" />
            My Build Plan
            {moodboardCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#2d5a3d]">
                {moodboardCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {activeTab === "catalogue" ? (
        /* ── Catalogue Tab ── */
        <div className="mx-auto px-4 pb-8" style={{ maxWidth: "1600px" }}>
          <CatalogueView />
        </div>
      ) : (
        /* ── Inspiration Tab (existing behaviour) ── */
        <div className="mx-auto flex gap-0 px-4 py-4" style={{ maxWidth: "1600px" }}>
          {/* Left Filter Panel */}
          <ExploreFilterPanel
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
          />

          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {/* Page Title + Search */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl font-bold text-[#1a1a2e]">
                Home Design Ideas
              </h1>
              <div className="flex items-center gap-3">
              {activeSearch && (
                <div className="flex items-center gap-1.5 rounded-full bg-[#2d5a3d]/10 px-3 py-1.5 text-sm font-medium text-[#2d5a3d]">
                  <span className="max-w-[160px] truncate">{activeSearch}</span>
                  <button
                    onClick={clearSearch}
                    className="ml-0.5 rounded-full p-0.5 transition hover:bg-[#2d5a3d]/20"
                    aria-label="Clear search"
                  >
                    <FaXmark className="text-[10px]" />
                  </button>
                </div>
              )}
              <div className="relative w-full md:w-80">
                <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9aaa]" />
                <input
                  type="text"
                  placeholder="Search bathroom ideas..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchSubmit();
                  }}
                  className="w-full rounded-xl border border-[#e8e6e1] bg-white py-3 pl-11 pr-4 text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/20"
                />
              </div>
              <button
                onClick={handleSearchSubmit}
                className="shrink-0 rounded-xl bg-[#2d5a3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234a31]"
              >
                Search
              </button>
            </div>
            </div>

            {/* Room Category Bar (Houzz-style) */}
            <div className="mb-4">
              <RoomCategoryBar selected={selectedRoom} onSelect={setSelectedRoom} />
            </div>

            {/* Masonry Gallery */}
            <MasonryGallery images={images} loading={loading} />
          </div>
        </div>
      )}

      {/* Moodboard Panel */}
      <MoodboardPanel open={moodboardOpen} onClose={() => setMoodboardOpen(false)} />
    </div>
  );
}
