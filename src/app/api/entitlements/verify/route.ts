import { NextResponse } from "next/server";
import { FRIENDSHIP_PREMIUM_PRODUCT, stripePriceIdFor } from "@/platform/entitlements/catalog";
import type { EntitlementSnapshot } from "@/platform/entitlements/types";

export const runtime = "nodejs";

interface StripePrice {
  id?: string;
}

interface StripeLineItem {
  price?: StripePrice | string | null;
}

interface StripeCheckoutSession {
  object?: string;
  payment_status?: string;
  metadata?: Record<string, string> | null;
  line_items?: { data?: StripeLineItem[] } | null;
}

function isSessionId(value: string | null): value is string {
  return Boolean(value && value.length <= 200 && /^cs_[A-Za-z0-9_]+$/.test(value));
}

function lineItemPriceId(session: StripeCheckoutSession) {
  const price = session.line_items?.data?.[0]?.price;
  if (typeof price === "string") return price;
  return price?.id ?? "";
}

export async function GET(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const expectedPriceId = stripePriceIdFor(FRIENDSHIP_PREMIUM_PRODUCT);
  if (!secret || !expectedPriceId) {
    return NextResponse.json({ entitled: false, error: "Entitlement verification is not configured yet." }, { status: 503 });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!isSessionId(sessionId)) {
    return NextResponse.json({ entitled: false, error: "Invalid checkout session." }, { status: 400 });
  }

  const endpoint = new URL(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  endpoint.searchParams.append("expand[]", "line_items.data.price");

  let stripeResponse: Response;
  try {
    stripeResponse = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ entitled: false, error: "Unable to verify purchase right now." }, { status: 502 });
  }

  if (!stripeResponse.ok) {
    return NextResponse.json({ entitled: false }, { status: stripeResponse.status === 404 ? 404 : 502 });
  }

  const session = await stripeResponse.json() as StripeCheckoutSession;
  const entitled = session.object === "checkout.session"
    && session.payment_status === "paid"
    && session.metadata?.product === FRIENDSHIP_PREMIUM_PRODUCT
    && lineItemPriceId(session) === expectedPriceId;

  if (!entitled) return NextResponse.json({ entitled: false }, { status: 200 });

  const snapshot: EntitlementSnapshot = {
    entitled: true,
    product: FRIENDSHIP_PREMIUM_PRODUCT,
    source: "stripe_checkout",
    verifiedAt: new Date().toISOString(),
  };

  return NextResponse.json(snapshot, {
    status: 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
