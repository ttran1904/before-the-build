import Link from "next/link";
import { FaBookOpen, FaPlus } from "react-icons/fa6";

export default function BuildBooksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Build Books</h1>
          <p className="mt-1 text-sm text-[#6a6a7a]">
            All your renovation build books in one place. Click one to view or edit.
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
        >
          <FaPlus className="text-xs" /> New Build Book
        </Link>
      </div>

      {/* Empty state */}
      <div className="rounded-2xl border border-dashed border-[#d5d3cd] bg-white p-16 text-center">
        <FaBookOpen className="mx-auto text-4xl text-[#d5d3cd]" />
        <h3 className="mt-4 text-lg font-semibold text-[#1a1a2e]">No build books yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#6a6a7a]">
          Build books are contractor-ready documents with your designs, budgets, timelines,
          and product selections. Start by exploring ideas and creating your first one!
        </p>
        <Link
          href="/explore"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
        >
          <FaPlus className="text-xs" /> Create Your First Build Book
        </Link>
      </div>
    </div>
  );
}
