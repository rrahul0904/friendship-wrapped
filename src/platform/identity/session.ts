import { cookies } from "next/headers";
import { getSupabaseUser } from "@/platform/persistence/supabase-rest";

export async function getStorySession() {
  const store = await cookies();
  const token = store.get("story_access_token")?.value ?? null;
  if (!token) return null;
  try {
    const user = await getSupabaseUser(token);
    return { token, user };
  } catch {
    return null;
  }
}

export async function requireStorySession() {
  const session = await getStorySession();
  if (!session) throw new Error("AUTH_REQUIRED");
  return session;
}
