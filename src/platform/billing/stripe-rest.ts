import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";

function stripeSecret() {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return value;
}

async function stripeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      ...(init.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message ?? "Stripe request failed.");
  return data;
}

export interface StripeCheckoutSession {
  id: string;
  url?: string | null;
  payment_status?: "paid" | "unpaid" | "no_payment_required";
  status?: "open" | "complete" | "expired";
  metadata?: Record<string, string>;
  customer_details?: { email?: string | null } | null;
}

export async function createPremiumCheckout(origin: string, mode: string) {
  const price = process.env.STRIPE_PRICE_THREADTALES_PREMIUM;
  if (!price) throw new Error("STRIPE_PRICE_THREADTALES_PREMIUM is not configured.");
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("line_items[0][price]", price);
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/create?mode=${encodeURIComponent(mode)}`);
  body.set("customer_creation", "always");
  body.set("metadata[entitlement]", "threadtales-premium");
  body.set("metadata[mode]", mode.slice(0, 80));
  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", { method: "POST", body: body.toString() });
}

export function retrieveCheckoutSession(sessionId: string) {
  if (!/^cs_(?:test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) throw new Error("Invalid Checkout Session id.");
  return stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

function webhookSecret() {
  const value = process.env.STRIPE_WEBHOOK_SECRET;
  if (!value) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  return value;
}

export function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string, toleranceSeconds = 300) {
  const entries = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
  const timestamp = entries.find(([key]) => key === "t")?.[1];
  const signatures = entries.filter(([key]) => key === "v1").map(([, value]) => value).filter(Boolean);
  if (!timestamp || !signatures.length) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > toleranceSeconds) return false;
  const expected = createHmac("sha256", webhookSecret()).update(`${timestamp}.${rawBody}`).digest("hex");
  return signatures.some((signature) => {
    try {
      const expectedBuffer = Buffer.from(expected, "hex");
      const actualBuffer = Buffer.from(signature, "hex");
      return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  });
}
