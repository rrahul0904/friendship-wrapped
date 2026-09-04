import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
export const runtime = "nodejs";
function valid(value: unknown) { return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value); }
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession(); const { id: albumId } = await context.params; const body = await request.json() as { trackId?: unknown };
    if (!valid(albumId) || !valid(body.trackId)) return NextResponse.json({ error: "Invalid soundtrack selection." }, { status: 400 });
    const [albums, tracks, current] = await Promise.all([
      supabaseRest<Array<{ id: string }>>(`albums?id=eq.${albumId}&select=id`, session.token),
      supabaseRest<Array<{ id: string }>>(`music_tracks?id=eq.${body.trackId}&select=id`, session.token),
      supabaseRest<Array<{ track_id: string }>>(`album_music_tracks?album_id=eq.${albumId}&select=track_id`, session.token),
    ]);
    if (!albums[0] || !tracks[0]) return NextResponse.json({ error: "Album or song not found." }, { status: 404 });
    const rows = await supabaseRest<Array<Record<string, unknown>>>("album_music_tracks", session.token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ album_id: albumId, track_id: body.trackId, position: current.length }) });
    return NextResponse.json({ soundtrackItem: rows[0] }, { status: 201 });
  } catch (cause) { const message = cause instanceof Error ? cause.message : "Could not update album soundtrack."; return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : 400 }); }
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession(); const { id: albumId } = await context.params; const trackId = new URL(request.url).searchParams.get("trackId");
    if (!valid(albumId) || !valid(trackId)) return NextResponse.json({ error: "Invalid soundtrack selection." }, { status: 400 });
    await supabaseRest(`album_music_tracks?album_id=eq.${albumId}&track_id=eq.${trackId}`, session.token, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ deleted: true });
  } catch (cause) { const message = cause instanceof Error ? cause.message : "Could not update album soundtrack."; return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : 400 }); }
}
