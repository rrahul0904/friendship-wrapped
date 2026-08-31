import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenAIStoryEnrichmentProvider, getStoryEnrichmentProvider } from "@/platform/ai/openai-provider";
import { validateStoryEnrichmentInput, type StoryEnrichmentInput } from "@/platform/ai/types";
import { createPremiumCheckout, verifyStripeWebhookSignature } from "@/platform/billing/stripe-rest";
import { createEntitlementToken, verifyEntitlementToken } from "@/platform/entitlements/token";
import { assertDerivedStoryPayload } from "@/platform/persistence/supabase-rest";
import { sanitizeProductEvent } from "@/platform/telemetry/events";

const SAFE_AI_INPUT: StoryEnrichmentInput = {
  product: "threadtales",
  mode: "friends",
  facts: {
    totalMessages: 100,
    totalWords: 500,
    daysTogether: 200,
    activeDays: 50,
    longestStreak: 9,
    longestSilenceDays: 4,
    medianReplyMinutes: 12,
    peakHour: 22,
    favoriteWeekday: "Friday",
    lateNightMessages: 10,
    questionsAsked: 30,
    laughSignals: 20,
    heartSignals: 8,
    mediaSignals: 3,
    conversationBalance: 92,
    yearCount: 2,
  },
  chapters: [
    { id: "scale", type: "scale", title: "A lot happened", metric: 100, renderVariant: "metric" },
  ],
};

beforeEach(() => {
  process.env.ENTITLEMENT_SIGNING_SECRET = "test-signing-secret-at-least-long-enough";
});

