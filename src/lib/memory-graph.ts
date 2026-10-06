import type { ChatStats } from "./types";
import type { ThreadTalesLocalLore } from "@/platform/threadtales/lore";

export type MemoryCandidateKind =
  | "BEGINNING"
  | "BIG_DAY"
  | "LONGEST_STREAK"
  | "LONGEST_SILENCE"
  | "SHARED_LANGUAGE"
  | "LATE_NIGHT"
  | "HEART_SIGNAL"
  | "LAUGH_SIGNAL"
  | "BUSIEST_YEAR";

export type MemoryDecision = "KEEP" | "SKIP";

export interface MemoryCandidate {
  schemaVersion: 1;
  id: string;
  memorySpaceId: string;
  source: "CONVERSATION";
  kind: MemoryCandidateKind;
  title: string;
  detail: string;
  occurredAt?: string;
  containsPrivateText: boolean;
  evidence: {
    type: "DERIVED_STAT" | "LOCAL_TEXT";
    key: string;
  };
}

export interface MemoryNode {
  schemaVersion: 1;
  id: string;
  memorySpaceId: string;
  source: "CONVERSATION";
  kind: MemoryCandidateKind;
  title: string;
  detail: string;
  occurredAt?: string;
  containsPrivateText: boolean;
  approvedAt: string;
  provenance: MemoryCandidate["evidence"];
}

export interface MemoryGraph {
  schemaVersion: 1;
  memorySpaceId: string;
  nodes: MemoryNode[];
  updatedAt: string;
}

export interface MemoryReviewState {
  schemaVersion: 1;
  memorySpaceId: string;
  decisions: Record<string, MemoryDecision>;
  updatedAt: string;
}

