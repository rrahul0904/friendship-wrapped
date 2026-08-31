import { NextResponse } from "next/server";
import { sanitizeProductEvent } from "@/platform/telemetry/events";

export const runtime = "nodejs";

function telemetryEndpoint() {
  const raw = process.env.TELEMETRY_ENDPOINT;
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Telemetry endpoint must use HTTPS.");
  return url.toString();
}

export async function POST(request: Request) {
  try {
    const event = sanitizeProductEvent(await request.json());
    const endpoint = telemetryEndpoint();
    if (!endpoint) return NextResponse.json({ accepted: true, delivered: false }, { status: 202 });
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
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Invalid telemetry event.";
    return NextResponse.json({ error: message }, { status: /invalid|unsupported/i.test(message) ? 400 : 502 });
  }
}
