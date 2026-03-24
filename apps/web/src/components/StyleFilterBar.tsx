"use client";

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
  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_FILTERS.map((style) => (
        <button
          key={style.id}
          onClick={() => onSelect(style.id)}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
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
  );
}
