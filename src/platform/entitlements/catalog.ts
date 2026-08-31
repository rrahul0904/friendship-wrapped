import type { ProductEntitlementId } from "./types";

export const FRIENDSHIP_PREMIUM_PRODUCT: ProductEntitlementId = "friendship-premium-v1";

export interface ProductCatalogEntry {
  id: ProductEntitlementId;
  name: string;
  priceLabel: string;
}

export const PRODUCT_CATALOG: Record<ProductEntitlementId, ProductCatalogEntry> = {
  "friendship-premium-v1": {
    id: "friendship-premium-v1",
    name: "ThreadTales Premium Story",
    priceLabel: process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL ?? "$9.99",
  },
};

export function isProductEntitlementId(value: unknown): value is ProductEntitlementId {
  return typeof value === "string" && value in PRODUCT_CATALOG;
}

export function stripePriceIdFor(product: ProductEntitlementId) {
  if (product === FRIENDSHIP_PREMIUM_PRODUCT) return process.env.STRIPE_FRIENDSHIP_PRICE_ID ?? "";
  return "";
}
