import { NextResponse } from "next/server";
import { createEntitlementToken, verifyEntitlementToken } from "@/platform/entitlements/token";
import { retrieveCheckoutSession } from "@/platform/billing/stripe-rest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("session_id");
    if (!sessionId) return NextResponse.json({ error: "Missing Checkout Session id." }, { status: 400 });
    const session = await retrieveCheckoutSession(sessionId);
    if (session.status !== "complete" || session.payment_status !== "paid" || session.metadata?.entitlement !== "threadtales-premium") {
      return NextResponse.json({ error: "This purchase is not a completed paid ThreadTales Premium session." }, { status: 403 });
    }
    const token = createEntitlementToken(session.id);
    return NextResponse.json({ token, product: "threadtales-premium", expiresInDays: 365 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not recover this purchase.";
    return NextResponse.json({ error: message }, { status: /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: string };
    if (!body.token) return NextResponse.json({ valid: false }, { status: 400 });
    const entitlement = verifyEntitlementToken(body.token);
    return NextResponse.json({ valid: Boolean(entitlement), entitlement });
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
