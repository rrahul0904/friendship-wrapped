import { NextResponse } from "next/server";
import { getStoryEnrichmentProvider } from "@/platform/ai/openai-provider";
import { isSupabaseConfigured, isSupabaseServerConfigured } from "@/platform/persistence/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subscriptionPriceKeys = [
  "STRIPE_PRICE_PLUS_MONTHLY","STRIPE_PRICE_PLUS_ANNUAL",
  "STRIPE_PRICE_FAMILY_MONTHLY","STRIPE_PRICE_FAMILY_ANNUAL",
  "STRIPE_PRICE_CREATOR_MONTHLY","STRIPE_PRICE_CREATOR_ANNUAL",
  "STRIPE_PRICE_BUSINESS_MONTHLY","STRIPE_PRICE_BUSINESS_ANNUAL",
] as const;

export async function GET() {
  const provider = getStoryEnrichmentProvider();
  const supabasePublic = isSupabaseConfigured();
  const supabaseServer = isSupabaseServerConfigured();
  const externalTelemetry = Boolean(process.env.TELEMETRY_ENDPOINT);
  return NextResponse.json({
    stripe: {
      checkout: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_THREADTALES_PREMIUM && process.env.ENTITLEMENT_SIGNING_SECRET),
      webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      subscriptions: Boolean(process.env.STRIPE_SECRET_KEY && subscriptionPriceKeys.every((key) => Boolean(process.env[key]))),
    },
    supabase: { public: supabasePublic, server: supabaseServer, auth: supabasePublic, storage: supabaseServer },
    ai: { enabled: Boolean(provider), provider: provider?.name ?? null },
    telemetry: { enabled: externalTelemetry || supabaseServer, sink: externalTelemetry ? "external" : supabaseServer ? "supabase" : null },
  }, { headers: { "Cache-Control": "no-store" } });
}
