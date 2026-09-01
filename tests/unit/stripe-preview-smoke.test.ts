import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/integrations/stripe-preview-smoke/route";

beforeEach(() => {
  delete process.env.VERCEL_ENV;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PRICE_THREADTALES_PREMIUM;
});

afterEach(() => {
  delete process.env.VERCEL_ENV;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PRICE_THREADTALES_PREMIUM;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("preview-only Stripe checkout smoke probe", () => {
  it("is unavailable outside Vercel preview", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await GET(new Request("https://threadtales.example/api/integrations/stripe-preview-smoke"));
    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails closed when preview has no Stripe test key", async () => {
    process.env.VERCEL_ENV = "preview";
    process.env.STRIPE_PRICE_THREADTALES_PREMIUM = "price_test_123";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await GET(new Request("https://preview.example/api/integrations/stripe-preview-smoke"));
    expect(response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a live Stripe key in preview", async () => {
    process.env.VERCEL_ENV = "preview";
    process.env.STRIPE_SECRET_KEY = "sk_live_do_not_use";
    process.env.STRIPE_PRICE_THREADTALES_PREMIUM = "price_live_123";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await GET(new Request("https://preview.example/api/integrations/stripe-preview-smoke"));
    expect(response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates only a test Checkout Session and returns no secret or checkout URL", async () => {
    process.env.VERCEL_ENV = "preview";
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_PRICE_THREADTALES_PREMIUM = "price_test_123";

    const fetchSpy = vi.fn(async (...args: Parameters<typeof fetch>): Promise<Response> => {
      void args;
      return new Response(JSON.stringify({
        id: "cs_test_preview_probe",
        url: "https://checkout.stripe.test/c/pay/test",
        status: "open",
        payment_status: "unpaid",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const response = await GET(new Request("https://preview.example/api/integrations/stripe-preview-smoke"));
    expect(response.status).toBe(200);
    const data = await response.json() as Record<string, unknown>;
    expect(data).toEqual({
      ok: true,
      sessionId: "cs_test_preview_probe",
      hasCheckoutUrl: true,
      environment: "preview-test",
    });
    expect(JSON.stringify(data)).not.toContain("sk_test_fake");
    expect(JSON.stringify(data)).not.toContain("checkout.stripe.test");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/v1/checkout/sessions");
    const body = new URLSearchParams(String(init?.body));
    expect(body.get("line_items[0][price]")).toBe("price_test_123");
    expect(body.get("metadata[entitlement]")).toBe("threadtales-premium");
    expect(body.get("success_url")).toBe("https://preview.example/premium/success?session_id={CHECKOUT_SESSION_ID}");
    expect(body.get("cancel_url")).toBe("https://preview.example/create?mode=friends");
    expect(String(init?.body)).not.toMatch(/rawChat|chatMessages|participants|topWords|messageText/);
  });
});
