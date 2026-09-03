import type { ChatStats, StoryMode } from "@/lib/types";

export type StoryPrivacyLevel = "safe" | "sensitive";
export type StoryThemeId = "midnight" | "sunset" | "paper" | "neon";
export type StoryChapterType =
  | "cover"
  | "beginning"
  | "scale"
  | "balance"
  | "conversation-starter"
  | "reply-speed"
  | "response-rhythm"
  | "streak"
  | "busiest-day"
  | "late-night"
  | "language"
  | "vibe"
  | "timeline"
  | "closing";

export interface StoryChapter {
  id: string;
  type: StoryChapterType;
  title: string;
  subtitle?: string;
  metric?: string | number;
  supportingText?: string;
  privacyLevel: StoryPrivacyLevel;
  renderVariant: "hero" | "metric" | "split" | "timeline" | "closing";
}

export interface StoryModeConfig {
  id: StoryMode;
  label: string;
  eyebrow: string;
  ending: string;
  noun: string;
  theme: StoryThemeId;
  chapterPriority: StoryChapterType[];
  recommendedExports: Array<"vertical" | "square" | "portrait" | "print">;
  seoTitle: string;
  seoDescription: string;
}

export interface ThreadTaleTimelinePoint {
  key: string;
  label: string;
  messages: number;
}

export interface ThreadTaleResultV2 {
  schemaVersion: 2;
  generatedAt: string;
  source: "whatsapp" | "telegram" | "other";
  range: { start: string; end: string };
  participants: ChatStats["participants"];
  metrics: Omit<ChatStats, "participants" | "byYear" | "byMonth" | "topWords"> & {
    topWords: ChatStats["topWords"];
  };
  timeline: ThreadTaleTimelinePoint[];
}

export interface PublicStoryCard {
  id: string;
  title: string;
  subtitle?: string;
  metric?: string | number;
  renderVariant: StoryChapter["renderVariant"];
}

export interface ThreadTaleShareManifest {
  version: 1;
  mode: StoryMode;
  title?: string;
  cards: PublicStoryCard[];
  attribution: boolean;
}

export interface StoryEvent {
  id: string;
  product: "threadtales" | "myyear" | "petlife" | "relationship" | "lifemap" | "babystory" | "homestory" | "familytree" | "founderworld" | "creatorworld";
  /** Optional for legacy local artifacts; required for a persisted multi-world record. */
  worldId?: string;
  occurredAt: string;
  type: string;
  title: string;
  description?: string;
  location?: string;
  people?: string[];
  media?: Array<{ id: string; name: string; url?: string; mimeType?: string }>;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface PrintPage {
  id: string;
  kind: "cover" | "chapter" | "timeline" | "dedication" | "ending";
  title: string;
  body?: string;
  metric?: string | number;
}

export interface PrintCover {
  title: string;
  subtitle?: string;
}

export interface PrintBookSpec {
  trimSize: "6x9" | "8x10";
  pages: PrintPage[];
  cover: PrintCover;
  bleed: number;
}
