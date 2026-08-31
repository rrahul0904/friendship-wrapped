export const PRODUCT_EVENTS = [
  "analysis_started",
  "analysis_completed",
  "story_viewed",
  "story_exported",
  "share_created",
  "share_opened",
  "make_yours_clicked",
  "checkout_started",
  "purchase_verified",
  "story_saved",
  "myyear_created",
  "pet_created",
  "pet_memory_added",
  "annual_recap_created",
  "ai_enrichment_started",
  "ai_enrichment_completed",
] as const;

export type ProductEventName = typeof PRODUCT_EVENTS[number];
export type ProductEventProduct = "threadtales" | "myyear" | "petlife";

export interface ProductEvent {
  event: ProductEventName;
  product: ProductEventProduct;
  mode?: string;
}

const EVENT_SET = new Set<string>(PRODUCT_EVENTS);
const ALLOWED_MODES = new Set(["friends","couple","siblings","family","group","birthday","anniversary","long-distance","graduation","year-together"]);

export function sanitizeProductEvent(value: unknown): ProductEvent {
  if (!value || typeof value !== "object") throw new Error("Invalid product event.");
  const input = value as Record<string, unknown>;
  if (typeof input.event !== "string" || !EVENT_SET.has(input.event)) throw new Error("Unsupported product event.");
  if (typeof input.product !== "string" || !["threadtales","myyear","petlife"].includes(input.product)) throw new Error("Unsupported event product.");
  const mode = typeof input.mode === "string" && ALLOWED_MODES.has(input.mode) ? input.mode : undefined;
  return { event: input.event as ProductEventName, product: input.product as ProductEventProduct, ...(mode ? { mode } : {}) };
}