function iso(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function candidate(
  memorySpaceId: string,
  kind: MemoryCandidateKind,
  title: string,
  detail: string,
  evidence: MemoryCandidate["evidence"],
  options: Pick<MemoryCandidate, "occurredAt" | "containsPrivateText">,
): MemoryCandidate {
  return {
    schemaVersion: 1,
    id: `${memorySpaceId}:conversation:${kind.toLowerCase()}:${evidence.key}`,
    memorySpaceId,
    source: "CONVERSATION",
    kind,
    title,
    detail,
    evidence,
    ...options,
  };
}

export function buildConversationMemoryCandidates(
  memorySpaceId: string,
  stats: ChatStats,
  lore: ThreadTalesLocalLore | null,
): MemoryCandidate[] {
  const result: MemoryCandidate[] = [];

  const beginningDetail = lore?.firstMessageText
    ? `The thread begins with “${lore.firstMessageText}”`
    : `The conversation begins on ${new Date(stats.firstTimestamp).toLocaleDateString("en-US", { dateStyle: "medium" })}.`;
  result.push(candidate(
    memorySpaceId,
    "BEGINNING",
    "Where this thread begins",
    beginningDetail,
    { type: lore?.firstMessageText ? "LOCAL_TEXT" : "DERIVED_STAT", key: "first-message" },
    { occurredAt: iso(stats.firstTimestamp), containsPrivateText: Boolean(lore?.firstMessageText) },
  ));

  if (stats.biggestDay?.messages > 0) {
    result.push(candidate(
      memorySpaceId,
      "BIG_DAY",
      "Your busiest day together",
      `${stats.biggestDay.messages.toLocaleString()} messages landed on this one day.`,
      { type: "DERIVED_STAT", key: `biggest-day-${stats.biggestDay.timestamp}` },
      { occurredAt: iso(stats.biggestDay.timestamp), containsPrivateText: false },
    ));
  }

  if (stats.longestStreak > 1) {
    result.push(candidate(
      memorySpaceId,
      "LONGEST_STREAK",
      "A streak that kept going",
      `${stats.longestStreak.toLocaleString()} consecutive days with messages.`,
      { type: "DERIVED_STAT", key: "longest-streak" },
      { containsPrivateText: false },
    ));
  }

  if (stats.longestSilenceDays > 0) {
    result.push(candidate(
      memorySpaceId,
      "LONGEST_SILENCE",
      "When the thread went quiet",
      `${stats.longestSilenceDays.toLocaleString()} days was the longest quiet stretch in this history.`,
      { type: "DERIVED_STAT", key: "longest-silence" },
      { containsPrivateText: false },
    ));
  }

  const phrase = lore?.recurringPhrases[0];
  if (phrase) {
    result.push(candidate(
      memorySpaceId,
      "SHARED_LANGUAGE",
      "A phrase that became part of the thread",
      `“${phrase.phrase}” appears ${phrase.count.toLocaleString()} times.`,
      { type: "LOCAL_TEXT", key: `phrase-${phrase.phrase}` },
      { containsPrivateText: true },
    ));
  }

  if (stats.lateNightMessages > 0) {
    result.push(candidate(
      memorySpaceId,
      "LATE_NIGHT",
      "The conversations that ran late",
      `${stats.lateNightMessages.toLocaleString()} messages were sent late at night.`,
      { type: "DERIVED_STAT", key: "late-night" },
      { containsPrivateText: false },
    ));
  }

  if (stats.heartSignals > 0) {
    result.push(candidate(
      memorySpaceId,
      "HEART_SIGNAL",
      "A little signal that kept showing up",
      `${stats.heartSignals.toLocaleString()} heart signals appear across the conversation.`,
      { type: "DERIVED_STAT", key: "heart-signals" },
      { containsPrivateText: false },
    ));
  }

  if (stats.laughSignals > 0) {
    result.push(candidate(
      memorySpaceId,
      "LAUGH_SIGNAL",
      "The thread had plenty of laughter",
      `${stats.laughSignals.toLocaleString()} laughter signals show up in the messages.`,
      { type: "DERIVED_STAT", key: "laugh-signals" },
      { containsPrivateText: false },
    ));
  }

  const busiestYear = [...stats.byYear].sort((a, b) => b.messages - a.messages || a.year - b.year)[0];
  if (busiestYear) {
    result.push(candidate(
      memorySpaceId,
      "BUSIEST_YEAR",
      `${busiestYear.year} was a big chapter`,
      `${busiestYear.messages.toLocaleString()} messages were exchanged that year.`,
      { type: "DERIVED_STAT", key: `year-${busiestYear.year}` },
      { containsPrivateText: false },
    ));
  }

  return result.slice(0, 9);
}

export function newMemoryGraph(memorySpaceId: string, now = new Date()): MemoryGraph {
  return { schemaVersion: 1, memorySpaceId, nodes: [], updatedAt: now.toISOString() };
}

export function memoryGraphStorageKey(memorySpaceId: string) {
  return `threadtales:memory-graph:v1:${memorySpaceId}`;
}

export function memoryReviewStorageKey(memorySpaceId: string) {
  return `threadtales:memory-review:v1:${memorySpaceId}`;
}

export function applyMemoryDecision(
  graph: MemoryGraph,
  candidateValue: MemoryCandidate,
  decision: MemoryDecision,
  now = new Date(),
): MemoryGraph {
  const nodes = graph.nodes.filter((node) => node.id !== candidateValue.id);
  if (decision === "KEEP") {
    nodes.push({
      schemaVersion: 1,
      id: candidateValue.id,
      memorySpaceId: candidateValue.memorySpaceId,
      source: candidateValue.source,
      kind: candidateValue.kind,
      title: candidateValue.title,
      detail: candidateValue.detail,
      occurredAt: candidateValue.occurredAt,
      containsPrivateText: candidateValue.containsPrivateText,
      approvedAt: now.toISOString(),
      provenance: candidateValue.evidence,
    });
  }
  return { ...graph, nodes, updatedAt: now.toISOString() };
}

export function isMemoryGraph(value: unknown): value is MemoryGraph {
  if (!value || typeof value !== "object") return false;
  const graph = value as Partial<MemoryGraph>;
  return graph.schemaVersion === 1 && typeof graph.memorySpaceId === "string" && Array.isArray(graph.nodes) && typeof graph.updatedAt === "string";
}
