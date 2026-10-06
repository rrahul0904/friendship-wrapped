import { describe, expect, it } from "vitest";
import type { ChatStats } from "./types";
import {
  applyMemoryDecision,
  buildConversationMemoryCandidates,
  isMemoryGraph,
  memoryGraphStorageKey,
  memoryReviewStorageKey,
  newMemoryGraph,
} from "./memory-graph";

const stats: ChatStats = {
  participants: [],
  totalMessages: 1000,
  totalWords: 5000,
  firstTimestamp: Date.UTC(2019, 0, 1),
  lastTimestamp: Date.UTC(2026, 0, 1),
  daysTogether: 2557,
  activeDays: 900,
  longestStreak: 42,
  longestSilenceDays: 18,
  medianReplyMinutes: 12,
  biggestDay: { timestamp: Date.UTC(2023, 5, 10), messages: 321 },
  peakHour: 22,
  peakHourMessages: 100,
  favoriteWeekday: "Sunday",
  lateNightMessages: 77,
  questionsAsked: 90,
  laughSignals: 61,
  heartSignals: 44,
  mediaSignals: 20,
  dayparts: { morning: 10, afternoon: 20, evening: 30, night: 40 },
  topWords: [],
  byYear: [
    { year: 2022, messages: 300 },
    { year: 2023, messages: 420 },
  ],
  byMonth: [],
  responseGaps: { under5Minutes: 1, under30Minutes: 2, under2Hours: 3, under12Hours: 4, over12Hours: 5 },
  conversationBalance: 0.5,
  vibe: { nightOwl: 50, curiosity: 50, chaos: 50, affection: 50 },
};

describe("MemoryGraph candidate boundary", () => {
  it("builds bounded deterministic candidates from derived stats and local lore", () => {
    const candidates = buildConversationMemoryCandidates("space-1", stats, {
      firstMessageText: "Did you make it home?",
      recurringPhrases: [{ phrase: "drive safe", count: 23 }],
    });

    expect(candidates.length).toBeLessThanOrEqual(9);
    expect(candidates.map((item) => item.kind)).toEqual(expect.arrayContaining([
      "BEGINNING",
      "BIG_DAY",
      "LONGEST_STREAK",
      "SHARED_LANGUAGE",
      "BUSIEST_YEAR",
    ]));
    expect(candidates.find((item) => item.kind === "SHARED_LANGUAGE")?.containsPrivateText).toBe(true);
    expect(candidates.find((item) => item.kind === "BIG_DAY")?.containsPrivateText).toBe(false);
  });

  it("does not place a candidate into the graph until KEEP is explicit", () => {
    const candidate = buildConversationMemoryCandidates("space-1", stats, null)[0];
    const empty = newMemoryGraph("space-1", new Date("2026-10-05T20:00:00-04:00"));

    const skipped = applyMemoryDecision(empty, candidate, "SKIP", new Date("2026-10-05T20:01:00-04:00"));
    expect(skipped.nodes).toHaveLength(0);

    const kept = applyMemoryDecision(skipped, candidate, "KEEP", new Date("2026-10-05T20:02:00-04:00"));
    expect(kept.nodes).toHaveLength(1);
    expect(kept.nodes[0].id).toBe(candidate.id);
    expect(kept.nodes[0].approvedAt).toBe("2026-10-06T00:02:00.000Z");
    expect(isMemoryGraph(kept)).toBe(true);
  });

  it("removes an approved node when a later decision changes to SKIP", () => {
    const candidate = buildConversationMemoryCandidates("space-1", stats, null)[0];
    const kept = applyMemoryDecision(newMemoryGraph("space-1"), candidate, "KEEP");
    const skipped = applyMemoryDecision(kept, candidate, "SKIP");
    expect(skipped.nodes).toHaveLength(0);
  });

  it("scopes graph and review persistence keys to the MemorySpace", () => {
    expect(memoryGraphStorageKey("abc")).toBe("threadtales:memory-graph:v1:abc");
    expect(memoryReviewStorageKey("abc")).toBe("threadtales:memory-review:v1:abc");
  });
});
