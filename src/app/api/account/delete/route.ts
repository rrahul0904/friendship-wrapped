import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { clearStoryAuthCookies } from "@/platform/identity/cookies";
import { requireSupabaseSecretConfig } from "@/platform/persistence/config";
import { supabaseRest, supabaseStorageDelete } from "@/platform/persistence/supabase-rest";
export const runtime = "nodejs";
function sameOrigin(request: Request) { const origin = request.headers.get("origin"); if (!origin) return true; return new URL(origin).host === new URL(request.url).host; }
export async function DELETE(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const session = await requireStorySession(); const body = await request.json().catch(() => ({})) as { confirmation?: unknown };
    if (body.confirmation !== "DELETE") return NextResponse.json({ error: 'Type "DELETE" to confirm account deletion.' }, { status: 400 });
    const media = await supabaseRest<Array<{ object_path: string }>>("media_assets?select=object_path&limit=5000", session.token);
    for (const asset of media) await supabaseStorageDelete(asset.object_path, session.token).catch(() => undefined);
    const { url, secretKey } = requireSupabaseSecretConfig();
    const response = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(session.user.id)}`, { method: "DELETE", headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` } });
    if (!response.ok) throw new Error("Supabase could not delete the account.");
    return clearStoryAuthCookies(NextResponse.json({ deleted: true }));
  } catch (cause) { const message = cause instanceof Error ? cause.message : "Could not delete account."; return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : 400 }); }
}
