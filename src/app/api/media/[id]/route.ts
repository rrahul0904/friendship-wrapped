import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest, supabaseStorageDelete } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid media id." }, { status: 400 });
    const rows = await supabaseRest<{ id: string; object_path: string }[]>(`media_assets?id=eq.${id}&select=id,object_path`, session.token);
    if (!rows[0]) return NextResponse.json({ error: "Media not found." }, { status: 404 });
    await supabaseStorageDelete(rows[0].object_path, session.token);
    await supabaseRest<null>(`media_assets?id=eq.${id}`, session.token, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ deleted: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not delete media.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
