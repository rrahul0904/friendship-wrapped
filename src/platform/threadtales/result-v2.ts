import type { ChatStats } from "@/lib/types";
import type { ThreadTaleResultV2 } from "@/platform/types";

export function toThreadTaleResultV2(stats: ChatStats, source: ThreadTaleResultV2["source"] = "whatsapp"): ThreadTaleResultV2 {
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    source,
    range: {
      start: new Date(stats.firstTimestamp).toISOString(),
      end: new Date(stats.lastTimestamp).toISOString(),
    },
    participants: stats.participants,
    metrics: {
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
      peakHourMessages: stats.peakHourMessages,
      favoriteWeekday: stats.favoriteWeekday,
      lateNightMessages: stats.lateNightMessages,
      questionsAsked: stats.questionsAsked,
      laughSignals: stats.laughSignals,
      heartSignals: stats.heartSignals,
      mediaSignals: stats.mediaSignals,
      dayparts: stats.dayparts,
      responseGaps: stats.responseGaps,
      conversationBalance: stats.conversationBalance,
      vibe: stats.vibe,
      topWords: stats.topWords,
    },
    timeline: stats.byMonth.map((point) => ({ key: point.month, label: point.month, messages: point.messages })),
  };
}

export function isThreadTaleResultV2(value: unknown): value is ThreadTaleResultV2 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ThreadTaleResultV2>;
  return candidate.schemaVersion === 2 && Boolean(candidate.range?.start && candidate.range?.end) && Array.isArray(candidate.participants) && Array.isArray(candidate.timeline);
}
