import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { createSubscriptionCheckout } from "@/platform/billing/stripe-subscriptions";
import { isPlanSlug, type BillingInterval } from "@/platform/billing/plans";

export const runtime = "nodejs";

function releaseOrigin(request: Request) {
  if (process.env.VERCEL_ENV === "preview") return new URL(request.url).origin;
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const session = await requireStorySession();
    const body = await request.json() as { plan?: unknown; interval?: unknown };
    if (!isPlanSlug(body.plan) || body.plan === "free") return NextResponse.json({ error: "Choose a paid plan." }, { status: 400 });
    const interval: BillingInterval | null = body.interval === "month" || body.interval === "year" ? body.interval : null;
    if (!interval) return NextResponse.json({ error: "Choose monthly or annual billing." }, { status: 400 });
    const checkout = await createSubscriptionCheckout({ userId: session.user.id, email: session.user.email, plan: body.plan, interval, origin: releaseOrigin(request) });
    if (!checkout.url) throw new Error("Stripe did not return a Checkout URL.");
    return NextResponse.json({ checkoutUrl: checkout.url, sessionId: checkout.id });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not start subscription checkout.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
