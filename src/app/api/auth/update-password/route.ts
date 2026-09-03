import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { updateSupabasePassword } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireStorySession();
    const { password } = await request.json() as { password?: string };
    await updateSupabasePassword(session.token, password ?? "");
    return NextResponse.json({ updated: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not update password.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Your reset session has expired. Request another recovery email." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
