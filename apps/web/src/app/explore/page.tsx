"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FaHouse, FaBookmark, FaMagnifyingGlass, FaArrowLeft,
} from "react-icons/fa6";
import RoomCategoryBar from "@/components/RoomCategoryBar";
import StyleFilterBar from "@/components/StyleFilterBar";
import MasonryGallery from "@/components/MasonryGallery";
import MoodboardPanel from "@/components/MoodboardPanel";
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
  const searchParams = useSearchParams();
  const fromMoodboard = searchParams.get("from") === "moodboard";
  const [selectedRoom, setSelectedRoom] = useState("bathroom");
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [search, setSearch] = useState("");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodboardOpen, setMoodboardOpen] = useState(false);
  const moodboardCount = useMoodboardStore((s) => s.items.length);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStyle !== "all") params.set("style", selectedStyle);
      if (search) params.set("query", search);
      const res = await fetch(`/api/inspiration?${params.toString()}`);
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      setImages([]);
    }
    setLoading(false);
  }, [selectedStyle, search]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <div className="min-h-screen bg-white">
      {/* Back to Moodboard bar — only shown when navigated from renovation step 5 */}
      {fromMoodboard && (
        <div className="sticky top-0 z-40 border-b border-[#2d5a3d]/20 bg-[#2d5a3d]/5 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center px-6 py-2.5">
            <Link
              href="/renovate/bathroom"
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <FaHouse className="text-xl text-[#2d5a3d]" />
            <span className="text-xl font-bold tracking-tight text-[#1a1a2e]">
              Before The Build
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/explore" className="text-sm font-semibold text-[#2d5a3d]">
              Explore
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-[#4a4a5a] transition hover:text-[#1a1a2e]">
              Dashboard
            </Link>
            <Link href="/chat" className="text-sm font-medium text-[#4a4a5a] transition hover:text-[#1a1a2e]">
              AI Chat
            </Link>
          </nav>
          <button
            onClick={() => setMoodboardOpen(true)}
            className="relative flex items-center gap-2 rounded-full border border-[#e8e6e1] bg-white px-4 py-2 text-sm font-medium text-[#1a1a2e] transition hover:bg-[#f8f7f4]"
          >
            <FaBookmark className="text-[#2d5a3d]" />
            Moodboard
            {moodboardCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2d5a3d] text-[10px] font-bold text-white">
                {moodboardCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a2e]">
            Home Design Ideas
          </h1>
          <p className="mt-2 text-[#6a6a7a]">
            Browse bathroom inspiration and save your favorites to build a moodboard
          </p>
        </div>

        {/* Room Category Bar (Houzz-style) */}
        <div className="mb-8">
          <RoomCategoryBar selected={selectedRoom} onSelect={setSelectedRoom} />
        </div>

        {/* Search + Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9aaa]" />
            <input
              type="text"
              placeholder="Search bathroom ideas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#e8e6e1] bg-white py-3 pl-11 pr-4 text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/20"
            />
          </div>
        </div>

        {/* Style Filter Pills */}
        <div className="mb-8">
          <StyleFilterBar selected={selectedStyle} onSelect={setSelectedStyle} />
        </div>

        {/* Masonry Gallery */}
        <MasonryGallery images={images} loading={loading} />
      </div>

      {/* Moodboard Panel */}
      <MoodboardPanel open={moodboardOpen} onClose={() => setMoodboardOpen(false)} />
    </div>
  );
}
