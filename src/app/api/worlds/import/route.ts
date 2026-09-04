import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
import { isWorldProduct } from "@/platform/worlds/catalog";

export const runtime = "nodejs";

type ImportedEvent = { date?: unknown; title?: unknown; detail?: unknown; people?: unknown; place?: unknown; extra?: unknown; kind?: unknown };

function safeString(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export async function POST(request: Request) {
  try {
    const session = await requireStorySession();
    const body = await request.json() as { product?: unknown; title?: unknown; anchorDate?: unknown; events?: unknown };
    if (!isWorldProduct(body.product)) return NextResponse.json({ error: "Choose a valid story product." }, { status: 400 });
    if (body.product === "threadtales") return NextResponse.json({ error: "ThreadTales raw-chat drafts cannot use world import. Save the derived story from the ThreadTales results screen instead." }, { status: 400 });
    const title = safeString(body.title, 160);
    if (!title) return NextResponse.json({ error: "World title is required." }, { status: 400 });
    if (!Array.isArray(body.events) || body.events.length > 1000) return NextResponse.json({ error: "Import up to 1,000 selected memories at a time." }, { status: 400 });
    const worldRows = await supabaseRest<{ id: string }[]>("worlds", session.token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ user_id: session.user.id, product: body.product, title, anchor_date: typeof body.anchorDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.anchorDate) ? body.anchorDate : null, visibility: "private" }) });
    const world = worldRows[0];
    if (!world) throw new Error("World creation did not return an id.");
    const events = (body.events as ImportedEvent[]).map((event) => {
      const eventTitle = safeString(event.title, 160);
      const rawDate = safeString(event.date, 32);
      const occurredAt = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? new Date(`${rawDate.slice(0, 10)}T12:00:00Z`).toISOString() : new Date().toISOString();
      const people = safeString(event.people, 120).split(",").map((part) => part.trim()).filter(Boolean).slice(0, 12);
      return {
        user_id: session.user.id,
        world_id: world.id,
        product: body.product,
        event_type: safeString(event.kind, 80) || "Memory",
        occurred_at: occurredAt,
        title: eventTitle || "Untitled memory",
        description: safeString(event.detail, 2000) || null,
        people,
        location: safeString(event.place, 160) || null,
        metadata: safeString(event.extra, 180) ? { extra: safeString(event.extra, 180) } : {},
      };
    });
    if (events.length) await supabaseRest<Record<string, unknown>[]>("story_events", session.token, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(events) });
    return NextResponse.json({ saved: true, worldId: world.id, eventCount: events.length }, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not save local world.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Sign in to save this world across devices." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
