"use client";

import { useState, useEffect } from "react";
import { FaGoogle, FaCheck, FaLink, FaLinkSlash } from "react-icons/fa6";
import { useAuth } from "@/lib/auth-context";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function SettingsPage() {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Google linked status
  const googleIdentity = user?.identities?.find((i) => i.provider === "google");
  const emailIdentity = user?.identities?.find((i) => i.provider === "email");
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const nameFromGoogle = user?.user_metadata?.full_name || user?.user_metadata?.name;

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || nameFromGoogle || "");
    }
  }, [user, nameFromGoogle]);

  const handleSaveName = async () => {
    setSaving(true);
    setSaved(false);
    await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setPasswordLoading(true);
    setPasswordMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setPasswordMsg(error.message);
    } else {
      setPasswordMsg("Check your email for a password reset link.");
    }
    setPasswordLoading(false);
  };

  const handleLinkGoogle = async () => {
    await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      },
    });
  };

  const initial = (displayName || nameFromGoogle || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Settings</h1>
        <p className="mt-1 text-sm text-[#6a6a7a]">Manage your profile and account</p>
      </div>

      {/* Profile Section */}
      <section className="rounded-2xl border border-[#e8e6e1] bg-white p-6">
        <h2 className="mb-5 text-lg font-semibold text-[#1a1a2e]">Profile</h2>

        {/* Avatar */}
        <div className="mb-6 flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-16 w-16 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2d5a3d] text-2xl font-bold text-white">
              {initial}
            </div>
          )}
          <div>
            <p className="font-medium text-[#1a1a2e]">{displayName || nameFromGoogle || "No name set"}</p>
            <p className="text-sm text-[#6a6a7a]">{user?.email}</p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#1a1a2e]">Display Name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 rounded-lg border border-[#d5d3cd] bg-white px-4 py-2.5 text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/20"
              placeholder="Your name"
            />
            <button
              onClick={handleSaveName}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31] disabled:opacity-50"
            >
              {saved ? (
                <>
                  <FaCheck className="text-xs" /> Saved
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Connected Accounts */}
      <section className="rounded-2xl border border-[#e8e6e1] bg-white p-6">
        <h2 className="mb-5 text-lg font-semibold text-[#1a1a2e]">Connected Accounts</h2>

        <div className="flex items-center justify-between rounded-xl border border-[#e8e6e1] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f7f4]">
              <FaGoogle className="text-lg" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1a1a2e]">Google</p>
              {googleIdentity ? (
                <p className="text-xs text-[#2d5a3d]">
                  Connected as {googleIdentity.identity_data?.email || "linked"}
                </p>
              ) : (
                <p className="text-xs text-[#6a6a7a]">Not connected</p>
              )}
            </div>
          </div>
          {googleIdentity ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2d5a3d]/10 px-3 py-1 text-xs font-medium text-[#2d5a3d]">
              <FaLink className="text-[10px]" /> Connected
            </span>
          ) : (
            <button
              onClick={handleLinkGoogle}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d5d3cd] px-3 py-1.5 text-xs font-medium text-[#1a1a2e] transition hover:bg-[#f8f7f4]"
            >
              <FaLinkSlash className="text-[10px]" /> Connect
            </button>
          )}
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-[#e8e6e1] bg-white p-6">
        <h2 className="mb-5 text-lg font-semibold text-[#1a1a2e]">Security</h2>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-[#1a1a2e]">Change Password</p>
            <p className="text-xs text-[#6a6a7a]">
              {emailIdentity
                ? "We'll send a confirmation link to your email to reset your password."
                : "You signed up with Google. Set a password to also enable email login."}
            </p>
          </div>

          {passwordMsg && (
            <div
              className={`rounded-lg p-3 text-sm ${
                passwordMsg.includes("Check your email")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {passwordMsg}
            </div>
          )}

          <button
            onClick={handlePasswordReset}
            disabled={passwordLoading}
            className="rounded-lg border border-[#d5d3cd] px-4 py-2 text-sm font-medium text-[#1a1a2e] transition hover:bg-[#f8f7f4] disabled:opacity-50"
          >
            {passwordLoading ? "Sending..." : "Send Password Reset Email"}
          </button>
        </div>
      </section>

      {/* Account Info */}
      <section className="rounded-2xl border border-[#e8e6e1] bg-white p-6">
        <h2 className="mb-5 text-lg font-semibold text-[#1a1a2e]">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6a6a7a]">Email</span>
            <span className="font-medium text-[#1a1a2e]">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6a6a7a]">Member since</span>
            <span className="font-medium text-[#1a1a2e]">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
