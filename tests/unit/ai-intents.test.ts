import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIStoryEnrichmentProvider } from "@/platform/ai/openai-provider";
import { validateStoryEnrichmentInput, type StoryEnrichmentInput } from "@/platform/ai/types";

const input: StoryEnrichmentInput = {
  product: "threadtales",
  mode: "friends",
  intent: "shorter-share-caption",
  facts: { totalMessages: 42, totalWords: 420, daysTogether: 100, activeDays: 30, longestStreak: 4, longestSilenceDays: 3, medianReplyMinutes: 9, peakHour: 22, favoriteWeekday: "Friday", lateNightMessages: 3, questionsAsked: 12, laughSignals: 8, heartSignals: 4, mediaSignals: 2, conversationBalance: 90, yearCount: 1 },
  chapters: [{ id: "scale", type: "scale", title: "A lot happened", metric: 42, renderVariant: "metric" }],
};

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("AI writing intents", () => {
  it("accepts the bounded writing presets and rejects arbitrary prompt intent", () => {
    expect(() => validateStoryEnrichmentInput(input)).not.toThrow();
    expect(() => validateStoryEnrichmentInput({ ...input, intent: "reveal-private-chat" as never })).toThrow(/Unsupported AI enrichment intent/);
  });

  it("sends only the bounded intent plus existing safe input to the provider", async () => {
    const fetchSpy = vi.fn(async (...args: Parameters<typeof fetch>): Promise<Response> => {
      void args;
      return new Response(JSON.stringify({ model: "test-model", output: [{ content: [{ type: "output_text", text: "Short caption" }] }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenAIStoryEnrichmentProvider("test-key", "test-model");
    await provider.enrich(input);
    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse(String(init?.body)) as { store?: boolean; input?: string; instructions?: string };
    expect(body.store).toBe(false);
    expect(body.input).toContain("shorter-share-caption");
    expect(body.instructions).toMatch(/under 140 characters/i);
    expect(body.input).not.toMatch(/participants|topWords|rawChat|messageText/);
  });
});
