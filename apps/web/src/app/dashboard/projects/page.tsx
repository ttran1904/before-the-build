import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          + New Project
        </Link>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 p-16 dark:border-zinc-700">
        <span className="text-5xl">🏡</span>
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          No projects yet
        </h3>
        <p className="max-w-sm text-center text-sm text-zinc-500">
          Create your first project to start planning your renovation. We&apos;ll
          guide you through setting up your household info, goals, and room scans.
        </p>
        <Link
          href="/dashboard/projects/new"
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Create Project
        </Link>
      </div>
    </div>
  );
}
