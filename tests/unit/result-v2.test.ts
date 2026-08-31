import { describe, expect, it } from "vitest";
import { analyzeThreadTale } from "../../src/lib/analyze";
import { parseChatDetailed } from "../../src/lib/parser";
import { resultToChatStats } from "../../src/lib/result-adapter";

const raw = [
  "2/13/2026, 9:10 AM - Alice: secret sentence alpha coffee? ❤️",
  "2/13/2026, 9:12 AM - Bob: coffee haha",
  "2/14/2026, 10:00 AM - Alice: next day",
  "2/14/2026, 10:05 AM - Bob: <Media omitted>",
  "3/1/2026, 8:00 PM - Alice: march message",
].join("\n");

describe("ThreadTaleResultV2", () => {
  it("is versioned, serializable, deterministic, and contains no raw messages", () => {
    const parsed = parseChatDetailed(raw, "auto");
    const first = analyzeThreadTale(parsed);
    const second = analyzeThreadTale(parseChatDetailed(raw, "auto"));

    expect(first.schemaVersion).toBe(2);
    expect(first).toEqual(second);
    expect(() => JSON.stringify(first)).not.toThrow();
    expect(JSON.stringify(first)).not.toContain("secret sentence alpha");
    expect(first.source).toEqual({ provider: "whatsapp", format: "android", dateOrder: "mdy", dateOrderConfidence: "high" });
    expect(first.totals.messages).toBe(5);
    expect(first.totals.participants).toBe(2);
    expect(first.activity.byMonth).toEqual([
      { year: 2026, month: 2, messages: 4 },
      { year: 2026, month: 3, messages: 1 },
    ]);
  });

  it("adapts to the existing story/share ChatStats contract without recalculating", () => {
    const result = analyzeThreadTale(parseChatDetailed(raw, "mdy"));
    const legacy = resultToChatStats(result);
    expect(legacy.totalMessages).toBe(result.totals.messages);
    expect(legacy.participants).toEqual(result.participants);
    expect(legacy.topWords).toEqual(result.conversation.topWords);
    expect(legacy.vibe).toEqual(result.presentation.vibe);
  });
});
