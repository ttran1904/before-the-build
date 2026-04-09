"use client";

import { useState } from "react";
import Link from "next/link";
import { FaHouse } from "react-icons/fa6";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f7f4]">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-xl shadow-black/5">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <FaHouse className="text-xl text-[#2d5a3d]" />
            <span className="text-xl font-bold text-[#1a1a2e]">Before The Build</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[#1a1a2e]">Reset your password</h1>
          <p className="mt-2 text-sm text-[#6a6a7a]">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
              Check your email for a password reset link. It may take a minute to arrive.
            </div>
            <Link
              href="/sign-in"
              className="block text-center text-sm font-semibold text-[#2d5a3d] hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1a1a2e]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#d5d3cd] bg-white px-4 py-2.5 text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/20"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#2d5a3d] py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[#6a6a7a]">
          Remember your password?{" "}
          <Link href="/sign-in" className="font-semibold text-[#2d5a3d] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
