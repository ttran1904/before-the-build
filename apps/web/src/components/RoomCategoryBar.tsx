"use client";

import { useRef, type ReactNode } from "react";
import {
  FaChevronLeft, FaChevronRight, FaLock,
  FaBath, FaFireBurner, FaBed, FaCouch,
  FaUtensils, FaTree, FaHelmetSafety, FaBriefcase,
  FaCar, FaShirt, FaDoorOpen, FaStairs,
} from "react-icons/fa6";

const ROOM_CATEGORIES: { id: string; label: string; icon: ReactNode; available: boolean }[] = [
  { id: "bathroom", label: "Bath", icon: <FaBath />, available: true },
  { id: "kitchen", label: "Kitchen", icon: <FaFireBurner />, available: false },
  { id: "bedroom", label: "Bedroom", icon: <FaBed />, available: false },
  { id: "living_room", label: "Living", icon: <FaCouch />, available: false },
  { id: "dining_room", label: "Dining", icon: <FaUtensils />, available: false },
  { id: "outdoor", label: "Outdoor", icon: <FaTree />, available: false },
  { id: "basement", label: "Basement", icon: <FaHelmetSafety />, available: false },
  { id: "office", label: "Home Office", icon: <FaBriefcase />, available: false },
  { id: "garage", label: "Garage & Shed", icon: <FaCar />, available: false },
  { id: "laundry", label: "Laundry", icon: <FaShirt />, available: false },
  { id: "entry", label: "Entry", icon: <FaDoorOpen />, available: false },
  { id: "staircase", label: "Staircase", icon: <FaStairs />, available: false },
];

interface RoomCategoryBarProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function RoomCategoryBar({ selected, onSelect }: RoomCategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 220;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8e6e1] bg-white shadow-md transition hover:bg-[#f8f7f4]"
      >
        <FaChevronLeft className="text-xs text-[#4a4a5a]" />
      </button>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-6 py-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {ROOM_CATEGORIES.map((room) => (
          <button
            key={room.id}
            onClick={() => room.available && onSelect(room.id)}
            disabled={!room.available}
            className={`group relative flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 transition ${
              selected === room.id
                ? "bg-[#2d5a3d] text-white shadow-lg shadow-[#2d5a3d]/20"
                : room.available
                  ? "hover:bg-[#f8f7f4]"
                  : "cursor-not-allowed opacity-50"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${
                selected === room.id
                  ? "bg-white/20"
                  : "bg-[#f3f2ef]"
              }`}
            >
              {room.icon}
            </div>
            <span
              className={`text-xs font-medium ${
                selected === room.id
                  ? "text-white"
                  : "text-[#4a4a5a]"
              }`}
            >
              {room.label}
            </span>
            {!room.available && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
                <div className="flex flex-col items-center gap-1">
                  <FaLock className="text-xs text-[#9a9aaa]" />
                  <span className="text-[10px] font-medium text-[#9a9aaa]">Soon</span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8e6e1] bg-white shadow-md transition hover:bg-[#f8f7f4]"
      >
        <FaChevronRight className="text-xs text-[#4a4a5a]" />
      </button>
    </div>
  );
}
