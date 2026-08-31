import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseAdminRest, supabaseRest } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

type HouseholdRow = { id: string; owner_id: string; name: string };
type InviteRow = { id: string; household_id: string; email: string; token_hash: string; can_add_memories: boolean; expires_at: string; accepted_at?: string | null };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function apiError(cause: unknown, fallback: string) {
  const message = cause instanceof Error ? cause.message : fallback;
  const status = message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : /forbidden|owner/i.test(message) ? 403 : 400;
  return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Sign in to manage household invitations." : message }, { status });
}

export async function POST(request: Request) {
  try {
    const { token, user } = await requireStorySession();
    const body = await request.json() as { householdId?: string; email?: string; canAddMemories?: boolean };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!body.householdId || !/^[0-9a-f-]{36}$/i.test(body.householdId)) throw new Error("Invalid household id.");
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) throw new Error("Enter a valid household member email.");
    if (user.email?.toLowerCase() === email) throw new Error("You are already the household owner.");
    const household = (await supabaseRest<HouseholdRow[]>(`households?select=id,owner_id,name&id=eq.${encodeURIComponent(body.householdId)}&owner_id=eq.${encodeURIComponent(user.id)}&limit=1`, token))[0];
    if (!household) throw new Error("Only the household owner can invite members.");

    const rawToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const rows = await supabaseRest<Array<{ id: string }>>("household_invites?select=id", token, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ household_id: household.id, created_by: user.id, email, token_hash: hashToken(rawToken), can_add_memories: body.canAddMemories !== false, expires_at: expiresAt }),
    });
    const origin = new URL(request.url).origin;
    return NextResponse.json({ inviteId: rows[0]?.id, inviteUrl: `${origin}/products/petlife?invite=${encodeURIComponent(rawToken)}`, expiresAt });
  } catch (cause) {
    return apiError(cause, "Could not create household invitation.");
  }
}

export async function PUT(request: Request) {
  try {
    const { user } = await requireStorySession();
    const body = await request.json() as { token?: string };
    if (!body.token || !/^[A-Za-z0-9_-]{32,128}$/.test(body.token)) throw new Error("Invalid household invitation token.");
    const tokenHash = hashToken(body.token);
    const invite = (await supabaseAdminRest<InviteRow[]>(`household_invites?select=id,household_id,email,token_hash,can_add_memories,expires_at,accepted_at&token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`))[0];
    if (!invite || invite.accepted_at) throw new Error("This household invitation is invalid or has already been used.");
    if (new Date(invite.expires_at).getTime() <= Date.now()) throw new Error("This household invitation has expired.");
    if (!user.email || user.email.toLowerCase() !== invite.email.toLowerCase()) throw new Error("Sign in with the email address that received this invitation.");

    await supabaseAdminRest("household_memberships?on_conflict=household_id,user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ household_id: invite.household_id, user_id: user.id, role: "member", can_add_memories: invite.can_add_memories }),
    });
    await supabaseAdminRest(`household_invites?id=eq.${encodeURIComponent(invite.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ accepted_at: new Date().toISOString() }),
    });
    return NextResponse.json({ accepted: true, householdId: invite.household_id });
  } catch (cause) {
    return apiError(cause, "Could not accept household invitation.");
  }
}
