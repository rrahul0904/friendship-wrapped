import type { ChatStats, PublicSnapshot, StoryMode } from "./types";

export function createSnapshot(
  stats: ChatStats,
  options: { includeTopWords?: boolean; includeNames?: boolean; mode?: StoryMode } = {},
): PublicSnapshot {
  const { includeTopWords = false, includeNames = false, mode = "friends" } = options;
  return {
    v: 1,
    generatedAt: Date.now(),
    mode,
    totalMessages: stats.totalMessages,
    totalWords: stats.totalWords,
    firstTimestamp: stats.firstTimestamp,
    lastTimestamp: stats.lastTimestamp,
    daysTogether: stats.daysTogether,
    activeDays: stats.activeDays,
    longestStreak: stats.longestStreak,
    longestSilenceDays: stats.longestSilenceDays,
    medianReplyMinutes: stats.medianReplyMinutes,
    biggestDay: stats.biggestDay,
    peakHour: stats.peakHour,
    favoriteWeekday: stats.favoriteWeekday,
    lateNightMessages: stats.lateNightMessages,
    questionsAsked: stats.questionsAsked,
    laughSignals: stats.laughSignals,
    heartSignals: stats.heartSignals,
    dayparts: stats.dayparts,
    participants: stats.participants.slice(0, 8).map(({ name, messages, percentage, avgWords, conversationStarts, medianReplyMinutes }, index) => ({
      name: includeNames ? name : `Person ${index + 1}`,
      messages,
      percentage,
      avgWords,
      conversationStarts,
      medianReplyMinutes,
    })),
    byYear: stats.byYear.slice(-12),
    vibe: stats.vibe,
    ...(includeTopWords ? { topWords: stats.topWords.slice(0, 8) } : {}),
  };
}

export function encodeSnapshot(snapshot: PublicSnapshot) {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeSnapshot(encoded: string): PublicSnapshot | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64 + "===".slice((base64.length + 3) % 4);
    const binary = atob(pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const value = JSON.parse(new TextDecoder().decode(bytes)) as PublicSnapshot;
    if (value.v !== 1 || !Array.isArray(value.participants) || !value.totalMessages) return null;
    return value;
  } catch {
    return null;
  }
}
