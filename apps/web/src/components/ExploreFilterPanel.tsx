"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronRight, FaCheck } from "react-icons/fa6";
import {
  FaWandMagicSparkles, FaCube, FaHouseChimney, FaWater,
  FaSpa, FaMinus, FaGears, FaSnowflake,
  FaSun, FaChair, FaLandmarkDome, FaFan, FaMasksTheater,
} from "react-icons/fa6";
import type { ReactNode } from "react";

/* ── Style options (same as StyleFilterBar) ── */
const STYLES: { id: string; label: string; icon: ReactNode }[] = [
  { id: "all",                label: "All Styles",   icon: <FaWandMagicSparkles /> },
  { id: "modern",             label: "Modern",       icon: <FaCube /> },
  { id: "farmhouse",          label: "Farmhouse",    icon: <FaHouseChimney /> },
  { id: "coastal",            label: "Coastal",      icon: <FaWater /> },
  { id: "spa",                label: "Spa / Luxury", icon: <FaSpa /> },
  { id: "minimalist",         label: "Minimalist",   icon: <FaMinus /> },
  { id: "industrial",         label: "Industrial",   icon: <FaGears /> },
  { id: "scandinavian",       label: "Scandinavian", icon: <FaSnowflake /> },
  { id: "bohemian",           label: "Bohemian",     icon: <FaSun /> },
  { id: "mid_century_modern", label: "Mid-Century",  icon: <FaChair /> },
  { id: "traditional",        label: "Traditional",  icon: <FaLandmarkDome /> },
  { id: "japandi",            label: "Japandi",      icon: <FaFan /> },
  { id: "art_deco",           label: "Art Deco",     icon: <FaMasksTheater /> },
];

/* ── Color swatches ── */
const COLORS: { id: string; label: string; hex: string }[] = [
  { id: "white",   label: "White",   hex: "#FFFFFF" },
  { id: "black",   label: "Black",   hex: "#1a1a2e" },
  { id: "gray",    label: "Gray",    hex: "#9a9aaa" },
  { id: "beige",   label: "Beige",   hex: "#d4c9a8" },
  { id: "blue",    label: "Blue",    hex: "#4a90d9" },
  { id: "green",   label: "Green",   hex: "#2d5a3d" },
  { id: "wood",    label: "Wood",    hex: "#a0714f" },
  { id: "gold",    label: "Gold",    hex: "#c5a44e" },
  { id: "navy",    label: "Navy",    hex: "#1b2a4a" },
  { id: "terracotta", label: "Terracotta", hex: "#c4623a" },
];

/* ── Room sizes ── */
const ROOM_SIZES: { id: string; label: string }[] = [
  { id: "compact", label: "Compact" },
  { id: "medium",  label: "Medium" },
  { id: "large",   label: "Large" },
];

/* ── Collapsible section wrapper ── */
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#e8e6e1] py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold text-[#1a1a2e] transition hover:text-[#2d5a3d]"
      >
        {title}
        {open ? (
          <FaChevronDown className="text-[10px] text-[#9a9aaa]" />
        ) : (
          <FaChevronRight className="text-[10px] text-[#9a9aaa]" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

/* ── Main panel ── */
interface ExploreFilterPanelProps {
  selectedStyle: string;
  onStyleChange: (id: string) => void;
  selectedColor: string;
  onColorChange: (id: string) => void;
  selectedSize: string;
  onSizeChange: (id: string) => void;
  onApply: () => void;
}

export default function ExploreFilterPanel({
  selectedStyle,
  onStyleChange,
  selectedColor,
  onColorChange,
  selectedSize,
  onSizeChange,
  onApply,
}: ExploreFilterPanelProps) {
  return (
    <aside className="w-48 shrink-0 pr-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#9a9aaa]">
          Filters
        </h2>
        <button
          onClick={onApply}
          className="rounded-lg bg-[#2d5a3d] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#234a31]"
        >
          Apply
        </button>
      </div>

      {/* ── Style ── */}
      <FilterSection title="Style" defaultOpen>
        <div className="flex flex-col gap-1">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => onStyleChange(s.id)}
              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition ${
                selectedStyle === s.id
                  ? "bg-[#2d5a3d]/10 font-semibold text-[#2d5a3d]"
                  : "text-[#4a4a5a] hover:bg-[#f8f7f4]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">{s.icon}</span>
                {s.label}
              </span>
              {selectedStyle === s.id && (
                <FaCheck className="text-[10px] text-[#2d5a3d]" />
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ── Color ── */}
      <FilterSection title="Color" defaultOpen>
        <div className="grid grid-cols-5 gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => onColorChange(selectedColor === c.id ? "" : c.id)}
              title={c.label}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                selectedColor === c.id
                  ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/30"
                  : "border-[#e8e6e1] hover:border-[#2d5a3d]/50"
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {selectedColor === c.id && (
                <FaCheck
                  className={`text-[10px] ${
                    ["white", "beige", "gold"].includes(c.id)
                      ? "text-[#1a1a2e]"
                      : "text-white"
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ── Room Size ── */}
      <FilterSection title="Room Size" defaultOpen>
        <div className="flex flex-col gap-1">
          {ROOM_SIZES.map((rs) => (
            <button
              key={rs.id}
              onClick={() => onSizeChange(selectedSize === rs.id ? "" : rs.id)}
              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition ${
                selectedSize === rs.id
                  ? "bg-[#2d5a3d]/10 font-semibold text-[#2d5a3d]"
                  : "text-[#4a4a5a] hover:bg-[#f8f7f4]"
              }`}
            >
              {rs.label}
              {selectedSize === rs.id && (
                <FaCheck className="text-[10px] text-[#2d5a3d]" />
              )}
            </button>
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}
