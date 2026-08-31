import type {
  ChatMessage,
  ChatStats,
  MonthStat,
  ParsedChat,
  ParticipantStat,
  ThreadTaleResultV2,
  WordStat,
} from "./types";

const STOP_WORDS = new Set([
  "the","and","that","this","with","you","your","for","are","was","were","have","has","had","but","not","from","they","them","their","what","when","where","who","why","how","can","could","would","should","will","just","like","really","very","then","than","there","here","been","being","because","about","into","onto","over","under","again","also","too","its","it's","im","i'm","ive","i've","dont","don't","didnt","didn't","cant","can't","wont","won't","yes","yeah","yep","nope","okay","ok","lol","haha","hahaha","https","http","www","com","image","omitted","video","audio","sticker","gif"
]);
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY = 86_400_000;
const HOUR = 3_600_000;
const HEART_SIGNAL = /(?:❤\uFE0F?|🩷|💙|💚|💛|💜|💕|💞|💓|💗|💖|💘|💝|💟)/gu;

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function dayKeyFromDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function ensureChronological(messages: ChatMessage[]) {
  for (let index = 1; index < messages.length; index++) {
    if (messages[index].timestamp < messages[index - 1].timestamp) {
      return [...messages].sort((a, b) => a.timestamp - b.timestamp);
    }
  }
  return messages;
}

function streakMetrics(sortedDays: number[]) {
  if (!sortedDays.length) return { longestStreak: 0, longestSilenceDays: 0 };
  let longestStreak = 1;
  let run = 1;
  let longestSilenceDays = 0;

  for (let index = 1; index < sortedDays.length; index++) {
    const difference = Math.round((sortedDays[index] - sortedDays[index - 1]) / DAY);
    if (difference === 1) run += 1;
    else run = 1;
    longestStreak = Math.max(longestStreak, run);
    longestSilenceDays = Math.max(longestSilenceDays, Math.max(0, difference - 1));
  }

  return { longestStreak, longestSilenceDays };
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9'’]+/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/[’']/g, "'"))
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

