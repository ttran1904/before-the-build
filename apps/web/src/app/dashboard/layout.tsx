import Link from "next/link";
import {
  FaHouse, FaBookOpen, FaCompass, FaTableCellsLarge, FaGear,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import { SignOutButton } from "@/components/SignOutButton";
import { SidebarUserInfo } from "@/components/SidebarUserInfo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-[#e8e6e1] bg-[#2d5a3d] p-5">
        <Link href="/dashboard" className="mb-8 text-lg font-bold text-white">
          Before The Build
        </Link>

        <nav className="flex flex-col gap-0.5">
          <NavItem href="/dashboard" label="Home" icon={FaHouse} />
          <NavItem href="/explore" label="Explore Ideas" icon={FaCompass} />
          <NavItem href="/dashboard/build-books" label="Build Books" icon={FaBookOpen} />
          <NavItem href="/dashboard/moodboards" label="Idea Boards" icon={FaTableCellsLarge} />
        </nav>

        <div className="mt-auto space-y-1">
          <div className="mb-2 border-t border-white/10 pt-3">
            <SidebarUserInfo />
          </div>
          <div className="flex items-center gap-2">
            <NavItem href="/dashboard/settings" label="Settings" icon={FaGear} />
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#f8f7f4] p-8">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: IconType }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      <Icon className="text-sm" />
      {label}
    </Link>
  );
}
