import type { StoryChapter } from "@/platform/types";
import { STORY_MODES } from "@/platform/story/modes";

export const STORY_ENRICHMENT_INTENTS = ["recap", "sweeter", "funnier", "birthday-caption", "anniversary-caption", "shorter-share-caption"] as const;
export type StoryEnrichmentIntent = (typeof STORY_ENRICHMENT_INTENTS)[number];

export interface StoryEnrichmentInput {
  product: "threadtales" | "myyear" | "petlife";
  mode?: string;
  intent?: StoryEnrichmentIntent;
  facts: Record<string, string | number | boolean | null>;
  chapters: Array<Pick<StoryChapter, "id" | "type" | "title" | "subtitle" | "metric" | "supportingText" | "renderVariant">>;
  selectedSnippet?: string;
  snippetConsent?: boolean;
}

export interface StoryEnrichmentResult { text: string; provider: string; model: string; }
export interface StoryEnrichmentProvider { readonly name: string; enrich(input: StoryEnrichmentInput): Promise<StoryEnrichmentResult>; }

const THREADTALES_FACTS = new Set(["totalMessages","totalWords","daysTogether","activeDays","longestStreak","longestSilenceDays","medianReplyMinutes","peakHour","favoriteWeekday","lateNightMessages","questionsAsked","laughSignals","heartSignals","mediaSignals","conversationBalance","yearCount"]);
const FORBIDDEN_KEYS = /raw|messageText|chatMessages|participants|topWords|sender|transcript/i;

export function validateStoryEnrichmentInput(input: StoryEnrichmentInput) {
  if (!input || !["threadtales","myyear","petlife"].includes(input.product)) throw new Error("Unsupported AI enrichment product.");
  if (input.mode !== undefined && (typeof input.mode !== "string" || !Object.hasOwn(STORY_MODES, input.mode))) throw new Error("Unsupported AI enrichment mode.");
  if (input.intent !== undefined && !STORY_ENRICHMENT_INTENTS.includes(input.intent)) throw new Error("Unsupported AI enrichment intent.");
  if (!input.facts || typeof input.facts !== "object" || Array.isArray(input.facts)) throw new Error("Invalid enrichment facts.");
  const entries = Object.entries(input.facts ?? {});
  if (entries.length > 30) throw new Error("Too many enrichment facts.");
  for (const [key, value] of entries) {
    if (FORBIDDEN_KEYS.test(key)) throw new Error(`AI enrichment rejected private-content field: ${key}`);
    if (input.product === "threadtales" && !THREADTALES_FACTS.has(key)) throw new Error(`ThreadTales AI fact is not allowlisted: ${key}`);
    if (!["string","number","boolean"].includes(typeof value) && value !== null) throw new Error("AI facts must contain derived scalar values only.");
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Invalid numeric AI fact.");
    if (input.product === "threadtales" && key === "favoriteWeekday" && !["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].includes(String(value))) throw new Error("Invalid derived weekday.");
    if (input.product === "threadtales" && key !== "favoriteWeekday" && value !== null && typeof value !== "number") throw new Error("ThreadTales AI metrics must be numeric.");
    if (typeof value === "string" && value.length > 160) throw new Error("AI fact text is too long.");
  }
  if (!Array.isArray(input.chapters) || input.chapters.length > 20) throw new Error("Invalid enrichment chapter list.");
  for (const chapter of input.chapters) {
    if (!chapter || typeof chapter !== "object" || Array.isArray(chapter)) throw new Error("Invalid enrichment chapter.");
    for (const key of ["id", "type", "title", "subtitle", "supportingText", "renderVariant"] as const) {
      if (chapter[key] !== undefined && typeof chapter[key] !== "string") throw new Error("Invalid enrichment chapter field.");
    }
    if (typeof chapter.id !== "string" || typeof chapter.title !== "string") throw new Error("Invalid enrichment chapter.");
    if (chapter.metric !== undefined && typeof chapter.metric !== "string" && !(typeof chapter.metric === "number" && Number.isFinite(chapter.metric))) throw new Error("Invalid enrichment chapter metric.");
    const joined = [chapter.id, chapter.type, chapter.title, chapter.subtitle, chapter.metric, chapter.supportingText, chapter.renderVariant].filter((value) => value !== undefined).join(" ");
    if (joined.length > 1000) throw new Error("AI chapter input is too long.");
  }
  if (input.selectedSnippet !== undefined && typeof input.selectedSnippet !== "string") throw new Error("Invalid selected snippet.");
  const snippet = input.selectedSnippet?.trim();
  if (snippet) {
    if (input.snippetConsent !== true) throw new Error("Explicit consent is required before sending a selected snippet to AI.");
    if (snippet.length > 600) throw new Error("Selected AI snippet must be 600 characters or fewer.");
  }
}

/** Project every nested object before serialization; TypeScript types do not sanitize JSON. */
export function sanitizeStoryEnrichmentInput(input: StoryEnrichmentInput): StoryEnrichmentInput {
  validateStoryEnrichmentInput(input);
  return {
    product: input.product,
    ...(input.mode !== undefined ? { mode: input.mode } : {}),
    ...(input.intent !== undefined ? { intent: input.intent } : {}),
    facts: { ...input.facts },
    chapters: input.chapters.map(({ id, type, title, subtitle, metric, supportingText, renderVariant }) => ({ id, type, title, subtitle, metric, supportingText, renderVariant })),
    ...(input.selectedSnippet?.trim() ? { selectedSnippet: input.selectedSnippet.trim(), snippetConsent: true } : {}),
  };
}
