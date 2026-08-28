export type DateOrder = "auto" | "mdy" | "dmy";

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
  questions: number;
}

export interface YearStat {
  year: number;
  messages: number;
}

export interface WordStat {
  word: string;
  count: number;
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
  peakHour: number;
  peakHourMessages: number;
  favoriteWeekday: string;
  lateNightMessages: number;
  questionsAsked: number;
  laughSignals: number;
  heartSignals: number;
  mediaSignals: number;
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
  totalMessages: number;
  totalWords: number;
  firstTimestamp: number;
  lastTimestamp: number;
  daysTogether: number;
  activeDays: number;
  longestStreak: number;
  peakHour: number;
  favoriteWeekday: string;
  lateNightMessages: number;
  questionsAsked: number;
  laughSignals: number;
  heartSignals: number;
  participants: Array<Pick<ParticipantStat, "name" | "messages" | "percentage">>;
  byYear: YearStat[];
  vibe: ChatStats["vibe"];
  topWords?: WordStat[];
}
