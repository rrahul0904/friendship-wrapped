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
  it("projects nested chapter objects before serializing provider input", async () => {
    const fetchSpy = vi.fn(async (...args: Parameters<typeof fetch>): Promise<Response> => {
      void args;
      return new Response(JSON.stringify({ output: [{ content: [{ type: "output_text", text: "Safe copy" }] }] }));
    });
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenAIStoryEnrichmentProvider("test-key", "test-model");
    const poisoned = { ...safeInput, chapters: [{ ...safeInput.chapters[0], rawChat: "SECRET_NESTED_CHAT", metadata: { messages: ["SECRET_NESTED_CHAT"] } }] };
    await provider.enrich(poisoned);
    expect(JSON.stringify(fetchSpy.mock.calls)).not.toContain("SECRET_NESTED_CHAT");
  });

  it("never forwards user-controlled chapter copy without snippet consent", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ output: [{ content: [{ type: "output_text", text: "Safe copy" }] }] })));
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenAIStoryEnrichmentProvider("test-key", "test-model");
    const poisoned = {
      ...safeInput,
      chapters: [{
        ...safeInput.chapters[0],
        title: "PRIVATE_CHAPTER_TITLE",
        subtitle: "PRIVATE_CHAPTER_SUBTITLE",
        supportingText: "PRIVATE_CHAPTER_NOTE",
        metric: "PRIVATE_METRIC_TEXT",
      }],
    };

    await provider.enrich(poisoned);
    const [, init] = (fetchSpy.mock.calls as unknown as Array<Parameters<typeof fetch>>)[0];
    const requestBody = JSON.parse(String(init?.body)) as { input: string };
    const providerInput = JSON.parse(requestBody.input) as { chapters: Array<Record<string, unknown>> };
    expect(providerInput.chapters).toEqual([{ type: "scale" }]);
    expect(String(init?.body)).not.toContain("PRIVATE_CHAPTER_TITLE");
    expect(String(init?.body)).not.toContain("PRIVATE_CHAPTER_SUBTITLE");
    expect(String(init?.body)).not.toContain("PRIVATE_CHAPTER_NOTE");
    expect(String(init?.body)).not.toContain("PRIVATE_METRIC_TEXT");
  });

  it.each(["true", 1, {}, []])("rejects non-boolean snippet consent %j", async (snippetConsent) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(new OpenAIStoryEnrichmentProvider("test-key").enrich({ ...safeInput, selectedSnippet: "PRIVATE", snippetConsent } as StoryEnrichmentInput)).rejects.toThrow(/consent/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects private text smuggled into numeric facts or mode", async () => {
    const provider = new OpenAIStoryEnrichmentProvider("test-key");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(provider.enrich({ ...safeInput, facts: { totalMessages: "PRIVATE_CHAT" } })).rejects.toThrow(/numeric/);
    await expect(provider.enrich({ ...safeInput, mode: "PRIVATE_CHAT" })).rejects.toThrow(/mode/);
    await expect(provider.enrich({ ...safeInput, chapters: [{ ...safeInput.chapters[0], metric: { transcript: "PRIVATE_CHAT" } }] } as unknown as StoryEnrichmentInput)).rejects.toThrow(/metric/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects products without a reviewed derived-fact schema", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new OpenAIStoryEnrichmentProvider("test-key");
    await expect(provider.enrich({ ...safeInput, product: "myyear", facts: { title: "PRIVATE_TITLE" } })).rejects.toThrow(/not enabled for this product/i);
    await expect(provider.enrich({ ...safeInput, product: "petlife", facts: { petName: "PRIVATE_NAME" } })).rejects.toThrow(/not enabled for this product/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

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
