import { NextResponse } from "next/server";
import { signInWithPassword } from "@/platform/persistence/supabase-rest";
import { setStoryAuthCookies } from "@/platform/identity/cookies";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const session = await signInWithPassword(body.email ?? "", body.password ?? "");
    return setStoryAuthCookies(NextResponse.json({ authenticated: true }), session);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not sign in.";
    return NextResponse.json({ error: /not configured/i.test(message) ? message : "Email or password is incorrect, or the account has not been verified yet." }, { status: /not configured/i.test(message) ? 503 : 401 });
  }
}
