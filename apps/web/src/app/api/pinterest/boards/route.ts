import { NextRequest, NextResponse } from "next/server";

const PINTEREST_API = "https://api.pinterest.com/v5";

/**
 * GET /api/pinterest/boards
 * Fetches the authenticated user's Pinterest boards and their pins.
 * Returns boards with pin image URLs ready for import.
 */
export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get("pinterest_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ connected: false, boards: [] }, { status: 200 });
  }

  const headers = { Authorization: `Bearer ${accessToken}` };

  try {
    // 1. Fetch all boards
    const boardsRes = await fetch(`${PINTEREST_API}/boards?page_size=25`, { headers });

    if (boardsRes.status === 401) {
      // Token expired — try refresh
      const refreshed = await refreshToken(req);
      if (!refreshed) {
        return NextResponse.json({ connected: false, expired: true, boards: [] });
      }
      // Retry with new token
      const retryRes = await fetch(`${PINTEREST_API}/boards?page_size=25`, {
        headers: { Authorization: `Bearer ${refreshed.accessToken}` },
      });
      const retryData = await retryRes.json();
      const boards = await fetchPinsForBoards(retryData.items || [], refreshed.accessToken);
      const res = NextResponse.json({ connected: true, boards });
      setTokenCookie(res, refreshed.accessToken, refreshed.expiresIn);
      return res;
    }

    if (!boardsRes.ok) {
      const err = await boardsRes.text();
      console.error("Pinterest boards fetch failed:", err);
      return NextResponse.json({ connected: true, boards: [], error: "fetch_failed" });
    }

    const boardsData = await boardsRes.json();
    const boards = await fetchPinsForBoards(boardsData.items || [], accessToken);

    return NextResponse.json({ connected: true, boards });
  } catch (err) {
    console.error("Pinterest API error:", err);
    return NextResponse.json({ connected: false, boards: [], error: "exception" });
  }
}

async function fetchPinsForBoards(
  boards: Array<{ id: string; name: string; pin_count?: number; media?: { images?: Record<string, { url: string }> } }>,
  accessToken: string
) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const results = [];

  for (const board of boards) {
    try {
      const pinsRes = await fetch(
        `${PINTEREST_API}/boards/${board.id}/pins?page_size=50`,
        { headers }
      );
      const pinsData = pinsRes.ok ? await pinsRes.json() : { items: [] };
      const pins = (pinsData.items || []).map((pin: {
        id: string;
        title?: string;
        description?: string;
        link?: string;
        media?: { images?: Record<string, { url: string; width: number; height: number }> };
      }) => {
        // Get the best image URL available
        const images = pin.media?.images || {};
        const imageUrl =
          images["1200x"]?.url ||
          images["600x"]?.url ||
          images["400x300"]?.url ||
          images["originals"]?.url ||
          "";
        return {
          id: pin.id,
          title: pin.title || pin.description || "",
          imageUrl,
          sourceUrl: pin.link || "",
        };
      });

      results.push({
        id: board.id,
        name: board.name,
        pinCount: board.pin_count || pins.length,
        pins,
      });
    } catch {
      results.push({ id: board.id, name: board.name, pinCount: 0, pins: [] });
    }
  }

  return results;
}

async function refreshToken(req: NextRequest) {
  const refreshTokenVal = req.cookies.get("pinterest_refresh_token")?.value;
  const appId = process.env.PINTEREST_APP_ID;
  const appSecret = process.env.PINTEREST_APP_SECRET;

  if (!refreshTokenVal || !appId || !appSecret) return null;

  const credentials = Buffer.from(`${appId}:${appSecret}`).toString("base64");

  try {
    const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshTokenVal,
      }).toString(),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      accessToken: data.access_token as string,
      expiresIn: (data.expires_in as number) || 2592000,
    };
  } catch {
    return null;
  }
}

function setTokenCookie(res: NextResponse, token: string, expiresIn: number) {
  res.cookies.set("pinterest_access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiresIn,
    path: "/",
  });
}
