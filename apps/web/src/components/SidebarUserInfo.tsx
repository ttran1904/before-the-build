"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function SidebarUserInfo() {
  const { user } = useAuth();

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const name = user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name;
  const initial = (name || user.email || "U").charAt(0).toUpperCase();

  return (
    <Link
      href="/dashboard/settings"
      className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/10"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-8 w-8 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {name || "My Account"}
        </p>
        <p className="truncate text-xs text-white/60">{user.email}</p>
      </div>
    </Link>
  );
}
