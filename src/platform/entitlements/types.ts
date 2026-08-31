export type ProductEntitlementId = "friendship-premium-v1";

export interface EntitlementSnapshot {
  entitled: boolean;
  product: ProductEntitlementId;
  source: "stripe_checkout";
  verifiedAt: string;
}
