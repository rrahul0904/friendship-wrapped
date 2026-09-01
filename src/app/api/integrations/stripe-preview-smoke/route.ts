import { NextResponse } from "next/server";
import { createPremiumCheckout } from "@/platform/billing/stripe-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret?.startsWith("sk_test_")) {
    return NextResponse.json(
      { error: "Preview Stripe test secret is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!process.env.STRIPE_PRICE_THREADTALES_PREMIUM) {
    return NextResponse.json(
      { error: "Preview Stripe price is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const session = await createPremiumCheckout(origin, "friends");
    return NextResponse.json(
      {
        ok: true,
        sessionId: session.id,
        hasCheckoutUrl: Boolean(session.url),
        environment: "preview-test",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Stripe preview smoke failed.";
    return NextResponse.json(
      { error: message },
      { status: /not configured/i.test(message) ? 503 : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
