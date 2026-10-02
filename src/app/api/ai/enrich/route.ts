import { NextResponse } from "next/server";
import { getStoryEnrichmentProvider } from "@/platform/ai/openai-provider";
import { validateStoryEnrichmentInput, type StoryEnrichmentInput } from "@/platform/ai/types";

export const runtime = "nodejs";
const MAX_AI_REQUEST_BYTES = 16 * 1024;

class RequestBodyTooLargeError extends Error {}

async function readBoundedJson(request: Request): Promise<StoryEnrichmentInput> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_AI_REQUEST_BYTES) throw new RequestBodyTooLargeError();

  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid AI enrichment request body.");
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_AI_REQUEST_BYTES) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as StoryEnrichmentInput;
}

export async function GET() {
  return NextResponse.json({ enabled: Boolean(getStoryEnrichmentProvider()), provider: getStoryEnrichmentProvider()?.name ?? null });
}

export async function POST(request: Request) {
  try {
    const provider = getStoryEnrichmentProvider();
    if (!provider) return NextResponse.json({ error: "Optional AI enrichment is not configured." }, { status: 503 });
    const input = await readBoundedJson(request);
    validateStoryEnrichmentInput(input);
    const result = await provider.enrich(input);
    return NextResponse.json(result);
  } catch (cause) {
    if (cause instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "AI enrichment request is too large." }, { status: 413 });
    }
    if (cause instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid AI enrichment request body." }, { status: 400 });
    }
    const message = cause instanceof Error ? cause.message : "AI enrichment failed.";
    return NextResponse.json({ error: message }, { status: /consent|rejected|invalid|unsupported|too/i.test(message) ? 400 : 502 });
  }
}
