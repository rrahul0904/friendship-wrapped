import type { ChatMessage, ChatStats, ParticipantStat, WordStat } from "./types";

const STOP_WORDS = new Set([
  "the","and","that","this","with","you","your","for","are","was","were","have","has","had","but","not","from","they","them","their","what","when","where","who","why","how","can","could","would","should","will","just","like","really","very","then","than","there","here","been","being","because","about","into","onto","over","under","again","also","too","its","it's","im","i'm","ive","i've","dont","don't","didnt","didn't","cant","can't","wont","won't","yes","yeah","yep","nope","okay","ok","lol","haha","hahaha","https","http","www","com","image","omitted","video","audio","sticker","gif"
]);
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY = 86_400_000;
const HOUR = 3_600_000;

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function dayKey(timestamp: number) {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function longestStreak(timestamps: number[]) {
  const days = [...new Set(timestamps.map(dayKey))].sort((a, b) => a - b);
  let best = days.length ? 1 : 0;
  let run = best;
  for (let i = 1; i < days.length; i++) {
    if (Math.round((days[i] - days[i - 1]) / DAY) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
  }
  return best;
}

function longestSilence(timestamps: number[]) {
  const days = [...new Set(timestamps.map(dayKey))].sort((a, b) => a - b);
  let best = 0;
  for (let i = 1; i < days.length; i++) {
    best = Math.max(best, Math.max(0, Math.round((days[i] - days[i - 1]) / DAY) - 1));
  }
  return best;
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
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
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
    const heartCount = (message.text.match(/[❤️💙💚💛💜🩷💕💞💓💗💖💘💝💟]/gu) ?? []).length;
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

    const p = participantMap.get(message.sender) ?? {
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
    p.messages += 1;
    p.words += words.length;
    p.questions += questionCount;
    p.laughSignals += laughCount;
    p.heartSignals += heartCount;
    if (startsConversation) p.conversationStarts += 1;
    if (hour >= 0 && hour < 5) p.lateNightMessages += 1;
    participantMap.set(message.sender, p);

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
    yearMap.set(date.getFullYear(), (yearMap.get(date.getFullYear()) ?? 0) + 1);
    const day = dayKey(message.timestamp);
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
    .map((p) => ({
      ...p,
      percentage: Number(((p.messages / sorted.length) * 100).toFixed(1)),
      avgWords: Number((p.words / Math.max(1, p.messages)).toFixed(1)),
      medianReplyMinutes: median(replyGaps.get(p.name) ?? []),
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
  const [biggestDayTimestamp, biggestDayMessages] = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [firstTimestamp, 1];

  return {
    participants,
    totalMessages: sorted.length,
    totalWords,
    firstTimestamp,
    lastTimestamp,
    daysTogether,
    activeDays: activeDaySet.size,
    longestStreak: longestStreak(sorted.map((m) => m.timestamp)),
    longestSilenceDays: longestSilence(sorted.map((m) => m.timestamp)),
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