afterEach(() => {
  delete process.env.ENTITLEMENT_SIGNING_SECRET;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PRICE_THREADTALES_PREMIUM;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_STORY_MODEL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("premium entitlements", () => {
  it("accepts a valid signed entitlement and rejects tampering", () => {
    const token = createEntitlementToken("cs_test_abc", 3600);
    expect(verifyEntitlementToken(token)?.sessionId).toBe("cs_test_abc");
    const [payload, signature] = token.split(".");
    expect(verifyEntitlementToken(`${payload}x.${signature}`)).toBeNull();
    expect(verifyEntitlementToken(`${payload}.${signature.slice(0, -1)}x`)).toBeNull();
    expect(verifyEntitlementToken("malformed")).toBeNull();
  });

  it("rejects expired and wrong-product signed payloads", () => {
    const expired = createEntitlementToken("cs_test_expired", -1);
    expect(verifyEntitlementToken(expired)).toBeNull();

    const payload = Buffer.from(JSON.stringify({ v: 1, product: "wrong", sessionId: "cs_test_wrong", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
    const signature = createHmac("sha256", process.env.ENTITLEMENT_SIGNING_SECRET!).update(payload).digest("base64url");
    expect(verifyEntitlementToken(`${payload}.${signature}`)).toBeNull();
  });

  it("fails closed when the signing secret is missing", () => {
    delete process.env.ENTITLEMENT_SIGNING_SECRET;
    expect(() => createEntitlementToken("cs_test_no_secret")).toThrow(/not configured/);
  });
});

describe("Stripe boundary", () => {
  it("fails gracefully before a network call when Stripe is not configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(createPremiumCheckout("https://example.test", "friends")).rejects.toThrow(/STRIPE_PRICE_THREADTALES_PREMIUM/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends purchase metadata only and uses verified checkout URLs", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_PRICE_THREADTALES_PREMIUM = "price_test_123";
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => new Response(JSON.stringify({ id: "cs_test_abc", url: "https://checkout.stripe.test/session" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchSpy);

    await createPremiumCheckout("https://threadtales.example", "anniversary");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    const body = new URLSearchParams(String(init?.body));
    expect(body.get("success_url")).toBe("https://threadtales.example/premium/success?session_id={CHECKOUT_SESSION_ID}");
    expect(body.get("cancel_url")).toBe("https://threadtales.example/create?mode=anniversary");
    expect(body.get("metadata[entitlement]")).toBe("threadtales-premium");
    expect(body.get("metadata[mode]")).toBe("anniversary");
    const serialized = String(init?.body);
    expect(serialized).not.toMatch(/chatMessages|rawChat|participants|topWords|messageText/);
  });

  it("verifies Stripe signatures against the raw body and rejects stale or wrong signatures", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    const rawBody = '{"type":"checkout.session.completed"}';
    const timestamp = Math.floor(Date.now() / 1000);
    const valid = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${rawBody}`).digest("hex");
    expect(verifyStripeWebhookSignature(rawBody, `t=${timestamp},v1=${valid}`)).toBe(true);
    expect(verifyStripeWebhookSignature(rawBody, `t=${timestamp},v1=${"0".repeat(64)}`)).toBe(false);
    expect(verifyStripeWebhookSignature(rawBody, "malformed")).toBe(false);
    expect(verifyStripeWebhookSignature(rawBody, `t=${timestamp - 1000},v1=${valid}`)).toBe(false);
  });
});

describe("derived persistence boundary", () => {
  it.each(["raw", "rawText", "rawChat", "messages", "chatMessages", "messageText", "sender", "transcript", "conversation", "text"])("rejects raw-content key %s", (key) => {
    expect(() => assertDerivedStoryPayload({ result: { [key]: "private" } })).toThrow(/raw-content field/);
  });

  it("rejects nested raw chat message shapes", () => {
    expect(() => assertDerivedStoryPayload({ result: { nested: [{ sender: "Alice", timestamp: 123, text: "private" }] } })).toThrow(/Raw chat messages|raw-content/);
  });

  it("accepts derived counters that contain the word messages", () => {
    expect(() => assertDerivedStoryPayload({ schemaVersion: 2, totalMessages: 100, lateNightMessages: 5, monthlyMessages: 3 })).not.toThrow();
  });
});

describe("AI enrichment privacy", () => {
  it("is disabled without a provider credential", () => {
    delete process.env.OPENAI_API_KEY;
    expect(getStoryEnrichmentProvider()).toBeNull();
  });

  it("accepts allowlisted ThreadTales facts and rejects private fact keys", () => {
    expect(() => validateStoryEnrichmentInput(SAFE_AI_INPUT)).not.toThrow();
    for (const key of ["participants", "topWords", "rawMessages", "sender", "transcript", "messageText"]) {
      expect(() => validateStoryEnrichmentInput({ ...SAFE_AI_INPUT, facts: { ...SAFE_AI_INPUT.facts, [key]: "PRIVATE" } })).toThrow(/rejected|allowlisted/);
    }
  });

  it("requires explicit consent for a selected snippet and caps it at 600 characters", () => {
    expect(() => validateStoryEnrichmentInput({ ...SAFE_AI_INPUT, selectedSnippet: "private snippet" })).toThrow(/consent/);
    expect(() => validateStoryEnrichmentInput({ ...SAFE_AI_INPUT, selectedSnippet: "private snippet", snippetConsent: true })).not.toThrow();
    expect(() => validateStoryEnrichmentInput({ ...SAFE_AI_INPUT, selectedSnippet: "x".repeat(601), snippetConsent: true })).toThrow(/600/);
  });

  it("uses Responses API with store=false and never sends unprovided identities", async () => {
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => new Response(JSON.stringify({ model: "test-model", output: [{ content: [{ type: "output_text", text: "Enriched copy" }] }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenAIStoryEnrichmentProvider("test-key", "test-model");
    const result = await provider.enrich(SAFE_AI_INPUT);
    expect(result.text).toBe("Enriched copy");
    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body.store).toBe(false);
    const serialized = String(body.input);
    expect(serialized).not.toContain("participants");
    expect(serialized).not.toContain("topWords");
    expect(serialized).not.toContain("SECRET_PERSON");
  });
});

describe("content-blind telemetry schema", () => {
  it("accepts only allowlisted fields and strips everything else", () => {
    const event = sanitizeProductEvent({
      event: "story_exported",
      product: "threadtales",
      mode: "friends",
      chatText: "PRIVATE",
      participantName: "SECRET_PERSON",
      topWord: "PRIVATE_WORD",
      caption: "PRIVATE_CAPTION",
      petNote: "PRIVATE_NOTE",
      location: "PRIVATE_LOCATION",
    });
    expect(event).toEqual({ event: "story_exported", product: "threadtales", mode: "friends" });
    expect(JSON.stringify(event)).not.toContain("PRIVATE");
  });

  it("rejects unsupported events and drops unrecognized modes", () => {
    expect(() => sanitizeProductEvent({ event: "raw_chat_uploaded", product: "threadtales" })).toThrow(/Unsupported product event/);
    expect(sanitizeProductEvent({ event: "analysis_started", product: "threadtales", mode: "unknown" })).toEqual({ event: "analysis_started", product: "threadtales" });
  });
});
