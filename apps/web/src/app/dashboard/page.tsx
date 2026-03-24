import Link from "next/link";
import { FaCompass, FaPenRuler, FaComments, FaBookOpen } from "react-icons/fa6";
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

      {/* Active Project */}
      <div className="rounded-2xl border border-[#e8e6e1] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#1a1a2e]">
          Current Project
        </h2>
        <p className="mt-2 text-sm text-[#6a6a7a]">
          No active project yet. Start by creating one!
        </p>
        <Link
          href="/dashboard/projects/new"
          className="mt-4 inline-block rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#234a31]"
        >
          + New Project
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#1a1a2e]">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <QuickAction href="/explore" icon={FaCompass} label="Explore Styles" />
          <QuickAction href="/design" icon={FaPenRuler} label="Design Room" />
          <QuickAction href="/chat" icon={FaComments} label="Ask AI" />
          <QuickAction href="/build-book" icon={FaBookOpen} label="Build Book" />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#1a1a2e]">
          Recent Activity
        </h2>
        <div className="rounded-xl border border-[#e8e6e1] bg-white p-8 text-center text-sm text-[#9a9aaa]">
          Your recent activity will show up here.
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: IconType; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-[#e8e6e1] bg-white p-6 transition hover:border-[#d5d3cd] hover:shadow-sm"
    >
      <Icon className="text-2xl text-[#2d5a3d]" />
      <span className="text-sm font-medium text-[#4a4a5a]">{label}</span>
    </Link>
  );
}
