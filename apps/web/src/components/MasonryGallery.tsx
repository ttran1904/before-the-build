"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { FaHeart, FaRegHeart, FaMagnifyingGlass } from "react-icons/fa6";
import { useMoodboardStore } from "@/lib/store";
import SaveToBoardModal from "@/components/SaveToBoardModal";

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  tags: string[];
  source?: string;
  sourceUrl?: string;
}

interface MasonryGalleryProps {
  images: GalleryImage[];
  loading?: boolean;
}

export default function MasonryGallery({ images, loading }: MasonryGalleryProps) {
  const { items: savedItems } = useMoodboardStore();
  const [savingImage, setSavingImage] = useState<GalleryImage | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const breakpointCols = {
    default: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 2,
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-[#f3f2ef]"
            style={{ height: `${200 + Math.random() * 150}px` }}
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#d5d3cd] p-20">
        <FaMagnifyingGlass className="text-5xl text-[#9a9aaa]" />
        <h3 className="text-lg font-semibold text-[#4a4a5a]">No images found</h3>
        <p className="max-w-sm text-center text-sm text-[#7a7a8a]">
          Try a different style or search term.
        </p>
      </div>
    );
  }

  const handleHeartClick = (img: GalleryImage, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setSavingImage(img);
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointCols}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {images.map((img, idx) => {
          const isSaved = savedItems.some((s) => s.id === img.id);
          const heights = [240, 280, 320, 360, 280, 300];
          const h = heights[idx % heights.length];

          return (
            <div key={img.id} className="group relative mb-4 overflow-hidden rounded-xl">
              <div className="relative" style={{ height: `${h}px` }}>
                <Image
                  src={img.url}
                  alt={img.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized
                />

                {/* Heart / Save button */}
                <button
                  onClick={(e) => handleHeartClick(img, e)}
                  className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition ${
                    isSaved
                      ? "bg-red-500 text-white shadow-lg"
                      : "bg-white/80 text-[#4a4a5a] opacity-0 shadow-md backdrop-blur-sm group-hover:opacity-100 hover:bg-white"
                  }`}
                >
                  {isSaved ? (
                    <FaHeart className="text-sm" />
                  ) : (
                    <FaRegHeart className="text-sm" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </Masonry>

      {/* Save to Board Modal */}
      {savingImage && (
        <SaveToBoardModal
          open={!!savingImage}
          onClose={() => setSavingImage(null)}
          image={savingImage}
          anchorRect={anchorRect}
        />
      )}
    </>
  );
}
