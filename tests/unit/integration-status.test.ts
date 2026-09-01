import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/integrations/status/route";

const ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_THREADTALES_PREMIUM",
  "STRIPE_WEBHOOK_SECRET",
  "ENTITLEMENT_SIGNING_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "OPENAI_API_KEY",
  "OPENAI_STORY_MODEL",
  "TELEMETRY_ENDPOINT",
] as const;

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("integration status route", () => {
  it("reports all optional integrations disabled by default", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      stripe: { checkout: false, webhook: false },
      supabase: { public: false, server: false },
      ai: { enabled: false, provider: null },
      telemetry: { enabled: false, sink: null },
    });
  });

  it("reports configured capabilities without returning any credential values", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_SECRET_STRIPE";
    process.env.STRIPE_PRICE_THREADTALES_PREMIUM = "price_live_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_SECRET_WEBHOOK";
    process.env.ENTITLEMENT_SIGNING_SECRET = "SECRET_ENTITLEMENT";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://story-platform.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_PUBLIC";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_PRIVATE";
    process.env.OPENAI_API_KEY = "sk-SECRET_OPENAI";
    process.env.OPENAI_STORY_MODEL = "gpt-5.6-luna";

    const response = await GET();
    const body = await response.json();
    expect(body).toEqual({
      stripe: { checkout: true, webhook: true },
      supabase: { public: true, server: true },
      ai: { enabled: true, provider: "openai" },
      telemetry: { enabled: true, sink: "supabase" },
    });

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("SECRET_STRIPE");
    expect(serialized).not.toContain("SECRET_WEBHOOK");
    expect(serialized).not.toContain("SECRET_ENTITLEMENT");
    expect(serialized).not.toContain("sb_secret_PRIVATE");
    expect(serialized).not.toContain("SECRET_OPENAI");
  });

  it("prefers an explicitly configured external telemetry endpoint", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://story-platform.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_PUBLIC";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_PRIVATE";
    process.env.TELEMETRY_ENDPOINT = "https://telemetry.example/events";

    const response = await GET();
    const body = await response.json();
    expect(body.telemetry).toEqual({ enabled: true, sink: "external" });
  });
});
