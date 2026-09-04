import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { createBillingPortal } from "@/platform/billing/stripe-subscriptions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireStorySession();
    const origin = process.env.VERCEL_ENV === "preview" ? new URL(request.url).origin : (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
    const portal = await createBillingPortal({ userId: session.user.id, email: session.user.email, origin });
    return NextResponse.json({ portalUrl: portal.url });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not open billing portal.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
