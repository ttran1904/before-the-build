"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHouse, FaBookOpen, FaCompass, FaTableCellsLarge, FaGear, FaClipboardList, FaCircleQuestion, FaTag,
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
      {/* Sidebar — cozy lodge */}
      <aside className="sticky top-0 flex h-screen w-60 flex-col bg-gradient-to-b from-[#2d5a3d] via-[#264e34] to-[#1f4029] p-5 text-white shadow-[inset_-1px_0_0_rgba(0,0,0,0.15)]">
        {/* Brand */}
        <Link href="/dashboard" className="mb-6 flex items-center justify-center group">
          <Image
            src="/brand/logo-on-green.png"
            alt="Before The Build"
            width={646}
            height={342}
            priority
            className="h-14 w-auto transition group-hover:scale-105"
          />
        </Link>

        {/* Primary nav */}
        <nav className="flex flex-col gap-0.5">
          <SectionLabel>Overview</SectionLabel>
          <NavItem href="/dashboard" label="Home" icon={FaHouse} exact />
          <NavItem href="/explore" label="Explore" icon={FaCompass} />

          <SectionLabel className="mt-4">Your projects</SectionLabel>
          <NavItem href="/dashboard/groundwork" label="Groundwork Scope" icon={FaClipboardList} />
          <NavItem href="/dashboard/build-books" label="Build Books" icon={FaBookOpen} />
          <NavItem href="/dashboard/idea-boards" label="Ideas" icon={FaTableCellsLarge} />

          <SectionLabel className="mt-4">Help</SectionLabel>
          <NavItem href="/dashboard/guide" label="Guide" icon={FaCircleQuestion} />
          <NavItem href="/dashboard/plans" label="Plans" icon={FaTag} />
        </nav>

        {/* Footer */}
        <div className="mt-auto space-y-1 pt-4">
          <div className="mb-2 border-t border-white/10 pt-3">
            <SidebarUserInfo />
          </div>
          <NavItem href="/dashboard/settings" label="Settings" icon={FaGear} />
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

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 ${className}`}>
      {children}
    </div>
  );
}

function NavItem({ href, label, icon: Icon, exact = false }: { href: string; label: string; icon: IconType; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname?.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={
        active
          ? "relative flex items-center gap-3 rounded-lg bg-[#f9f3e3] px-3 py-2 text-sm font-semibold text-[#2d5a3d] shadow-sm"
          : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
      }
    >
      {active && <span aria-hidden className="absolute -left-5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#c08a5a]" />}
      <Icon className={active ? "text-[#c08a5a]" : "text-sm opacity-80"} />
      <span>{label}</span>
    </Link>
  );
}
