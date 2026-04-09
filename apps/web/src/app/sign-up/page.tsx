"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaHouse, FaGoogle } from "react-icons/fa6";
import { useAuth } from "@/lib/auth-context";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

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
    const { error } = await signUpWithEmail(email, password);
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
          <h1 className="mt-6 text-2xl font-bold text-[#1a1a2e]">Create your account</h1>
          <p className="mt-2 text-sm text-[#6a6a7a]">Start planning your dream renovation</p>
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1a1a2e]">Confirm Password</label>
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#e8e6e1]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-[#6a6a7a]">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#d5d3cd] bg-white py-2.5 text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#f8f7f4] disabled:opacity-50"
        >
          <FaGoogle className="text-base" />
          {googleLoading ? "Redirecting..." : "Sign up with Google"}
        </button>

        <p className="text-center text-sm text-[#6a6a7a]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-[#2d5a3d] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
