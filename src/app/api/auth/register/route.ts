import { NextResponse } from "next/server";
import { signUpWithPassword } from "@/platform/persistence/supabase-rest";
import { setStoryAuthCookies } from "@/platform/identity/cookies";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string; displayName?: string; termsAccepted?: boolean; privacyAccepted?: boolean };
    if (!body.termsAccepted || !body.privacyAccepted) return NextResponse.json({ error: "Accept the Terms and Privacy Policy to create an account." }, { status: 400 });
    const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    const session = await signUpWithPassword(body.email ?? "", body.password ?? "", body.displayName ?? "", `${origin}/login?verified=1`);
    const response = NextResponse.json({ registered: true, verificationRequired: !session.access_token });
    return session.access_token ? setStoryAuthCookies(response, session) : response;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not create account.";
    const status = /not configured/i.test(message) ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
