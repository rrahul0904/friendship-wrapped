import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/integrations/status/route";

const ENV_KEYS = [
  "STRIPE_SECRET_KEY","STRIPE_PRICE_THREADTALES_PREMIUM","STRIPE_WEBHOOK_SECRET","ENTITLEMENT_SIGNING_SECRET",
  "STRIPE_PRICE_PLUS_MONTHLY","STRIPE_PRICE_PLUS_ANNUAL","STRIPE_PRICE_FAMILY_MONTHLY","STRIPE_PRICE_FAMILY_ANNUAL",
  "STRIPE_PRICE_CREATOR_MONTHLY","STRIPE_PRICE_CREATOR_ANNUAL","STRIPE_PRICE_BUSINESS_MONTHLY","STRIPE_PRICE_BUSINESS_ANNUAL",
  "NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SECRET_KEY",
  "OPENAI_API_KEY","OPENAI_STORY_MODEL","TELEMETRY_ENDPOINT",
] as const;

afterEach(() => { for (const key of ENV_KEYS) delete process.env[key]; });

describe("integration status route", () => {
  it("reports optional integrations disabled by default", async () => {
    const response = await GET();
    expect(await response.json()).toEqual({
      stripe: { checkout: false, webhook: false, subscriptions: false },
      supabase: { public: false, server: false, auth: false, storage: false },
      ai: { enabled: false, provider: null },
      telemetry: { enabled: false, sink: null },
    });
  });

  it("reports configured capabilities without returning credential values", async () => {
    process.env.STRIPE_SECRET_KEY="sk_live_SECRET_STRIPE";
    process.env.STRIPE_PRICE_THREADTALES_PREMIUM="price_one_time";
    process.env.STRIPE_WEBHOOK_SECRET="whsec_SECRET_WEBHOOK";
    process.env.ENTITLEMENT_SIGNING_SECRET="SECRET_ENTITLEMENT";
    for (const key of ["STRIPE_PRICE_PLUS_MONTHLY","STRIPE_PRICE_PLUS_ANNUAL","STRIPE_PRICE_FAMILY_MONTHLY","STRIPE_PRICE_FAMILY_ANNUAL","STRIPE_PRICE_CREATOR_MONTHLY","STRIPE_PRICE_CREATOR_ANNUAL","STRIPE_PRICE_BUSINESS_MONTHLY","STRIPE_PRICE_BUSINESS_ANNUAL"]) process.env[key]="price_subscription";
    process.env.NEXT_PUBLIC_SUPABASE_URL="https://story-platform.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_PUBLIC";
    process.env.SUPABASE_SECRET_KEY="sb_secret_PRIVATE";
    process.env.OPENAI_API_KEY="sk-SECRET_OPENAI";
    process.env.OPENAI_STORY_MODEL="gpt-5.6-luna";
    const response=await GET();const body=await response.json();
    expect(body).toEqual({
      stripe:{checkout:true,webhook:true,subscriptions:true},
      supabase:{public:true,server:true,auth:true,storage:true},
      ai:{enabled:true,provider:"openai"},
      telemetry:{enabled:true,sink:"supabase"},
    });
    const serialized=JSON.stringify(body);
    for (const secret of ["SECRET_STRIPE","SECRET_WEBHOOK","SECRET_ENTITLEMENT","sb_secret_PRIVATE","SECRET_OPENAI"]) expect(serialized).not.toContain(secret);
  });

  it("prefers an explicitly configured external telemetry endpoint", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL="https://story-platform.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_PUBLIC";
    process.env.SUPABASE_SECRET_KEY="sb_secret_PRIVATE";
    process.env.TELEMETRY_ENDPOINT="https://telemetry.example/events";
    const body=await (await GET()).json();
    expect(body.telemetry).toEqual({enabled:true,sink:"external"});
  });
});
