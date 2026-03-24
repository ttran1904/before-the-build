import Link from "next/link";
import { FaFolderOpen } from "react-icons/fa6";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#234a31]"
        >
          + New Project
        </Link>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#d5d3cd] p-16">
        <FaFolderOpen className="text-5xl text-[#9a9aaa]" />
        <h3 className="text-lg font-semibold text-[#4a4a5a]">
          No projects yet
        </h3>
        <p className="max-w-sm text-center text-sm text-[#6a6a7a]">
          Create your first project to start planning your renovation. We&apos;ll
          guide you through setting up your household info, goals, and room scans.
        </p>
        <Link
          href="/dashboard/projects/new"
          className="rounded-lg bg-[#2d5a3d] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#234a31]"
        >
          Create Project
        </Link>
      </div>
    </div>
  );
}
