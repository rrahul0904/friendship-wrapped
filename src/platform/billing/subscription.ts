import { supabaseRest } from "@/platform/persistence/supabase-rest";
import type { PlanSlug } from "./plans";
import { isPlanSlug } from "./plans";

export interface SubscriptionRecord {
  plan_slug: PlanSlug;
  status: string;
  billing_interval?: "month" | "year" | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}

export async function getUserSubscription(userId: string, accessToken: string): Promise<SubscriptionRecord> {
  const rows = await supabaseRest<SubscriptionRecord[]>(`subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=plan_slug,status,billing_interval,current_period_end,cancel_at_period_end&order=updated_at.desc&limit=1`, accessToken);
  const row = rows[0];
  if (!row || !isPlanSlug(row.plan_slug) || !["active", "trialing"].includes(row.status)) return { plan_slug: "free", status: "free", billing_interval: null, current_period_end: null, cancel_at_period_end: false };
  return row;
}
