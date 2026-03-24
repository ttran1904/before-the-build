"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaHouse } from "react-icons/fa6";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
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
          <h1 className="mt-6 text-2xl font-bold text-[#1a1a2e]">Welcome back</h1>
          <p className="mt-2 text-sm text-[#6a6a7a]">Sign in to continue your renovation journey</p>
        </div>

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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1a1a2e]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#d5d3cd] bg-white px-4 py-2.5 text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/20"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2d5a3d] py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-[#6a6a7a]">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-semibold text-[#2d5a3d] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
