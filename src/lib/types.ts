export type DateOrder = "auto" | "mdy" | "dmy";
export type StoryMode = "friends" | "couple" | "siblings" | "family" | "group";

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
