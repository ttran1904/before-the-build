"use client";

import { useRouter } from "next/navigation";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import { useAuth } from "@/lib/auth-context";

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      <FaArrowRightFromBracket className="text-sm" />
      Sign Out
    </button>
  );
}