export function analyzeChat(messages: ChatMessage[]): ChatStats {
  if (!messages.length) throw new Error("No supported chat messages found.");
  const sorted = ensureChronological(messages);
  const participantMap = new Map<string, ParticipantStat>();
  const replyGaps = new Map<string, number[]>();
  const globalReplyGaps: number[] = [];
  const wordMap = new Map<string, number>();
  const hourCounts = Array(24).fill(0) as number[];
  const weekdayCounts = Array(7).fill(0) as number[];
  const yearMap = new Map<number, number>();
  const dayCounts = new Map<number, number>();
  const activeDaySet = new Set<number>();
  const dayparts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  let totalWords = 0;
  let lateNightMessages = 0;
  let questionsAsked = 0;
  let laughSignals = 0;
  let heartSignals = 0;
  let mediaSignals = 0;

  for (let index = 0; index < sorted.length; index++) {
    const message = sorted[index];
    const words = tokenize(message.text);
    const questionCount = (message.text.match(/\?/g) ?? []).length;
    const laughCount = (message.text.match(/\b(?:ha){2,}|\blol+\b|😂|🤣/gi) ?? []).length;
    const heartCount = (message.text.match(HEART_SIGNAL) ?? []).length;
    const isMedia = /<media omitted>|image omitted|video omitted|audio omitted|sticker omitted/gi.test(message.text);
    const date = new Date(message.timestamp);
    const hour = date.getHours();
    const previous = index > 0 ? sorted[index - 1] : null;
    const gap = previous ? message.timestamp - previous.timestamp : null;
    const startsConversation = !previous || (gap !== null && gap > 6 * HOUR);

    totalWords += words.length;
    questionsAsked += questionCount;
    laughSignals += laughCount;
    heartSignals += heartCount;
    if (isMedia) mediaSignals += 1;

    const participant = participantMap.get(message.sender) ?? {
      name: message.sender,
      messages: 0,
      percentage: 0,
      words: 0,
      avgWords: 0,
      questions: 0,
      conversationStarts: 0,
      lateNightMessages: 0,
      laughSignals: 0,
      heartSignals: 0,
      medianReplyMinutes: null,
    };
    participant.messages += 1;
    participant.words += words.length;
    participant.questions += questionCount;
    participant.laughSignals += laughCount;
    participant.heartSignals += heartCount;
    if (startsConversation) participant.conversationStarts += 1;
    if (hour >= 0 && hour < 5) participant.lateNightMessages += 1;
    participantMap.set(message.sender, participant);

    if (previous && previous.sender !== message.sender && gap !== null && gap > 0 && gap <= 12 * HOUR) {
      const minutes = gap / 60_000;
      globalReplyGaps.push(minutes);
      const senderReplies = replyGaps.get(message.sender) ?? [];
      senderReplies.push(minutes);
      replyGaps.set(message.sender, senderReplies);
    }

    for (const word of words) wordMap.set(word, (wordMap.get(word) ?? 0) + 1);

    hourCounts[hour] += 1;
    weekdayCounts[date.getDay()] += 1;
    const year = date.getFullYear();
    yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
    const day = dayKeyFromDate(date);
    activeDaySet.add(day);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);

    if (hour >= 0 && hour < 5) {
      lateNightMessages += 1;
      dayparts.night += 1;
    } else if (hour < 12) dayparts.morning += 1;
    else if (hour < 17) dayparts.afternoon += 1;
    else dayparts.evening += 1;
  }

  const participants = [...participantMap.values()]
    .map((participant) => ({
      ...participant,
      percentage: Number(((participant.messages / sorted.length) * 100).toFixed(1)),
      avgWords: Number((participant.words / Math.max(1, participant.messages)).toFixed(1)),
      medianReplyMinutes: median(replyGaps.get(participant.name) ?? []),
    }))
    .sort((a, b) => b.messages - a.messages);

  const topWords: WordStat[] = [...wordMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word, count]) => ({ word, count }));

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const favoriteWeekdayIndex = weekdayCounts.indexOf(Math.max(...weekdayCounts));
  const firstTimestamp = sorted[0].timestamp;
  const lastTimestamp = sorted[sorted.length - 1].timestamp;
  const daysTogether = Math.max(1, Math.floor((lastTimestamp - firstTimestamp) / DAY) + 1);
  const laughRate = laughSignals / sorted.length;
  const heartRate = heartSignals / sorted.length;
  const questionRate = questionsAsked / sorted.length;
  const nightRate = lateNightMessages / sorted.length;
  const balance = participants.length >= 2 ? 100 - Math.abs(participants[0].percentage - participants[1].percentage) : 30;
  const sortedDays = [...activeDaySet].sort((a, b) => a - b);
  const { longestStreak, longestSilenceDays } = streakMetrics(sortedDays);

  let biggestDayTimestamp = firstTimestamp;
  let biggestDayMessages = 0;
  for (const [timestamp, count] of dayCounts) {
    if (count > biggestDayMessages) {
      biggestDayTimestamp = timestamp;
      biggestDayMessages = count;
    }
  }

  return {
    participants,
    totalMessages: sorted.length,
    totalWords,
    firstTimestamp,
    lastTimestamp,
    daysTogether,
    activeDays: activeDaySet.size,
    longestStreak,
    longestSilenceDays,
    medianReplyMinutes: median(globalReplyGaps),
    biggestDay: { timestamp: biggestDayTimestamp, messages: biggestDayMessages },
    peakHour,
    peakHourMessages: hourCounts[peakHour],
    favoriteWeekday: WEEKDAYS[favoriteWeekdayIndex],
    lateNightMessages,
    questionsAsked,
    laughSignals,
    heartSignals,
    mediaSignals,
    dayparts,
    topWords,
    byYear: [...yearMap.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, messages: count })),
    vibe: {
      nightOwl: clamp(nightRate * 900 + 18),
      curiosity: clamp(questionRate * 320 + 22),
      chaos: clamp(laughRate * 500 + mediaSignals / Math.max(1, sorted.length) * 180 + 18),
      affection: clamp(heartRate * 850 + balance * 0.45 + 12),
    },
  };
}

function monthStats(messages: ChatMessage[]): MonthStat[] {
  const counts = new Map<string, number>();
  for (const message of messages) {
    const date = new Date(message.timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, messages]) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month, messages };
    });
}

export function analyzeThreadTale(parsed: ParsedChat): ThreadTaleResultV2 {
  const stats = analyzeChat(parsed.messages);
  return {
    schemaVersion: 2,
    source: {
      provider: "whatsapp",
      format: parsed.format,
      dateOrder: parsed.dateOrder,
      dateOrderConfidence: parsed.detection.confidence,
    },
    range: {
      start: stats.firstTimestamp,
      end: stats.lastTimestamp,
      days: stats.daysTogether,
      activeDays: stats.activeDays,
    },
    totals: {
      messages: stats.totalMessages,
      words: stats.totalWords,
      participants: stats.participants.length,
      media: stats.mediaSignals,
      questions: stats.questionsAsked,
      laughs: stats.laughSignals,
      hearts: stats.heartSignals,
      lateNightMessages: stats.lateNightMessages,
    },
    participants: stats.participants,
    activity: {
      longestStreak: stats.longestStreak,
      longestSilenceDays: stats.longestSilenceDays,
      busiestDay: stats.biggestDay,
      peakHour: stats.peakHour,
      peakHourMessages: stats.peakHourMessages,
      favoriteWeekday: stats.favoriteWeekday,
      dayparts: stats.dayparts,
      byYear: stats.byYear,
      byMonth: monthStats(parsed.messages),
    },
    conversation: {
      medianReplyMinutes: stats.medianReplyMinutes,
      topWords: stats.topWords,
    },
    presentation: {
      vibe: stats.vibe,
    },
  };
}
