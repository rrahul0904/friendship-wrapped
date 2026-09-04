import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

type AlbumRow = { id: string; world_id: string; owner_id: string; title: string; description?: string | null; cover_media_id?: string | null; start_date?: string | null; end_date?: string | null; privacy: string; created_at: string; updated_at: string };

export async function GET(request: Request) {
  try {
    const session = await requireStorySession();
    const world = new URL(request.url).searchParams.get("world");
    const filter = world && /^[0-9a-f-]{36}$/i.test(world) ? `&world_id=eq.${world}` : "";
    const albums = await supabaseRest<AlbumRow[]>(`albums?select=*&order=updated_at.desc${filter}&limit=100`, session.token);
    return NextResponse.json({ albums });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load albums.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireStorySession();
    const body = await request.json() as { worldId?: unknown; title?: unknown; description?: unknown; startDate?: unknown; endDate?: unknown };
    if (typeof body.worldId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.worldId)) return NextResponse.json({ error: "Choose a world for this album." }, { status: 400 });
    const worlds = await supabaseRest<{ id: string }[]>(`worlds?id=eq.${body.worldId}&select=id`, session.token);
    if (!worlds[0]) return NextResponse.json({ error: "World not found." }, { status: 404 });
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
    if (!title) return NextResponse.json({ error: "Album title is required." }, { status: 400 });
    const payload = { world_id: body.worldId, owner_id: session.user.id, title, description: typeof body.description === "string" ? body.description.trim().slice(0, 1000) || null : null, start_date: typeof body.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate) ? body.startDate : null, end_date: typeof body.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.endDate) ? body.endDate : null, privacy: "private" };
    const rows = await supabaseRest<AlbumRow[]>("albums", session.token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
    return NextResponse.json({ album: rows[0] }, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not create album.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
