import { NextResponse } from "next/server";
import { sendPasswordRecovery } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email?: string };
    const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    if (email) await sendPasswordRecovery(email, `${origin}/auth/confirm?next=/reset-password`);
    return NextResponse.json({ sent: true, message: "If that address is registered, a password reset email is on its way." });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not start password recovery.";
    if (/not configured/i.test(message)) return NextResponse.json({ error: message }, { status: 503 });
    return NextResponse.json({ sent: true, message: "If that address is registered, a password reset email is on its way." });
  }
}
