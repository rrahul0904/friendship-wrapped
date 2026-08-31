import { NextResponse } from "next/server";
import { isProductEntitlementId, stripePriceIdFor } from "@/platform/entitlements/catalog";

export const runtime = "nodejs";

interface CheckoutRequest {
  product?: unknown;
  returnPath?: unknown;
}

interface StripeCheckoutSession {
  id?: string;
  object?: string;
  url?: string | null;
}

function safeReturnPath(value: unknown) {
  if (typeof value !== "string") return "/create";
  if (!value.startsWith("/") || value.startsWith("//") || value.length > 300) return "/create";
  return value;
}

function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Checkout is not configured yet." }, { status: 503 });
  }

  let body: CheckoutRequest;
  try {
    body = await request.json() as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  if (!isProductEntitlementId(body.product)) {
    return NextResponse.json({ error: "Unsupported product." }, { status: 400 });
  }

  const priceId = stripePriceIdFor(body.product);
  if (!priceId) {
    return NextResponse.json({ error: "This product is not configured for checkout yet." }, { status: 503 });
  }

  const returnPath = safeReturnPath(body.returnPath);
  const origin = siteOrigin(request);
  const successUrl = `${origin}${returnPath}${returnPath.includes("?") ? "&" : "?"}checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}${returnPath}${returnPath.includes("?") ? "&" : "?"}checkout=cancelled`;

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl);
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("metadata[product]", body.product);
  form.set("payment_intent_data[metadata][product]", body.product);
  form.set("allow_promotion_codes", "true");
  form.set("submit_type", "pay");

  let stripeResponse: Response;
  try {
    stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Checkout provider is temporarily unavailable." }, { status: 502 });
  }

  if (!stripeResponse.ok) {
    console.error("Stripe Checkout Session creation failed", { status: stripeResponse.status });
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 502 });
  }

  const session = await stripeResponse.json() as StripeCheckoutSession;
  if (session.object !== "checkout.session" || !session.id || !session.url) {
    return NextResponse.json({ error: "Checkout provider returned an invalid session." }, { status: 502 });
  }

  return NextResponse.json({ url: session.url }, { status: 200 });
}
