import type { StoryEnrichmentInput, StoryEnrichmentIntent, StoryEnrichmentProvider, StoryEnrichmentResult } from "./types";
import { validateStoryEnrichmentInput } from "./types";

interface OpenAIResponse { model?: string; output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } | null; }

function outputText(response: OpenAIResponse) {
  return (response.output ?? []).flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text).join("\n").trim();
}

function intentInstruction(intent: StoryEnrichmentIntent | undefined) {
  switch (intent) {
    case "sweeter": return "Write one warm, sincere share caption. Keep it concise and grounded only in supplied facts; do not invent intimacy or quote hidden messages.";
    case "funnier": return "Write one playful, funny chapter caption grounded only in supplied facts. Avoid insults, relationship judgments, or invented events.";
    case "birthday-caption": return "Write one celebratory birthday share caption using only supplied facts and safe chapters. Keep identities unknown unless explicitly supplied in a consented snippet.";
    case "anniversary-caption": return "Write one warm anniversary share caption using only supplied facts and safe chapters. Do not infer relationship health or private events.";
    case "shorter-share-caption": return "Write one very short social share caption, ideally under 140 characters, using only supplied facts and safe chapters.";
    default: return "Return concise editable copy: a recap paragraph, 3 alternate chapter titles, and a short narration script.";
  }
}

export class OpenAIStoryEnrichmentProvider implements StoryEnrichmentProvider {
  readonly name = "openai";
  constructor(private readonly apiKey: string, private readonly model = "gpt-5.6-luna") {}

  async enrich(input: StoryEnrichmentInput): Promise<StoryEnrichmentResult> {
    validateStoryEnrichmentInput(input);
    const payload = { product: input.product, mode: input.mode, intent: input.intent ?? "recap", facts: input.facts, chapters: input.chapters, ...(input.selectedSnippet?.trim() ? { userSelectedSnippet: input.selectedSnippet.trim() } : {}) };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        store: false,
        max_output_tokens: 700,
        instructions: `You enrich a personal story using only supplied derived facts, safe chapters, and any explicitly user-selected snippet. Do not infer private facts, relationship health, diagnoses, identities, or hidden message content. ${intentInstruction(input.intent)}`,
        input: JSON.stringify(payload),
        text: { verbosity: "low" },
      }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({})) as OpenAIResponse;
    if (!response.ok) throw new Error(data.error?.message ?? "AI enrichment provider failed.");
    const text = outputText(data);
    if (!text) throw new Error("AI enrichment returned no text.");
    return { text, provider: this.name, model: data.model ?? this.model };
  }
}

export function getStoryEnrichmentProvider(): StoryEnrichmentProvider | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAIStoryEnrichmentProvider(apiKey, process.env.OPENAI_STORY_MODEL || "gpt-5.6-luna");
}
