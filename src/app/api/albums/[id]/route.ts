import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest, supabaseStorageSignedUrl } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

function validId(id: string) { return /^[0-9a-f-]{36}$/i.test(id); }

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid album id." }, { status: 400 });
    const albums = await supabaseRest<Record<string, unknown>[]>(`albums?id=eq.${id}&select=*`, session.token);
    if (!albums[0]) return NextResponse.json({ error: "Album not found." }, { status: 404 });
    const items = await supabaseRest<{ album_id: string; media_id: string; position: number; caption?: string | null; occurred_at?: string | null; is_favorite?: boolean }[]>(`album_items?album_id=eq.${id}&select=*&order=position.asc`, session.token);
    const mediaIds = items.map((item) => item.media_id);
    const media = mediaIds.length ? await supabaseRest<{ id: string; object_path: string; mime_type?: string | null; media_kind: string; caption?: string | null; occurred_at?: string | null }[]>(`media_assets?id=in.(${mediaIds.join(",")})&select=id,object_path,mime_type,media_kind,caption,occurred_at`, session.token) : [];
    const hydrated = await Promise.all(media.map(async (asset) => ({ ...asset, signedUrl: await supabaseStorageSignedUrl(asset.object_path, session.token).catch(() => null) })));
    const soundtrack = await supabaseRest<{ track_id: string; position: number }[]>(`album_music_tracks?album_id=eq.${id}&select=track_id,position&order=position.asc`, session.token);
    return NextResponse.json({ album: albums[0], items, media: hydrated, soundtrack });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load album.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid album id." }, { status: 400 });
    const body = await request.json() as { title?: unknown; description?: unknown; coverMediaId?: unknown; startDate?: unknown; endDate?: unknown };
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim().slice(0, 120);
    if (typeof body.description === "string") update.description = body.description.trim().slice(0, 1000) || null;
    if (body.coverMediaId === null || (typeof body.coverMediaId === "string" && validId(body.coverMediaId))) update.cover_media_id = body.coverMediaId;
    if (typeof body.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) update.start_date = body.startDate;
    if (typeof body.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.endDate)) update.end_date = body.endDate;
    const rows = await supabaseRest<Record<string, unknown>[]>(`albums?id=eq.${id}`, session.token, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(update) });
    if (!rows[0]) return NextResponse.json({ error: "Album not found." }, { status: 404 });
    return NextResponse.json({ album: rows[0] });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not update album.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid album id." }, { status: 400 });
    await supabaseRest<null>(`albums?id=eq.${id}`, session.token, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ deleted: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not delete album.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
