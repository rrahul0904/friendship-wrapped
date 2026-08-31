import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/entitlements/route";

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  process.env.ENTITLEMENT_SIGNING_SECRET = "entitlement-test-secret-long-enough";
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.ENTITLEMENT_SIGNING_SECRET;
  vi.unstubAllGlobals();
});

function sessionResponse(overrides: Record<string, unknown>) {
  return new Response(JSON.stringify({
    id: "cs_test_route123",
    status: "complete",
    payment_status: "paid",
    metadata: { entitlement: "threadtales-premium" },
    ...overrides,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

async function recover(overrides: Record<string, unknown>) {
  const fetchSpy = vi.fn(async (...args: Parameters<typeof fetch>): Promise<Response> => {
    void args;
    return sessionResponse(overrides);
  });
  vi.stubGlobal("fetch", fetchSpy);
  const response = await GET(new Request("https://threadtales.test/api/entitlements?session_id=cs_test_route123"));
  return { response, fetchSpy };
}

describe("premium Checkout Session recovery", () => {
  it("issues an entitlement only for a completed paid matching session", async () => {
    const { response, fetchSpy } = await recover({});
    expect(response.status).toBe(200);
    const data = await response.json() as { token?: string; product?: string };
    expect(data.product).toBe("threadtales-premium");
    expect(data.token).toMatch(/\./);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["unpaid", { payment_status: "unpaid" }],
    ["no_payment_required", { payment_status: "no_payment_required" }],
    ["expired", { status: "expired", payment_status: "unpaid" }],
    ["wrong entitlement", { metadata: { entitlement: "something-else" } }],
  ])("rejects %s sessions", async (_label, overrides) => {
    const { response } = await recover(overrides as Record<string, unknown>);
    expect(response.status).toBe(403);
    const data = await response.json() as { error?: string };
    expect(data.error).toMatch(/completed paid ThreadTales Premium/i);
  });

  it("does not trust a success query parameter without a session id", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const response = await GET(new Request("https://threadtales.test/api/entitlements?success=true"));
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects an invalid Checkout Session id before networking", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const response = await GET(new Request("https://threadtales.test/api/entitlements?session_id=not-a-session"));
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
