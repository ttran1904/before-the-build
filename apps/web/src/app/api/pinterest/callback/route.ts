import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/pinterest/callback
 * Handles the OAuth redirect from Pinterest, exchanges code for access token,
 * and stores the token in a secure cookie for subsequent API calls.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("pinterest_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      new URL("/dashboard/idea-boards?pinterest=error&reason=invalid_state", req.nextUrl.origin)
    );
  }

  const appId = process.env.PINTEREST_APP_ID;
  const appSecret = process.env.PINTEREST_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.redirect(
      new URL("/dashboard/idea-boards?pinterest=error&reason=not_configured", req.nextUrl.origin)
    );
  }

  const redirectUri = `${req.nextUrl.origin}/api/pinterest/callback`;
  const credentials = Buffer.from(`${appId}:${appSecret}`).toString("base64");

  try {
    const tokenRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Pinterest token exchange failed:", err);
      return NextResponse.redirect(
        new URL("/dashboard/idea-boards?pinterest=error&reason=token_failed", req.nextUrl.origin)
      );
    }

    const tokenData = await tokenRes.json();

    // Honor the optional next-cookie set in /api/pinterest/auth so we can
    // bring the user back to the wizard step (or wherever they came from).
    const nextPath = req.cookies.get("pinterest_oauth_next")?.value || "/dashboard/idea-boards";
    const safeNext = nextPath.startsWith("/") ? nextPath : "/dashboard/idea-boards";
    const sep = safeNext.includes("?") ? "&" : "?";
    const res = NextResponse.redirect(
      new URL(`${safeNext}${sep}pinterest=connected`, req.nextUrl.origin)
    );

    res.cookies.set("pinterest_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 2592000, // 30 days
      path: "/",
    });

    if (tokenData.refresh_token) {
      res.cookies.set("pinterest_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokenData.refresh_token_expires_in || 5184000, // 60 days
        path: "/",
      });
    }

    // Clear the state cookie
    res.cookies.delete("pinterest_oauth_state");
    res.cookies.delete("pinterest_oauth_next");

    return res;
  } catch (err) {
    console.error("Pinterest OAuth error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/idea-boards?pinterest=error&reason=exception", req.nextUrl.origin)
    );
  }
}
