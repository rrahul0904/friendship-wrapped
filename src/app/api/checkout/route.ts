import { NextResponse } from "next/server";
import { createPremiumCheckout } from "@/platform/billing/stripe-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { mode?: string };
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const session = await createPremiumCheckout(origin.replace(/\/$/, ""), body.mode ?? "friends");
    if (!session.url) return NextResponse.json({ error: "Stripe did not return a Checkout URL." }, { status: 502 });
    return NextResponse.json({ url: session.url });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Checkout is unavailable.";
    const status = /not configured/i.test(message) ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
