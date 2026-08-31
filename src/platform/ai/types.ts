import type { StoryChapter } from "@/platform/types";

export interface StoryEnrichmentInput {
  product: "threadtales" | "myyear" | "petlife";
  mode?: string;
  facts: Record<string, string | number | boolean | null>;
  chapters: Array<Pick<StoryChapter, "id" | "type" | "title" | "subtitle" | "metric" | "supportingText" | "renderVariant">>;
  selectedSnippet?: string;
  snippetConsent?: boolean;
}

export interface StoryEnrichmentResult {
  text: string;
  provider: string;
  model: string;
}

export interface StoryEnrichmentProvider {
  readonly name: string;
  enrich(input: StoryEnrichmentInput): Promise<StoryEnrichmentResult>;
}

const THREADTALES_FACTS = new Set([
  "totalMessages","totalWords","daysTogether","activeDays","longestStreak","longestSilenceDays","medianReplyMinutes","peakHour","favoriteWeekday","lateNightMessages","questionsAsked","laughSignals","heartSignals","mediaSignals","conversationBalance","yearCount",
]);

const FORBIDDEN_KEYS = /raw|messageText|chatMessages|participants|topWords|sender|transcript/i;

export function validateStoryEnrichmentInput(input: StoryEnrichmentInput) {
  if (!input || !["threadtales","myyear","petlife"].includes(input.product)) throw new Error("Unsupported AI enrichment product.");
  const entries = Object.entries(input.facts ?? {});
  if (entries.length > 30) throw new Error("Too many enrichment facts.");
  for (const [key, value] of entries) {
    if (FORBIDDEN_KEYS.test(key)) throw new Error(`AI enrichment rejected private-content field: ${key}`);
    if (input.product === "threadtales" && !THREADTALES_FACTS.has(key)) throw new Error(`ThreadTales AI fact is not allowlisted: ${key}`);
    if (!["string","number","boolean"].includes(typeof value) && value !== null) throw new Error("AI facts must contain derived scalar values only.");
    if (typeof value === "string" && value.length > 160) throw new Error("AI fact text is too long.");
  }
  if (!Array.isArray(input.chapters) || input.chapters.length > 20) throw new Error("Invalid enrichment chapter list.");
  for (const chapter of input.chapters) {
    const joined = [chapter.id, chapter.type, chapter.title, chapter.subtitle, chapter.metric, chapter.supportingText, chapter.renderVariant].filter((value) => value !== undefined).join(" ");
    if (joined.length > 1000) throw new Error("AI chapter input is too long.");
  }
  const snippet = input.selectedSnippet?.trim();
  if (snippet) {
    if (!input.snippetConsent) throw new Error("Explicit consent is required before sending a selected snippet to AI.");
    if (snippet.length > 600) throw new Error("Selected AI snippet must be 600 characters or fewer.");
  }
}
