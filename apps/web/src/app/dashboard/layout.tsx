import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/dashboard" className="mb-8 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Before The Build
        </Link>

        <nav className="flex flex-col gap-1">
          <NavItem href="/dashboard" label="Home" icon="🏠" />
          <NavItem href="/dashboard/projects" label="Projects" icon="📁" />
          <NavItem href="/explore" label="Explore" icon="🔍" />
          <NavItem href="/design" label="Design" icon="📐" />
          <NavItem href="/chat" label="AI Chat" icon="💬" />
          <NavItem href="/build-book" label="Build Book" icon="📖" />
        </nav>

        <div className="mt-auto">
          <NavItem href="/settings" label="Settings" icon="⚙️" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-white p-8 dark:bg-zinc-950">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      <span>{icon}</span>
      {label}
    </Link>
  );
}
