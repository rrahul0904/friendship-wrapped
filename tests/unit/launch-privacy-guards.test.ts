import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIStoryEnrichmentProvider } from "@/platform/ai/openai-provider";
import type { StoryEnrichmentInput } from "@/platform/ai/types";

const safeInput: StoryEnrichmentInput = {
  product: "threadtales",
  mode: "friends",
  facts: {
    totalMessages: 42,
    totalWords: 420,
    daysTogether: 365,
    activeDays: 120,
    longestStreak: 8,
    longestSilenceDays: 5,
    medianReplyMinutes: 14,
    peakHour: 20,
    favoriteWeekday: "Friday",
    lateNightMessages: 7,
    questionsAsked: 21,
    laughSignals: 16,
    heartSignals: 9,
    mediaSignals: 3,
    conversationBalance: 91,
    yearCount: 2,
  },
  chapters: [
    {
      id: "scale",
      type: "scale",
      title: "A year in messages",
      metric: 42,
      renderVariant: "metric",
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("launch privacy traps", () => {
  it("rejects raw-chat sentinels before any OpenAI request is sent", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenAIStoryEnrichmentProvider("test-key", "test-model");

    const poisoned = {
      ...safeInput,
      facts: {
        ...safeInput.facts,
        rawChat: "SECRET_RAW_CHAT_ALPHA",
        transcript: "SECRET_RAW_CHAT_BETA",
      },
    } as unknown as StoryEnrichmentInput;

    await expect(provider.enrich(poisoned)).rejects.toThrow(/rejected|allowlisted/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("requires consent before a private selected snippet can reach OpenAI", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenAIStoryEnrichmentProvider("test-key", "test-model");

    await expect(
      provider.enrich({
        ...safeInput,
        selectedSnippet: "PRIVATE_UNSHARED_SENTENCE",
        snippetConsent: false,
      }),
    ).rejects.toThrow(/consent/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not serialize unrelated raw-content properties into provider input", async () => {
    const fetchSpy = vi.fn(
      async (...args: Parameters<typeof fetch>): Promise<Response> => {
        void args;
        return new Response(
          JSON.stringify({
            model: "test-model",
            output: [
              {
                content: [
                  { type: "output_text", text: "Safe derived story copy" },
                ],
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    );
    vi.stubGlobal("fetch", fetchSpy);

    const provider = new OpenAIStoryEnrichmentProvider("test-key", "test-model");
    const inputWithUnrecognizedRawProperties = {
      ...safeInput,
      rawChat: "SECRET_RAW_CHAT_ALPHA",
      transcript: "SECRET_RAW_CHAT_BETA",
      privateNote: "PRIVATE_UNSHARED_SENTENCE",
    } as StoryEnrichmentInput & Record<string, unknown>;

    await provider.enrich(inputWithUnrecognizedRawProperties);
    const [, init] = fetchSpy.mock.calls[0];
    const serialized = String(init?.body);

    expect(serialized).not.toContain("SECRET_RAW_CHAT_ALPHA");
    expect(serialized).not.toContain("SECRET_RAW_CHAT_BETA");
    expect(serialized).not.toContain("PRIVATE_UNSHARED_SENTENCE");
  });
});
