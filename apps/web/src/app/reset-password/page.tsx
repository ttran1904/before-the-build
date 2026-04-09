"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaHouse } from "react-icons/fa6";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase will set the session from the URL hash after redirect
    const supabase = createSupabaseBrowserClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f7f4]">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-xl shadow-black/5">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <FaHouse className="text-xl text-[#2d5a3d]" />
            <span className="text-xl font-bold text-[#1a1a2e]">Before The Build</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[#1a1a2e]">Set new password</h1>
          <p className="mt-2 text-sm text-[#6a6a7a]">Enter your new password below</p>
        </div>

        {!ready ? (
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
            Loading your reset session... If this takes too long,{" "}
            <Link href="/forgot-password" className="font-semibold underline">
              request a new reset link
            </Link>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1a1a2e]">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#d5d3cd] bg-white px-4 py-2.5 text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/20"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1a1a2e]">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-[#d5d3cd] bg-white px-4 py-2.5 text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/20"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#2d5a3d] py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31] disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
