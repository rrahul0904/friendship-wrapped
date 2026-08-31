"use client";

import type { ProductEventName, ProductEventProduct } from "./events";

export function trackProductEvent(event: ProductEventName, product: ProductEventProduct, mode?: string) {
  const payload = { event, product, ...(mode ? { mode } : {}) };
  void fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}
