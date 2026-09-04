import { NextResponse } from "next/server";
import { verifyStripeWebhookSignature } from "@/platform/billing/stripe-rest";
import { fulfillVerifiedStripeWebhook } from "@/platform/entitlements/stripe-fulfillment";
import { hasProcessedStripeEvent, reconcileSubscriptionEvent, recordStripeEvent } from "@/platform/billing/stripe-subscriptions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  const rawBody = await request.text();
  try {
    if (!verifyStripeWebhookSignature(rawBody, signature)) return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Webhook validation failed.";
    return NextResponse.json({ error: message }, { status: /not configured/i.test(message) ? 503 : 400 });
  }
  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try { event = JSON.parse(rawBody) as typeof event; }
  catch { return NextResponse.json({ error: "Invalid Stripe event payload." }, { status: 400 }); }
  if (!event.id || !event.type || !/^evt_[A-Za-z0-9_]+$/.test(event.id)) return NextResponse.json({ error: "Invalid Stripe event." }, { status: 400 });
  try {
    if (await hasProcessedStripeEvent(event.id)) return NextResponse.json({ received: true, replay: true, id: event.id, type: event.type });
    const entitlement = await fulfillVerifiedStripeWebhook(event);
    const subscription = await reconcileSubscriptionEvent(event);
    await recordStripeEvent(event.id, event.type);
    return NextResponse.json({ received: true, id: event.id, type: event.type, entitlement, subscription });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Stripe event persistence failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
