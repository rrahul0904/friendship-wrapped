import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

type HouseholdRow = { id: string; owner_id: string };

function apiError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "Could not update household membership.";
  const status = message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : /owner|forbidden/i.test(message) ? 403 : 400;
  return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Sign in to manage household members." : message }, { status });
}

export async function DELETE(request: Request) {
  try {
    const { token, user } = await requireStorySession();
    const url = new URL(request.url);
    const householdId = url.searchParams.get("householdId");
    const userId = url.searchParams.get("userId");
    if (!householdId || !userId || !/^[0-9a-f-]{36}$/i.test(householdId) || !/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid household member request.");
    if (userId === user.id) throw new Error("The household owner cannot remove their own owner membership.");
    const household = (await supabaseRest<HouseholdRow[]>(`households?select=id,owner_id&id=eq.${encodeURIComponent(householdId)}&owner_id=eq.${encodeURIComponent(user.id)}&limit=1`, token))[0];
    if (!household) throw new Error("Only the household owner can remove members.");
    await supabaseRest<null>(`household_memberships?household_id=eq.${encodeURIComponent(householdId)}&user_id=eq.${encodeURIComponent(userId)}`, token, { method: "DELETE" });
    return new NextResponse(null, { status: 204 });
  } catch (cause) {
    return apiError(cause);
  }
}
