import { NextResponse } from "next/server";
import { getStoryEnrichmentProvider } from "@/platform/ai/openai-provider";
import { isSupabaseConfigured, isSupabaseServerConfigured } from "@/platform/persistence/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const provider = getStoryEnrichmentProvider();
  const supabaseServer = isSupabaseServerConfigured();
  const externalTelemetry = Boolean(process.env.TELEMETRY_ENDPOINT);

  return NextResponse.json({
    stripe: {
      checkout: Boolean(
        process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_PRICE_THREADTALES_PREMIUM &&
        process.env.ENTITLEMENT_SIGNING_SECRET
      ),
      webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    },
    supabase: {
      public: isSupabaseConfigured(),
      server: supabaseServer,
    },
    ai: {
      enabled: Boolean(provider),
      provider: provider?.name ?? null,
    },
    telemetry: {
      enabled: externalTelemetry || supabaseServer,
      sink: externalTelemetry ? "external" : supabaseServer ? "supabase" : null,
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
