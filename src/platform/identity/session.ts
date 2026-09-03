import { cookies } from "next/headers";
import { getSupabaseUser, refreshSupabaseSession } from "@/platform/persistence/supabase-rest";

export async function getStorySession() {
  const store = await cookies();
  const token = store.get("story_access_token")?.value ?? null;
  if (token) {
    try {
      const user = await getSupabaseUser(token);
      return { token, user };
    } catch {
      // Fall through to refresh if available.
    }
  }

  const refreshToken = store.get("story_refresh_token")?.value ?? null;
  if (!refreshToken) return null;
  try {
    const refreshed = await refreshSupabaseSession(refreshToken);
    const user = refreshed.user ?? await getSupabaseUser(refreshed.access_token);
    try {
      store.set("story_access_token", refreshed.access_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: Math.max(60, refreshed.expires_in || 3600) });
      if (refreshed.refresh_token) store.set("story_refresh_token", refreshed.refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    } catch {
      // Server Components may not be able to mutate cookies; the current request can still continue safely.
    }
    return { token: refreshed.access_token, user };
  } catch {
    return null;
  }
}

export async function requireStorySession() {
  const session = await getStorySession();
  if (!session) throw new Error("AUTH_REQUIRED");
  return session;
}

export async function isStoryAdmin() {
  const session = await getStorySession();
  if (!session) return false;
  return session.user.app_metadata?.role === "admin" || session.user.app_metadata?.admin === true;
}
