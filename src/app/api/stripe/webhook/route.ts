import { NextResponse } from "next/server";
import { verifyStripeWebhookSignature } from "@/platform/billing/stripe-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  const rawBody = await request.text();

  try {
    if (!verifyStripeWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
    }
    const event = JSON.parse(rawBody) as { id?: string; type?: string };
    return NextResponse.json({ received: true, id: event.id ?? null, type: event.type ?? null });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Webhook validation failed.";
    return NextResponse.json({ error: message }, { status: /not configured/i.test(message) ? 503 : 400 });
  }
}
