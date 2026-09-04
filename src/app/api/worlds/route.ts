import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
import { isWorldProduct } from "@/platform/worlds/catalog";

export const runtime = "nodejs";

type WorldRow = { id: string; user_id: string; product: string; title: string; anchor_date?: string | null; cover_media_id?: string | null; visibility?: string; summary?: string | null; created_at: string; updated_at: string };

export async function GET() {
  try {
    const session = await requireStorySession();
    const worlds = await supabaseRest<WorldRow[]>("worlds?select=id,user_id,product,title,anchor_date,cover_media_id,visibility,summary,created_at,updated_at&order=updated_at.desc&limit=100", session.token);
    return NextResponse.json({ worlds });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load worlds.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireStorySession();
    const body = await request.json() as { product?: unknown; title?: unknown; anchorDate?: unknown; summary?: unknown };
    if (!isWorldProduct(body.product)) return NextResponse.json({ error: "Choose a valid story product." }, { status: 400 });
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
    if (!title) return NextResponse.json({ error: "World title is required." }, { status: 400 });
    const payload = { user_id: session.user.id, product: body.product, title, anchor_date: typeof body.anchorDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.anchorDate) ? body.anchorDate : null, summary: typeof body.summary === "string" ? body.summary.trim().slice(0, 500) || null : null, visibility: "private" };
    const rows = await supabaseRest<WorldRow[]>("worlds", session.token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
    return NextResponse.json({ world: rows[0] }, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not create world.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
