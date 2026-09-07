import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

type Profile = { user_id: string; display_name: string | null; avatar_media_id: string | null; timezone: string | null; locale: string | null; onboarding_completed: boolean; interests: string[] };

export async function GET() {
  try {
    const session = await requireStorySession();
    const rows = await supabaseRest<Profile[]>(`profiles?user_id=eq.${encodeURIComponent(session.user.id)}&select=user_id,display_name,avatar_media_id,timezone,locale,onboarding_completed,interests`, session.token);
    return NextResponse.json({ profile: rows[0] ?? null, user: { id: session.user.id, email: session.user.email ?? null } });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load profile.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireStorySession();
    const body = await request.json() as { displayName?: string; timezone?: string; locale?: string; onboardingCompleted?: boolean; interests?: string[] };
    const displayName = body.displayName?.trim().slice(0, 80) || session.user.user_metadata?.display_name?.toString().slice(0, 80) || "Story keeper";
    const payload = {
      user_id: session.user.id,
      display_name: displayName,
      timezone: body.timezone?.slice(0, 80) || null,
      locale: body.locale?.slice(0, 24) || "en-US",
      onboarding_completed: Boolean(body.onboardingCompleted),
      interests: Array.isArray(body.interests) ? body.interests.filter((value) => typeof value === "string").slice(0, 10) : [],
      updated_at: new Date().toISOString(),
    };
    const rows = await supabaseRest<Profile[]>("profiles?on_conflict=user_id", session.token, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(payload) });
    return NextResponse.json({ profile: rows[0] ?? payload });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not update profile.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
