import { describe, expect, it } from "vitest";
import { analyzeChat } from "../../src/lib/analyze";
import type { ChatMessage } from "../../src/lib/types";

function at(day: number, hour: number, minute: number) {
  return new Date(2026, 0, day, hour, minute).getTime();
}

const messages: ChatMessage[] = [
  { sender: "Alice", timestamp: at(1, 0, 30), text: "hello there? ❤️" },
  { sender: "Bob", timestamp: at(1, 0, 40), text: "haha 😂" },
  { sender: "Alice", timestamp: at(2, 10, 0), text: "coffee plan" },
  { sender: "Bob", timestamp: at(2, 10, 20), text: "<Media omitted>" },
  { sender: "Alice", timestamp: at(4, 18, 0), text: "coffee coffee" },
];

describe("analyzeChat", () => {
  it("calculates deterministic core metrics", () => {
    const stats = analyzeChat(messages);

    expect(stats.totalMessages).toBe(5);
    expect(stats.totalWords).toBe(6);
    expect(stats.participants.map((p) => [p.name, p.messages, p.percentage])).toEqual([
      ["Alice", 3, 60],
      ["Bob", 2, 40],
    ]);
    expect(stats.activeDays).toBe(3);
    expect(stats.daysTogether).toBe(4);
    expect(stats.longestStreak).toBe(2);
    expect(stats.longestSilenceDays).toBe(1);
    expect(stats.biggestDay.messages).toBe(2);
    expect(new Date(stats.biggestDay.timestamp).getDate()).toBe(1);
    expect(stats.peakHour).toBe(0);
    expect(stats.favoriteWeekday).toBe("Thursday");
    expect(stats.lateNightMessages).toBe(2);
    expect(stats.questionsAsked).toBe(1);
    expect(stats.laughSignals).toBe(2);
    expect(stats.heartSignals).toBe(1);
    expect(stats.mediaSignals).toBe(1);
    expect(stats.medianReplyMinutes).toBe(15);
    expect(stats.dayparts).toEqual({ morning: 2, afternoon: 0, evening: 1, night: 2 });
    expect(stats.topWords[0]).toEqual({ word: "coffee", count: 3 });
    expect(stats.byYear).toEqual([{ year: 2026, messages: 5 }]);
    expect(stats.vibe).toEqual({ nightOwl: 100, curiosity: 86, chaos: 100, affection: 100 });
  });

  it("tracks conversation starts and reply speed by participant", () => {
    const stats = analyzeChat(messages);
    const alice = stats.participants.find((p) => p.name === "Alice");
    const bob = stats.participants.find((p) => p.name === "Bob");

    expect(alice?.conversationStarts).toBe(3);
    expect(bob?.conversationStarts).toBe(0);
    expect(alice?.medianReplyMinutes).toBeNull();
    expect(bob?.medianReplyMinutes).toBe(15);
    expect(alice?.avgWords).toBe(2);
  });

  it("sorts unsorted input without mutating the caller array", () => {
    const reversed = [...messages].reverse();
    const originalFirst = reversed[0];
    const stats = analyzeChat(reversed);
    expect(stats.firstTimestamp).toBe(messages[0].timestamp);
    expect(reversed[0]).toBe(originalFirst);
  });

  it("rejects an empty message collection", () => {
    expect(() => analyzeChat([])).toThrow("No supported chat messages found.");
  });
});
