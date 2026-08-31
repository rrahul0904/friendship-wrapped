import type { ChatStats, ThreadTaleResultV2 } from "./types";

export function resultToChatStats(result: ThreadTaleResultV2): ChatStats {
  return {
    participants: result.participants,
    totalMessages: result.totals.messages,
    totalWords: result.totals.words,
    firstTimestamp: result.range.start,
    lastTimestamp: result.range.end,
    daysTogether: result.range.days,
    activeDays: result.range.activeDays,
    longestStreak: result.activity.longestStreak,
    longestSilenceDays: result.activity.longestSilenceDays,
    medianReplyMinutes: result.conversation.medianReplyMinutes,
    biggestDay: result.activity.busiestDay,
    peakHour: result.activity.peakHour,
    peakHourMessages: result.activity.peakHourMessages,
    favoriteWeekday: result.activity.favoriteWeekday,
    lateNightMessages: result.totals.lateNightMessages,
    questionsAsked: result.totals.questions,
    laughSignals: result.totals.laughs,
    heartSignals: result.totals.hearts,
    mediaSignals: result.totals.media,
    dayparts: result.activity.dayparts,
    topWords: result.conversation.topWords,
    byYear: result.activity.byYear,
    vibe: result.presentation.vibe,
  };
}
