"use client";

import { useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const STYLE_FILTERS = [
  { id: "all", label: "All Styles", icon: "✨" },
  { id: "modern", label: "Modern", icon: "◻️" },
  { id: "farmhouse", label: "Farmhouse", icon: "🏡" },
  { id: "coastal", label: "Coastal", icon: "🌊" },
  { id: "spa", label: "Spa/Luxury", icon: "🧖" },
  { id: "minimalist", label: "Minimalist", icon: "⬜" },
  { id: "industrial", label: "Industrial", icon: "🏭" },
  { id: "scandinavian", label: "Scandinavian", icon: "❄️" },
  { id: "bohemian", label: "Bohemian", icon: "🌻" },
  { id: "mid_century_modern", label: "Mid-Century", icon: "🪑" },
  { id: "traditional", label: "Traditional", icon: "🏛️" },
  { id: "japandi", label: "Japandi", icon: "🎋" },
  { id: "art_deco", label: "Art Deco", icon: "🎭" },
];

interface StyleFilterBarProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function StyleFilterBar({ selected, onSelect }: StyleFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8e6e1] bg-white shadow-md transition hover:bg-[#f8f7f4]"
      >
        <FaChevronLeft className="text-[10px] text-[#4a4a5a]" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {STYLE_FILTERS.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
              selected === style.id
                ? "border-[#2d5a3d] bg-[#2d5a3d] text-white"
                : "border-[#e8e6e1] bg-white text-[#4a4a5a] hover:border-[#2d5a3d] hover:bg-[#2d5a3d]/5 hover:text-[#2d5a3d]"
            }`}
          >
            <span className="text-sm">{style.icon}</span>
            {style.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8e6e1] bg-white shadow-md transition hover:bg-[#f8f7f4]"
      >
        <FaChevronRight className="text-[10px] text-[#4a4a5a]" />
      </button>
    </div>
  );
}
