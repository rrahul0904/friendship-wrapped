import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

type Track = { id: string; owner_id: string; title: string; artist: string; album?: string | null; artwork_media_id?: string | null; external_url?: string | null; provider: string; memory_date?: string | null; note?: string | null; created_at: string };

export async function GET() {
  try {
    const session = await requireStorySession();
    const tracks = await supabaseRest<Track[]>("music_tracks?select=*&order=created_at.desc&limit=200", session.token);
    return NextResponse.json({ tracks });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load soundtrack.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireStorySession();
    const body = await request.json() as { title?: unknown; artist?: unknown; album?: unknown; artworkMediaId?: unknown; externalUrl?: unknown; memoryDate?: unknown; note?: unknown };
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
    const artist = typeof body.artist === "string" ? body.artist.trim().slice(0, 160) : "";
    if (!title || !artist) return NextResponse.json({ error: "Song title and artist are required." }, { status: 400 });
    let externalUrl: string | null = null;
    if (typeof body.externalUrl === "string" && body.externalUrl.trim()) {
      try { const parsed = new URL(body.externalUrl.trim()); if (parsed.protocol !== "https:") throw new Error(); externalUrl = parsed.toString().slice(0, 1000); } catch { return NextResponse.json({ error: "Song link must be a valid HTTPS URL." }, { status: 400 }); }
    }
    const artwork = typeof body.artworkMediaId === "string" && /^[0-9a-f-]{36}$/i.test(body.artworkMediaId) ? body.artworkMediaId : null;
    const payload = { owner_id: session.user.id, title, artist, album: typeof body.album === "string" ? body.album.trim().slice(0, 160) || null : null, artwork_media_id: artwork, external_url: externalUrl, provider: "manual", memory_date: typeof body.memoryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.memoryDate) ? body.memoryDate : null, note: typeof body.note === "string" ? body.note.trim().slice(0, 500) || null : null };
    const rows = await supabaseRest<Track[]>("music_tracks", session.token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
    return NextResponse.json({ track: rows[0] }, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not add song.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireStorySession();
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid track id." }, { status: 400 });
    await supabaseRest<null>(`music_tracks?id=eq.${id}`, session.token, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ deleted: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not remove song.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
