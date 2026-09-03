import { NextResponse } from "next/server";
import { verifyStripeWebhookSignature } from "@/platform/billing/stripe-rest";
import { fulfillVerifiedStripeWebhook } from "@/platform/entitlements/stripe-fulfillment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  const rawBody = await request.text();

  try {
    if (!verifyStripeWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Webhook validation failed.";
    return NextResponse.json({ error: message }, { status: /not configured/i.test(message) ? 503 : 400 });
  }

  let event: { id?: string; type?: string };
  try {
    event = JSON.parse(rawBody) as { id?: string; type?: string };
  } catch {
    return NextResponse.json({ error: "Invalid Stripe event payload." }, { status: 400 });
  }

  try {
    const result = await fulfillVerifiedStripeWebhook(event);
    return NextResponse.json({
      received: true,
      id: event.id ?? null,
      type: event.type ?? null,
      ...result,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Entitlement persistence failed.";
    // A valid Stripe event must be retried when our durable entitlement store is unavailable.
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
