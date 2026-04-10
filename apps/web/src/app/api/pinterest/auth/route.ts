import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GET /api/pinterest/auth
 * Redirects user to Pinterest OAuth page to connect their account.
 */
export async function GET(req: NextRequest) {
  const appId = process.env.PINTEREST_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "Pinterest app not configured" }, { status: 500 });
  }

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/pinterest/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  // Store state in a short-lived cookie for CSRF validation
  const oauthUrl = new URL("https://www.pinterest.com/oauth/");
  oauthUrl.searchParams.set("client_id", appId);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("response_type", "code");
  oauthUrl.searchParams.set("scope", "boards:read,pins:read");
  oauthUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(oauthUrl.toString());
  res.cookies.set("pinterest_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return res;
}
