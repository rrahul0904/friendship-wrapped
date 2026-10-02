import type { ChatStats } from "@/lib/types";
import type { ThreadTaleResultV2 } from "@/platform/types";
import { isThreadTaleResultV2 } from "./result-v2";

function numeric(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error("Invalid derived numeric metric.");
  return value;
}

function numbers<K extends string>(value: unknown, keys: readonly K[]): Record<K, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid derived metric object.");
  const record = value as Record<string, unknown>;
  return Object.fromEntries(keys.map((key) => [key, numeric(record[key])])) as Record<K, number>;
}

function iso(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error("Invalid derived date.");
  return new Date(value).toISOString();
}

const metricKeys = ["totalMessages", "totalWords", "firstTimestamp", "lastTimestamp", "daysTogether", "activeDays", "longestStreak", "longestSilenceDays", "peakHour", "peakHourMessages", "lateNightMessages", "questionsAsked", "laughSignals", "heartSignals", "mediaSignals", "conversationBalance"] as const;
const participantKeys = ["messages", "percentage", "words", "avgWords", "questions", "conversationStarts", "lateNightMessages", "laughSignals", "heartSignals"] as const;
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const reply = (value: unknown) => value === null ? null : numeric(value);

/** Shared browser/server projection: aggregate counts only, anonymous labels, no vocabulary. */
export function sanitizeThreadTaleCloudResult(value: unknown): ThreadTaleResultV2 {
  if (!isThreadTaleResultV2(value) || !["whatsapp", "telegram", "other"].includes(value.source)) throw new Error("ThreadTales cloud saves require the derived result v2 schema.");
  if (value.participants.length > 1000 || value.timeline.length > 2400) throw new Error("Derived story is too large.");
  const metrics = value.metrics;
  if (!metrics || !weekdays.includes(metrics.favoriteWeekday)) throw new Error("Invalid derived weekday.");
  return {
    schemaVersion: 2,
    generatedAt: iso(value.generatedAt),
    source: value.source,
    range: { start: iso(value.range.start), end: iso(value.range.end) },
    participants: value.participants.map((participant, index) => ({
      name: `Person ${index + 1}`,
      ...numbers(participant, participantKeys),
      medianReplyMinutes: reply(participant?.medianReplyMinutes),
    })),
    metrics: {
      ...numbers(metrics, metricKeys),
      medianReplyMinutes: reply(metrics.medianReplyMinutes),
      biggestDay: numbers(metrics.biggestDay, ["timestamp", "messages"]),
      favoriteWeekday: metrics.favoriteWeekday,
      dayparts: numbers(metrics.dayparts, ["morning", "afternoon", "evening", "night"]),
      responseGaps: numbers(metrics.responseGaps, ["under5Minutes", "under30Minutes", "under2Hours", "under12Hours", "over12Hours"]),
      vibe: numbers(metrics.vibe, ["nightOwl", "curiosity", "chaos", "affection"]),
      topWords: [],
    },
    timeline: value.timeline.map((point) => {
      if (!point || typeof point.key !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(point.key)) throw new Error("Invalid derived timeline month.");
      return { key: point.key, label: point.key, messages: numeric(point.messages) };
    }),
  };
}

export function cloudResultToStats(value: unknown): ChatStats {
  const result = sanitizeThreadTaleCloudResult(value);
  const years = new Map<number, number>();
  for (const point of result.timeline) {
    const year = Number(point.key.slice(0, 4));
    years.set(year, (years.get(year) ?? 0) + point.messages);
  }
  return { ...result.metrics, participants: result.participants, byMonth: result.timeline.map(({ key, messages }) => ({ month: key, messages })), byYear: [...years].map(([year, messages]) => ({ year, messages })) };
}
