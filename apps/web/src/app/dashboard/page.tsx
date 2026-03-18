import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome back!
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Your renovation journey at a glance.
        </p>
      </div>

      {/* Active Project */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Current Project
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          No active project yet. Start by creating one!
        </p>
        <Link
          href="/dashboard/projects/new"
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + New Project
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <QuickAction href="/explore" icon="🎨" label="Explore Styles" />
          <QuickAction href="/design" icon="📐" label="Design Room" />
          <QuickAction href="/chat" icon="💬" label="Ask AI" />
          <QuickAction href="/build-book" icon="📖" label="Build Book" />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Recent Activity
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          Your recent activity will show up here.
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
    </Link>
  );
}
