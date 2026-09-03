import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/stripe/webhook/route";

const webhookSecret = "whsec_test_webhook_secret";

function signedRequest(payload: Record<string, unknown>, signature = true) {
  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const value = signature
    ? createHmac("sha256", webhookSecret).update(`${timestamp}.${rawBody}`).digest("hex")
    : "0".repeat(64);
  return new Request("https://threadtales.test/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": `t=${timestamp},v1=${value}` },
    body: rawBody,
  });
}

function completedCheckout() {
  return {
    id: "evt_test_no_customer_data",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_webhook123",
        payment_status: "paid",
        metadata: { entitlement: "threadtales-premium" },
        customer_details: { email: "not-persisted@example.test" },
      },
    },
  };
}

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
});

afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  vi.unstubAllGlobals();
});

describe("Stripe webhook fulfillment", () => {
  it("accepts a signed paid checkout while persistence is intentionally unavailable", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await POST(signedRequest(completedCheckout()));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ received: true, fulfilled: true, persisted: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("upserts only the entitlement reference when Supabase is configured", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://threadtales.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    const fetchSpy = vi.fn(async (...args: Parameters<typeof fetch>): Promise<Response> => {
      void args;
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const response = await POST(signedRequest(completedCheckout()));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ received: true, fulfilled: true, persisted: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("https://threadtales.supabase.co/rest/v1/entitlements?on_conflict=provider%2Cprovider_reference");
    expect(JSON.parse(String(init?.body))).toEqual({
      user_id: null,
      product: "threadtales-premium",
      provider: "stripe",
      provider_reference: "cs_test_webhook123",
      status: "active",
      expires_at: null,
    });
    expect(String(init?.body)).not.toContain("not-persisted@example.test");
  });

  it("rejects an invalid signature before any persistence call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await POST(signedRequest(completedCheckout(), false));
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fulfill unpaid or unrelated events", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const event = completedCheckout();
    event.data.object.payment_status = "unpaid";

    const response = await POST(signedRequest(event));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ received: true, fulfilled: false, persisted: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns a retryable error when configured entitlement persistence fails", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://threadtales.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "database offline" }), { status: 500 })));

    const response = await POST(signedRequest(completedCheckout()));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ error: "database offline" });
  });
});
