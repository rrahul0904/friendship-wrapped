import { requireSupabaseSecretConfig } from "@/platform/persistence/config";
import { supabaseAdminRest } from "@/platform/persistence/supabase-rest";

async function adminFetch(path: string, init: RequestInit = {}) {
  const { url, secretKey } = requireSupabaseSecretConfig();
  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function adminCount(table: string, filter = "") {
  if (!/^[a-z_]+$/.test(table)) throw new Error("Invalid admin table.");
  const response = await adminFetch(`/rest/v1/${table}?select=id${filter}`, {
    method: "HEAD",
    headers: { Prefer: "count=exact", Range: "0-0" },
  });
  if (!response.ok) throw new Error(`Could not count ${table}.`);
  const range = response.headers.get("content-range") ?? "";
  const total = Number(range.split("/").at(-1));
  return Number.isFinite(total) ? total : 0;
}

export async function listAdminUsers() {
  const response = await adminFetch("/auth/v1/admin/users?page=1&per_page=50");
  const data = await response.json().catch(() => ({})) as { users?: Array<{ id: string; email?: string; created_at?: string; last_sign_in_at?: string }> };
  if (!response.ok) throw new Error("Could not load users.");
  return (data.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  }));
}

export async function getAdminOverview() {
  const [users, worlds, albums, media, subscriptions, events] = await Promise.all([
    listAdminUsers(),
    adminCount("worlds"),
    adminCount("albums"),
    adminCount("media_assets"),
    adminCount("subscriptions", "&status=in.(active,trialing,past_due)"),
    adminCount("product_events"),
  ]);
  return { users: users.length, worlds, albums, media, subscriptions, events };
}

export async function getAdminSection(section: string) {
  switch (section) {
    case "users": return { users: await listAdminUsers() };
    case "subscriptions":
    case "revenue": return { subscriptions: await supabaseAdminRest<Array<Record<string, unknown>>>("subscriptions?select=plan_slug,status,billing_interval,current_period_end,cancel_at_period_end,created_at,updated_at&order=updated_at.desc&limit=100") };
    case "finops": return {
      costs: await supabaseAdminRest<Array<Record<string, unknown>>>("service_cost_events?select=service,product,environment,amount_usd,cost_type,occurred_at&order=occurred_at.desc&limit=250"),
      budgets: await supabaseAdminRest<Array<Record<string, unknown>>>("cost_budgets?select=scope_type,scope_key,monthly_budget_usd,enabled,updated_at&order=scope_type.asc&limit=100"),
    };
    case "audit": return { audit: await supabaseAdminRest<Array<Record<string, unknown>>>("admin_audit_logs?select=actor_user_id,action,target_type,target_id,safe_metadata,created_at&order=created_at.desc&limit=100") };
    case "integrations": return { integrations: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SECRET_KEY),
      stripeCheckout: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_THREADTALES_PREMIUM),
      stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      subscriptions: ["PLUS","FAMILY","CREATOR","BUSINESS"].every((plan) => ["MONTHLY","ANNUAL"].every((interval) => Boolean(process.env[`STRIPE_PRICE_${plan}_${interval}`]))),
      openai: Boolean(process.env.OPENAI_API_KEY),
      telemetry: Boolean(process.env.TELEMETRY_ENDPOINT || process.env.SUPABASE_SECRET_KEY),
      pulseAtlas: Boolean(process.env.PULSEATLAS_ENDPOINT),
    }};
    case "worlds": return { counts: { worlds: await adminCount("worlds"), events: await adminCount("story_events") } };
    case "albums": return { counts: { albums: await adminCount("albums"), items: await adminCount("album_items") } };
    case "media": return { counts: { media: await adminCount("media_assets") } };
    case "products": return { counts: {
      threadtales: await adminCount("worlds", "&product=eq.threadtales"),
      myyear: await adminCount("worlds", "&product=eq.myyear"),
      petlife: await adminCount("worlds", "&product=eq.petlife"),
      relationship: await adminCount("worlds", "&product=eq.relationship"),
      lifemap: await adminCount("worlds", "&product=eq.lifemap"),
      babystory: await adminCount("worlds", "&product=eq.babystory"),
      homestory: await adminCount("worlds", "&product=eq.homestory"),
      familytree: await adminCount("worlds", "&product=eq.familytree"),
      founderworld: await adminCount("worlds", "&product=eq.founderworld"),
      creatorworld: await adminCount("worlds", "&product=eq.creatorworld"),
    }};
    default: return {};
  }
}
