import { NextResponse } from "next/server";
import { getStoryEnrichmentProvider } from "@/platform/ai/openai-provider";
import { validateStoryEnrichmentInput, type StoryEnrichmentInput } from "@/platform/ai/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ enabled: Boolean(getStoryEnrichmentProvider()), provider: getStoryEnrichmentProvider()?.name ?? null });
}

export async function POST(request: Request) {
  try {
    const provider = getStoryEnrichmentProvider();
    if (!provider) return NextResponse.json({ error: "Optional AI enrichment is not configured." }, { status: 503 });
    const input = await request.json() as StoryEnrichmentInput;
    validateStoryEnrichmentInput(input);
    const result = await provider.enrich(input);
    return NextResponse.json(result);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "AI enrichment failed.";
    return NextResponse.json({ error: message }, { status: /consent|rejected|invalid|unsupported|too/i.test(message) ? 400 : 502 });
  }
}
