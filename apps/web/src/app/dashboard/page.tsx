import Link from "next/link";
import { FaBookOpen, FaCompass, FaTableCellsLarge, FaPlus } from "react-icons/fa6";
import type { IconType } from "react-icons";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a2e]">
          Welcome back!
        </h1>
        <p className="mt-1 text-[#6a6a7a]">
          Your renovation journey at a glance.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickAction
          href="/dashboard/build-books"
          icon={FaBookOpen}
          label="Build Books"
          description="View and edit all your build books"
        />
        <QuickAction
          href="/dashboard/moodboards"
          icon={FaTableCellsLarge}
          label="Moodboards"
          description="Browse and manage your saved moodboards"
        />
        <QuickAction
          href="/explore"
          icon={FaCompass}
          label="Explore Ideas"
          description="Discover styles and inspiration"
        />
      </div>

      {/* Recent Build Books */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1a1a2e]">Recent Build Books</h2>
          <Link href="/dashboard/build-books" className="text-sm font-medium text-[#2d5a3d] hover:underline">
            View All →
          </Link>
        </div>
        <div className="rounded-xl border border-[#e8e6e1] bg-white p-8 text-center">
          <FaBookOpen className="mx-auto text-3xl text-[#d5d3cd]" />
          <p className="mt-3 text-sm text-[#9a9aaa]">No build books yet.</p>
          <Link
            href="/explore"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#234a31]"
          >
            <FaPlus className="text-xs" /> Start Your First Build Book
          </Link>
        </div>
      </div>

      {/* Recent Moodboards */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1a1a2e]">Recent Moodboards</h2>
          <Link href="/dashboard/moodboards" className="text-sm font-medium text-[#2d5a3d] hover:underline">
            View All →
          </Link>
        </div>
        <div className="rounded-xl border border-[#e8e6e1] bg-white p-8 text-center">
          <FaTableCellsLarge className="mx-auto text-3xl text-[#d5d3cd]" />
          <p className="mt-3 text-sm text-[#9a9aaa]">No moodboards yet. Save inspiration to get started!</p>
          <Link
            href="/explore"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#234a31]"
          >
            <FaCompass className="text-xs" /> Explore Ideas
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: IconType;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-xl border border-[#e8e6e1] bg-white p-5 transition hover:border-[#d5d3cd] hover:shadow-sm"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2d5a3d]/10">
        <Icon className="text-lg text-[#2d5a3d]" />
      </span>
      <div>
        <span className="text-sm font-semibold text-[#1a1a2e]">{label}</span>
        <p className="mt-0.5 text-xs text-[#6a6a7a]">{description}</p>
      </div>
    </Link>
  );
}
