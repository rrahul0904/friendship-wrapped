import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { getUserSubscription } from "@/platform/billing/subscription";
import { planCatalog } from "@/platform/billing/plans";
import { supabaseRest } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireStorySession();
    const subscription = await getUserSubscription(session.user.id, session.token);
    const media = await supabaseRest<Array<{ size_bytes: number | null }>>("media_assets?select=size_bytes&limit=5000", session.token);
    const storageBytes = media.reduce((sum, row) => sum + Number(row.size_bytes ?? 0), 0);
    return NextResponse.json({ subscription, plan: planCatalog[subscription.plan_slug], usage: { storageBytes } });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load subscription.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
