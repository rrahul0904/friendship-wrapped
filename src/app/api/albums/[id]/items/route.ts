import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
import { getUserSubscription } from "@/platform/billing/subscription";
import { planCatalog } from "@/platform/billing/plans";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid album id." }, { status: 400 });
    const albums = await supabaseRest<{ id: string; owner_id: string }[]>(`albums?id=eq.${id}&select=id,owner_id`, session.token);
    if (!albums[0]) return NextResponse.json({ error: "Album not found." }, { status: 404 });
    const body = await request.json() as { mediaId?: unknown; caption?: unknown; occurredAt?: unknown };
    if (typeof body.mediaId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.mediaId)) return NextResponse.json({ error: "Choose valid media." }, { status: 400 });
    const media = await supabaseRest<{ id: string }[]>(`media_assets?id=eq.${body.mediaId}&select=id`, session.token);
    if (!media[0]) return NextResponse.json({ error: "Media not found." }, { status: 404 });
    const existing = await supabaseRest<{ media_id: string }[]>(`album_items?album_id=eq.${id}&select=media_id&limit=5000`, session.token);
    const subscription = await getUserSubscription(session.user.id, session.token).catch(() => ({ plan_slug: "free" as const, status: "free" }));
    const max = planCatalog[subscription.plan_slug].maxAlbumItems;
    if (existing.length >= max) return NextResponse.json({ error: `Your ${planCatalog[subscription.plan_slug].label} plan supports ${max} items per album.` }, { status: 409 });
    const payload = { album_id: id, media_id: body.mediaId, position: existing.length, caption: typeof body.caption === "string" ? body.caption.trim().slice(0, 500) || null : null, occurred_at: typeof body.occurredAt === "string" ? body.occurredAt || null : null };
    const rows = await supabaseRest<Record<string, unknown>[]>("album_items", session.token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
    return NextResponse.json({ item: rows[0] }, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not add media to album.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    const body = await request.json() as { items?: Array<{ mediaId: string; position: number; caption?: string; favorite?: boolean }> };
    if (!/^[0-9a-f-]{36}$/i.test(id) || !Array.isArray(body.items) || body.items.length > 2000) return NextResponse.json({ error: "Invalid album update." }, { status: 400 });
    for (const item of body.items) {
      if (!/^[0-9a-f-]{36}$/i.test(item.mediaId) || !Number.isInteger(item.position) || item.position < 0) continue;
      const update = { position: item.position, ...(typeof item.caption === "string" ? { caption: item.caption.trim().slice(0, 500) || null } : {}), ...(typeof item.favorite === "boolean" ? { is_favorite: item.favorite } : {}) };
      await supabaseRest<null>(`album_items?album_id=eq.${id}&media_id=eq.${item.mediaId}`, session.token, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(update) });
    }
    return NextResponse.json({ updated: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not reorder album.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStorySession();
    const { id } = await context.params;
    const mediaId = new URL(request.url).searchParams.get("mediaId") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(mediaId)) return NextResponse.json({ error: "Invalid album item." }, { status: 400 });
    await supabaseRest<null>(`album_items?album_id=eq.${id}&media_id=eq.${mediaId}`, session.token, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ deleted: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not remove album item.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
