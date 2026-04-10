import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/pinterest/status
 * Checks if user has a valid Pinterest connection (token in cookies).
 */
export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get("pinterest_access_token")?.value;
  return NextResponse.json({ connected: !!accessToken });
}

/**
 * DELETE /api/pinterest/status
 * Disconnects Pinterest by clearing tokens.
 */
export async function DELETE() {
  const res = NextResponse.json({ disconnected: true });
  res.cookies.delete("pinterest_access_token");
  res.cookies.delete("pinterest_refresh_token");
  return res;
}
