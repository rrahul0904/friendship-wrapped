import { NextResponse } from "next/server";
import { isSupabaseServerConfigured } from "@/platform/persistence/config";
import { supabaseAdminRest } from "@/platform/persistence/supabase-rest";
import { sanitizeProductEvent } from "@/platform/telemetry/events";
import { deliverToPulseAtlas } from "@/platform/telemetry/pulseatlas";

export const runtime = "nodejs";

function telemetryEndpoint() {
  const raw = process.env.TELEMETRY_ENDPOINT;
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Telemetry endpoint must use HTTPS.");
  return url.toString();
}

async function deliverToSupabase(event: ReturnType<typeof sanitizeProductEvent>) {
  await supabaseAdminRest<null>("product_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ event: event.event, product: event.product, mode: event.mode ?? null }),
  });
}

export async function POST(request: Request) {
  try {
    const event = sanitizeProductEvent(await request.json());
    // Independent fail-open fanout. PulseAtlas is deliberately invisible to the
    // existing telemetry API contract, and only receives the sanitized event.
    void deliverToPulseAtlas(event);
    const endpoint = telemetryEndpoint();

    if (endpoint) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.TELEMETRY_API_KEY ? { Authorization: `Bearer ${process.env.TELEMETRY_API_KEY}` } : {}),
        },
        body: JSON.stringify({ ...event, occurredAt: new Date().toISOString() }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Telemetry destination rejected the event.");
      return NextResponse.json({ accepted: true, delivered: true }, { status: 202 });
    }

    if (isSupabaseServerConfigured()) {
      await deliverToSupabase(event);
      return NextResponse.json({ accepted: true, delivered: true }, { status: 202 });
    }

    return NextResponse.json({ accepted: true, delivered: false }, { status: 202 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Invalid telemetry event.";
    return NextResponse.json({ error: message }, { status: /invalid|unsupported/i.test(message) ? 400 : 502 });
  }
}
