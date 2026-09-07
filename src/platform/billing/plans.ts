export const planSlugs = ["free", "plus", "family", "creator", "business"] as const;
export type PlanSlug = typeof planSlugs[number];
export type BillingInterval = "month" | "year";

export const planCatalog: Record<PlanSlug, {
  label: string;
  description: string;
  storageBytes: number;
  maxUploadBytes: number;
  maxAlbumItems: number;
  aiRequestsPerMonth: number;
  features: string[];
}> = {
  free: {
    label: "Free",
    description: "Local-first stories and the core ThreadTales experience.",
    storageBytes: 100 * 1024 * 1024,
    maxUploadBytes: 10 * 1024 * 1024,
    maxAlbumItems: 30,
    aiRequestsPerMonth: 0,
    features: ["local_first", "basic_exports"],
  },
  plus: {
    label: "Plus",
    description: "Cloud worlds, private albums, premium themes and richer exports.",
    storageBytes: 5 * 1024 * 1024 * 1024,
    maxUploadBytes: 25 * 1024 * 1024,
    maxAlbumItems: 250,
    aiRequestsPerMonth: 50,
    features: ["cloud_worlds", "private_media", "albums", "soundtracks", "premium_themes", "high_res_exports", "ai_enrichment"],
  },
  family: {
    label: "Family",
    description: "Shared family memory spaces with collaboration and more storage.",
    storageBytes: 20 * 1024 * 1024 * 1024,
    maxUploadBytes: 25 * 1024 * 1024,
    maxAlbumItems: 500,
    aiRequestsPerMonth: 100,
    features: ["cloud_worlds", "private_media", "albums", "soundtracks", "premium_themes", "high_res_exports", "ai_enrichment", "family_collaboration"],
  },
  creator: {
    label: "Creator",
    description: "CreatorWorld with larger media and export allowances.",
    storageBytes: 50 * 1024 * 1024 * 1024,
    maxUploadBytes: 25 * 1024 * 1024,
    maxAlbumItems: 1000,
    aiRequestsPerMonth: 250,
    features: ["cloud_worlds", "private_media", "albums", "soundtracks", "premium_themes", "high_res_exports", "ai_enrichment", "creator_pro"],
  },
  business: {
    label: "Business",
    description: "FounderWorld, team workflows, business metrics and advanced exports.",
    storageBytes: 100 * 1024 * 1024 * 1024,
    maxUploadBytes: 25 * 1024 * 1024,
    maxAlbumItems: 2000,
    aiRequestsPerMonth: 500,
    features: ["cloud_worlds", "private_media", "albums", "soundtracks", "premium_themes", "high_res_exports", "ai_enrichment", "business_pro", "team_access"],
  },
};

const priceEnv: Record<Exclude<PlanSlug, "free">, Record<BillingInterval, string>> = {
  plus: { month: "STRIPE_PRICE_PLUS_MONTHLY", year: "STRIPE_PRICE_PLUS_ANNUAL" },
  family: { month: "STRIPE_PRICE_FAMILY_MONTHLY", year: "STRIPE_PRICE_FAMILY_ANNUAL" },
  creator: { month: "STRIPE_PRICE_CREATOR_MONTHLY", year: "STRIPE_PRICE_CREATOR_ANNUAL" },
  business: { month: "STRIPE_PRICE_BUSINESS_MONTHLY", year: "STRIPE_PRICE_BUSINESS_ANNUAL" },
};

export function isPlanSlug(value: unknown): value is PlanSlug {
  return typeof value === "string" && (planSlugs as readonly string[]).includes(value);
}

export function getSubscriptionPrice(plan: Exclude<PlanSlug, "free">, interval: BillingInterval) {
  const envName = priceEnv[plan][interval];
  const value = process.env[envName];
  if (!value) throw new Error(`${envName} is not configured.`);
  return { priceId: value, envName };
}

export function hasPlanFeature(plan: PlanSlug, feature: string) {
  return planCatalog[plan].features.includes(feature);
}
