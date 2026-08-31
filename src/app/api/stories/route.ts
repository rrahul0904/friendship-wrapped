import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { assertDerivedStoryPayload, supabaseRest } from "@/platform/persistence/supabase-rest";
import { isThreadTaleResultV2 } from "@/platform/threadtales/result-v2";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { token } = await requireStorySession();
    const rows = await supabaseRest<Array<{ id: string; product: string; mode?: string; title: string; result: unknown; created_at: string }>>(
      "story_runs?select=id,product,mode,title,result,created_at&order=created_at.desc&limit=25",
      token,
    );
    return NextResponse.json({ stories: rows });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not load saved stories.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Sign in to save and reopen stories." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    const { token, user } = await requireStorySession();
    const body = await request.json() as { product?: string; mode?: string; title?: string; result?: unknown };
    if (!body.product || !["threadtales", "myyear", "petlife"].includes(body.product)) throw new Error("Unsupported story product.");
    if (!body.title || body.title.trim().length > 160) throw new Error("Give this story a title under 160 characters.");
    assertDerivedStoryPayload(body.result);
    if (body.product === "threadtales" && !isThreadTaleResultV2(body.result)) throw new Error("ThreadTales cloud saves require the derived result v2 schema.");

    const rows = await supabaseRest<Array<{ id: string; product: string; mode?: string; title: string; created_at: string }>>(
      "story_runs?select=id,product,mode,title,created_at",
      token,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: user.id,
          product: body.product,
          mode: body.mode ?? null,
          title: body.title.trim(),
          result: body.result,
        }),
      },
    );
    return NextResponse.json({ story: rows[0] ?? null }, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not save this story.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Sign in before saving." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { token } = await requireStorySession();
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid story id.");
    await supabaseRest<null>(`story_runs?id=eq.${encodeURIComponent(id)}`, token, { method: "DELETE" });
    return new NextResponse(null, { status: 204 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not delete this story.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Sign in before deleting." : message }, { status: message === "AUTH_REQUIRED" ? 401 : /not configured/i.test(message) ? 503 : 400 });
  }
}
