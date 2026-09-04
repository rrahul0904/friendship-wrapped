import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

function validId(value: string) { return /^[0-9a-f-]{36}$/i.test(value); }

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid world id." }, { status: 400 });
    const [worlds, events, albums, tracks] = await Promise.all([
      supabaseRest<Record<string, unknown>[]>(`worlds?id=eq.${id}&select=*`, session.token),
      supabaseRest<Record<string, unknown>[]>(`story_events?world_id=eq.${id}&select=*&order=occurred_at.asc&limit=1000`, session.token),
      supabaseRest<Record<string, unknown>[]>(`albums?world_id=eq.${id}&select=*&order=updated_at.desc`, session.token),
      supabaseRest<Record<string, unknown>[]>(`world_music_tracks?world_id=eq.${id}&select=track_id,position&order=position.asc`, session.token),
    ]);
    if (!worlds[0]) return NextResponse.json({ error: "World not found." }, { status: 404 });
    return NextResponse.json({ world: worlds[0], events, albums, soundtrack: tracks });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load world.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid world id." }, { status: 400 });
    const body = await request.json() as { title?: unknown; summary?: unknown; anchorDate?: unknown; coverMediaId?: unknown };
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim().slice(0, 160);
    if (typeof body.summary === "string") update.summary = body.summary.trim().slice(0, 500) || null;
    if (typeof body.anchorDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.anchorDate)) update.anchor_date = body.anchorDate;
    if (body.coverMediaId === null || (typeof body.coverMediaId === "string" && validId(body.coverMediaId))) update.cover_media_id = body.coverMediaId;
    const rows = await supabaseRest<Record<string, unknown>[]>(`worlds?id=eq.${id}`, session.token, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(update) });
    if (!rows[0]) return NextResponse.json({ error: "World not found." }, { status: 404 });
    return NextResponse.json({ world: rows[0] });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not update world.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid world id." }, { status: 400 });
    await supabaseRest<null>(`worlds?id=eq.${id}`, session.token, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ deleted: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not delete world.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
