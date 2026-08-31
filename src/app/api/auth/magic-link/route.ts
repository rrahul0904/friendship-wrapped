import { NextResponse } from "next/server";
import { sendMagicLink } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email?: string };
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    await sendMagicLink(email.trim().toLowerCase(), `${origin}/auth/confirm`);
    return NextResponse.json({ sent: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not send a sign-in link.";
    return NextResponse.json({ error: message }, { status: /not configured/i.test(message) ? 503 : 400 });
  }
}
