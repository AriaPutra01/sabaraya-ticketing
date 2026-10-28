import { NextRequest, NextResponse } from "next/server";
import { revokeRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("sbr_refresh_token")?.value;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  const res = NextResponse.json({ success: true, message: "Logout berhasil." });

  res.cookies.set("sbr_access_token", "", { path: "/", maxAge: 0 });
  res.cookies.set("sbr_refresh_token", "", { path: "/", maxAge: 0 });

  return res;
}
