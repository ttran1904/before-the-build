import Link from "next/link";
import { FaTableCellsLarge, FaPlus } from "react-icons/fa6";

export default function MoodboardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Moodboards</h1>
          <p className="mt-1 text-sm text-[#6a6a7a]">
            Your saved inspiration collections. Link them to build books or browse for ideas.
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
        >
          <FaPlus className="text-xs" /> New Moodboard
        </Link>
      </div>

      {/* Empty state */}
      <div className="rounded-2xl border border-dashed border-[#d5d3cd] bg-white p-16 text-center">
        <FaTableCellsLarge className="mx-auto text-4xl text-[#d5d3cd]" />
        <h3 className="mt-4 text-lg font-semibold text-[#1a1a2e]">No moodboards yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#6a6a7a]">
          Moodboards work like Pinterest boards — save inspiration images, colors, materials,
          and styles. You can link one or more moodboards to any build book.
        </p>
        <Link
          href="/explore"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
        >
          <FaPlus className="text-xs" /> Start Collecting Ideas
        </Link>
      </div>
    </div>
  );
}
