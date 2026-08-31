export type DateOrder = "auto" | "mdy" | "dmy";
export type ResolvedDateOrder = Exclude<DateOrder, "auto">;
export type StoryMode = "friends" | "couple" | "siblings" | "family" | "group";
export type ChatSourceFormat = "android" | "ios" | "mixed" | "unknown";

export interface ChatMessage {
  sender: string;
  timestamp: number;
  text: string;
}

export interface ParticipantStat {
  name: string;
  messages: number;
  percentage: number;
  words: number;
  avgWords: number;
  questions: number;
  conversationStarts: number;
  lateNightMessages: number;
  laughSignals: number;
  heartSignals: number;
  medianReplyMinutes: number | null;
}

export interface YearStat {
  year: number;
  messages: number;
}

export interface MonthStat {
  year: number;
  month: number;
  messages: number;
}

export interface WordStat {
  word: string;
  count: number;
}

export interface BigDayStat {
  timestamp: number;
  messages: number;
}

export interface DaypartStats {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

export interface ChatStats {
  participants: ParticipantStat[];
  totalMessages: number;
  totalWords: number;
  firstTimestamp: number;
  lastTimestamp: number;
  daysTogether: number;
  activeDays: number;
  longestStreak: number;
  longestSilenceDays: number;
  medianReplyMinutes: number | null;
  biggestDay: BigDayStat;
  peakHour: number;
  peakHourMessages: number;
  favoriteWeekday: string;
  lateNightMessages: number;
  questionsAsked: number;
  laughSignals: number;
  heartSignals: number;
  mediaSignals: number;
  dayparts: DaypartStats;
  topWords: WordStat[];
  byYear: YearStat[];
  vibe: {
    nightOwl: number;
    curiosity: number;
    chaos: number;
    affection: number;
  };
}

export interface DateOrderDetection {
  detected: ResolvedDateOrder | null;
  confidence: "high" | "ambiguous";
  evidenceCount: number;
}

export interface ParsedChat {
  messages: ChatMessage[];
  format: ChatSourceFormat;
  dateOrder: ResolvedDateOrder;
  detection: DateOrderDetection;
}

export interface ThreadTaleResultV2 {
  schemaVersion: 2;
  source: {
    provider: "whatsapp";
    format: ChatSourceFormat;
    dateOrder: ResolvedDateOrder;
    dateOrderConfidence: DateOrderDetection["confidence"];
  };
  range: {
    start: number;
    end: number;
    days: number;
    activeDays: number;
  };
  totals: {
    messages: number;
    words: number;
    participants: number;
    media: number;
    questions: number;
    laughs: number;
    hearts: number;
    lateNightMessages: number;
  };
  participants: ParticipantStat[];
  activity: {
    longestStreak: number;
    longestSilenceDays: number;
    busiestDay: BigDayStat;
    peakHour: number;
    peakHourMessages: number;
    favoriteWeekday: string;
    dayparts: DaypartStats;
    byYear: YearStat[];
    byMonth: MonthStat[];
  };
  conversation: {
    medianReplyMinutes: number | null;
    topWords: WordStat[];
  };
  presentation: {
    vibe: ChatStats["vibe"];
  };
}

export interface PublicSnapshot {
  v: 1;
  generatedAt: number;
  mode?: StoryMode;
  totalMessages: number;
  totalWords: number;
  firstTimestamp: number;
  lastTimestamp: number;
  daysTogether: number;
  activeDays: number;
  longestStreak: number;
  longestSilenceDays?: number;
  medianReplyMinutes?: number | null;
  biggestDay?: BigDayStat;
  peakHour: number;
  favoriteWeekday: string;
  lateNightMessages: number;
  questionsAsked: number;
  laughSignals: number;
  heartSignals: number;
  dayparts?: DaypartStats;
  participants: Array<Pick<ParticipantStat, "name" | "messages" | "percentage"> & Partial<Pick<ParticipantStat, "avgWords" | "conversationStarts" | "medianReplyMinutes">>>;
  byYear: YearStat[];
  vibe: ChatStats["vibe"];
  topWords?: WordStat[];
}
