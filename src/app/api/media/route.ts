import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest, supabaseStorageSignedUrl, supabaseStorageUpload } from "@/platform/persistence/supabase-rest";
import { getUserSubscription } from "@/platform/billing/subscription";
import { planCatalog } from "@/platform/billing/plans";

export const runtime = "nodejs";

const allowedMime = new Map([
  ["image/jpeg", { kind: "image", ext: "jpg" }],
  ["image/png", { kind: "image", ext: "png" }],
  ["image/webp", { kind: "image", ext: "webp" }],
  ["video/mp4", { kind: "video", ext: "mp4" }],
  ["video/webm", { kind: "video", ext: "webm" }],
  ["audio/mpeg", { kind: "audio", ext: "mp3" }],
  ["audio/mp4", { kind: "audio", ext: "m4a" }],
  ["audio/wav", { kind: "audio", ext: "wav" }],
  ["application/pdf", { kind: "document", ext: "pdf" }],
]);

type MediaRow = { id: string; user_id: string; world_id: string | null; object_path: string; mime_type: string | null; size_bytes: number | null; media_kind: string; caption?: string | null; occurred_at?: string | null; place?: string | null; created_at: string };

export async function GET(request: Request) {
  try {
    const session = await requireStorySession();
    const url = new URL(request.url);
    const world = url.searchParams.get("world");
    const filter = world && /^[0-9a-f-]{36}$/i.test(world) ? `&world_id=eq.${world}` : "";
    const rows = await supabaseRest<MediaRow[]>(`media_assets?select=id,user_id,world_id,object_path,mime_type,size_bytes,media_kind,caption,occurred_at,place,created_at${filter}&order=created_at.desc&limit=100`, session.token);
    const media = await Promise.all(rows.map(async (row) => ({ ...row, signedUrl: await supabaseStorageSignedUrl(row.object_path, session.token).catch(() => null) })));
    return NextResponse.json({ media });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load media.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireStorySession();
    const subscription = await getUserSubscription(session.user.id, session.token).catch(() => ({ plan_slug: "free" as const, status: "free" }));
    const limits = planCatalog[subscription.plan_slug];
    const form = await request.formData();
    const upload = form.get("file");
    if (!(upload instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    const type = allowedMime.get(upload.type);
    if (!type) return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
    if (upload.size <= 0 || upload.size > limits.maxUploadBytes) return NextResponse.json({ error: `Your ${limits.label} plan supports files up to ${Math.round(limits.maxUploadBytes / 1024 / 1024)} MB.` }, { status: 413 });
    const worldId = String(form.get("worldId") ?? "");
    const validWorld = /^[0-9a-f-]{36}$/i.test(worldId) ? worldId : null;
    if (validWorld) {
      const worlds = await supabaseRest<{ id: string }[]>(`worlds?id=eq.${validWorld}&select=id`, session.token);
      if (!worlds[0]) return NextResponse.json({ error: "World not found." }, { status: 404 });
    }
    const current = await supabaseRest<{ size_bytes: number | null }[]>("media_assets?select=size_bytes&limit=5000", session.token);
    const currentBytes = current.reduce((sum, item) => sum + Number(item.size_bytes ?? 0), 0);
    if (currentBytes + upload.size > limits.storageBytes) return NextResponse.json({ error: `${limits.label} storage quota reached. Remove media or change plan before uploading more.` }, { status: 409 });
    const path = `${session.user.id}/${validWorld ?? "library"}/${randomUUID()}.${type.ext}`;
    await supabaseStorageUpload(path, upload, session.token, upload.type);
    const payload = {
      user_id: session.user.id,
      world_id: validWorld,
      object_path: path,
      mime_type: upload.type,
      size_bytes: upload.size,
      media_kind: type.kind,
      caption: String(form.get("caption") ?? "").trim().slice(0, 500) || null,
      place: String(form.get("place") ?? "").trim().slice(0, 160) || null,
      occurred_at: String(form.get("occurredAt") ?? "") || null,
    };
    try {
      const rows = await supabaseRest<MediaRow[]>("media_assets", session.token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
      const row = rows[0];
      const signedUrl = row ? await supabaseStorageSignedUrl(row.object_path, session.token).catch(() => null) : null;
      return NextResponse.json({ media: row ? { ...row, signedUrl } : null }, { status: 201 });
    } catch (error) {
      // The object is private and inaccessible to other users; metadata failure is surfaced for cleanup instead of hidden.
      throw error;
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not upload media.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
