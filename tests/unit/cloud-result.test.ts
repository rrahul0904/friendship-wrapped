import { describe, expect, it } from "vitest";
import { analyzeChat } from "@/lib/analyze";
import { parseChat } from "@/lib/parser";
import { toThreadTaleResultV2 } from "@/platform/threadtales/result-v2";
import { cloudResultToStats, sanitizeThreadTaleCloudResult } from "@/platform/threadtales/cloud-result";
import { assertDerivedStoryPayload } from "@/platform/persistence/supabase-rest";

const stats = analyzeChat(parseChat([
  "1/20/2026, 9:00 AM - SECRET_PERSON_ALPHA: secretword secretword secretword",
  "1/20/2026, 9:02 AM - SECRET_PERSON_BETA: secretword secretword",
  "1/21/2026, 9:00 AM - SECRET_PERSON_ALPHA: secretword secretword",
  "2/21/2026, 9:02 AM - SECRET_PERSON_BETA: hello",
  "2/21/2026, 9:03 AM - SECRET_PERSON_ALPHA: goodbye",
].join("\n")));

describe("ThreadTales cloud projection", () => {
  it("saves actual analyzer output with numeric message counts and reopens it", () => {
    const cloud = sanitizeThreadTaleCloudResult(toThreadTaleResultV2(stats));
    expect(() => assertDerivedStoryPayload(cloud)).not.toThrow();
    const reopened = cloudResultToStats(cloud);
    expect(reopened.totalMessages).toBe(stats.totalMessages);
    expect(reopened.byMonth).toEqual(stats.byMonth);
    expect(reopened.byYear).toEqual(stats.byYear);
  });

  it("removes names, vocabulary and unknown nested content before cloud transmission", () => {
    const result = toThreadTaleResultV2(stats);
    const poisoned = { ...result, transcript: "SECRET_RAW_CHAT", participants: result.participants.map((p) => ({ ...p, note: "SECRET_RAW_CHAT" })), metrics: { ...result.metrics, privateNote: "SECRET_RAW_CHAT" }, timeline: result.timeline.map((p) => ({ ...p, label: "SECRET_RAW_CHAT" })) };
    const cloud = sanitizeThreadTaleCloudResult(poisoned);
    const serialized = JSON.stringify(cloud);
    expect(serialized).not.toMatch(/SECRET_|secretword/);
    expect(cloud.participants[0].name).toBe("Person 1");
    expect(cloud.metrics.topWords).toEqual([]);
  });

  it.each(["PRIVATE_CHAT", ["PRIVATE_CHAT"], { text: "PRIVATE_CHAT" }, -1, NaN, Infinity])("rejects messages that are not bounded counters: %j", (messages) => {
    expect(() => assertDerivedStoryPayload({ messages })).toThrow();
    const result = toThreadTaleResultV2(stats);
    expect(() => sanitizeThreadTaleCloudResult({ ...result, timeline: [{ key: "2026-01", messages }] })).toThrow();
  });

  it("rejects text in a numeric metric instead of transmitting it", () => {
    const result = toThreadTaleResultV2(stats);
    expect(() => sanitizeThreadTaleCloudResult({ ...result, metrics: { ...result.metrics, totalMessages: "PRIVATE_CHAT" } })).toThrow(/numeric/);
  });
});
