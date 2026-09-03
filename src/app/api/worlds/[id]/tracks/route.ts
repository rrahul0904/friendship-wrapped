import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    const body = await request.json() as { trackId?: unknown };
    if (!/^[0-9a-f-]{36}$/i.test(id) || typeof body.trackId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.trackId)) return NextResponse.json({ error: "Invalid soundtrack selection." }, { status: 400 });
    const [worlds, tracks, current] = await Promise.all([
      supabaseRest<{ id: string }[]>(`worlds?id=eq.${id}&select=id`, session.token),
      supabaseRest<{ id: string }[]>(`music_tracks?id=eq.${body.trackId}&select=id`, session.token),
      supabaseRest<{ track_id: string }[]>(`world_music_tracks?world_id=eq.${id}&select=track_id`, session.token),
    ]);
    if (!worlds[0] || !tracks[0]) return NextResponse.json({ error: "World or song not found." }, { status: 404 });
    const rows = await supabaseRest<Record<string, unknown>[]>("world_music_tracks", session.token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ world_id: id, track_id: body.trackId, position: current.length }) });
    return NextResponse.json({ soundtrackItem: rows[0] }, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not update soundtrack.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    const trackId = new URL(request.url).searchParams.get("trackId") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(trackId)) return NextResponse.json({ error: "Invalid soundtrack selection." }, { status: 400 });
    await supabaseRest<null>(`world_music_tracks?world_id=eq.${id}&track_id=eq.${trackId}`, session.token, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ deleted: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not update soundtrack.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
