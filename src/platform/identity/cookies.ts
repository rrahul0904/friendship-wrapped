import { NextResponse } from "next/server";
import type { SupabaseSessionResponse } from "@/platform/persistence/supabase-rest";

const secure = process.env.NODE_ENV === "production";

export function setStoryAuthCookies(response: NextResponse, session: SupabaseSessionResponse) {
  const accessMaxAge = Math.max(60, Math.min(session.expires_in || 3600, 60 * 60 * 24));
  response.cookies.set("story_access_token", session.access_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: accessMaxAge });
  if (session.refresh_token) response.cookies.set("story_refresh_token", session.refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}

export function clearStoryAuthCookies(response: NextResponse) {
  response.cookies.set("story_access_token", "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("story_refresh_token", "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
