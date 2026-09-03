import type { ProductEvent } from "./events";

const PROJECT = {
  organizationId: "portfolio_primary",
  projectId: "proj_friendship_wrapped",
  projectSlug: "friendship-wrapped",
} as const;

function environment() {
  const value = process.env.PULSEATLAS_ENVIRONMENT;
  return value === "development" || value === "preview" ? value : "production";
}

export function toPulseAtlasEvent(event: ProductEvent) {
  return {
    id: `evt_${crypto.randomUUID()}`,
    schemaVersion: 1,
    ...PROJECT,
    environment: environment(),
    eventName: event.event,
    eventCategory: event.event === "purchase_verified" ? "revenue" : event.event === "checkout_started" ? "conversion" : "product",
    occurredAt: new Date().toISOString(),
    properties: {
      product: event.product,
      ...(event.mode ? { mode: event.mode } : {}),
    },
  };
}

export async function deliverToPulseAtlas(event: ProductEvent): Promise<boolean> {
  const rawEndpoint = process.env.PULSEATLAS_ENDPOINT;
  const writeKey = process.env.PULSEATLAS_WRITE_KEY;
  if (!rawEndpoint || !writeKey) return false;

  try {
    const endpoint = new URL(rawEndpoint);
    const local = endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1";
    if (endpoint.protocol !== "https:" && !local) return false;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pulseatlas-write-key": writeKey },
      body: JSON.stringify(toPulseAtlasEvent(event)),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    // Portfolio observability must never break the story product.
    return false;
  }
}
