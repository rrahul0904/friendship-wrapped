import type { ChatStats } from "./types";

export type MemoryCandidateKind =
  | "BEGINNING"
  | "MESSAGE_SCALE"
  | "LONGEST_STREAK"
  | "LONGEST_SILENCE"
  | "PEAK_DAY"
  | "LATE_NIGHT_RHYTHM"
  | "SHARED_LANGUAGE"
  | "RELATIONSHIP_ERA";

export type MemoryCandidateStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface MemoryCandidate {
  schemaVersion: 1;
  id: string;
  memorySpaceId: string;
  kind: MemoryCandidateKind;
  title: string;
  summary: string;
  occurredAt: number | null;
  source: "CONVERSATION_DERIVED";
  status: MemoryCandidateStatus;
  facts: Record<string, string | number | null>;
}

export interface MemoryNode {
  schemaVersion: 1;
  id: string;
  memorySpaceId: string;
  kind: MemoryCandidateKind;
  title: string;
  summary: string;
  occurredAt: number | null;
  sourceCandidateId: string;
  facts: Record<string, string | number | null>;
  approvedAt: string;
}

export interface MemoryGraph {
  schemaVersion: 1;
  memorySpaceId: string;
  nodes: MemoryNode[];
  updatedAt: string;
}

export const MEMORY_GRAPH_STORAGE_PREFIX = "threadtales:memory-graph:v1:";

function candidateId(memorySpaceId: string, kind: MemoryCandidateKind) {
  return `${memorySpaceId}:${kind.toLowerCase()}`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function buildConversationMemoryCandidates(
  memorySpaceId: string,
  stats: ChatStats,
): MemoryCandidate[] {
  const candidates: MemoryCandidate[] = [];
  const push = (
    kind: MemoryCandidateKind,
    title: string,
    summary: string,
    occurredAt: number | null,
    facts: Record<string, string | number | null>,
  ) => {
    candidates.push({
      schemaVersion: 1,
      id: candidateId(memorySpaceId, kind),
      memorySpaceId,
      kind,
      title,
      summary,
      occurredAt,
      source: "CONVERSATION_DERIVED",
      status: "PENDING",
      facts,
    });
  };

  push(
    "BEGINNING",
    "Where this thread begins",
    `Your exported conversation starts on ${formatDate(stats.firstTimestamp)}.`,
    stats.firstTimestamp,
    { firstTimestamp: stats.firstTimestamp },
  );

  push(
    "MESSAGE_SCALE",
    "The conversation you built",
    `${stats.totalMessages.toLocaleString("en-US")} messages across ${stats.activeDays.toLocaleString("en-US")} active days.`,
    null,
    { totalMessages: stats.totalMessages, activeDays: stats.activeDays, daysTogether: stats.daysTogether },
  );

  if (stats.longestStreak > 1) {
    push(
      "LONGEST_STREAK",
      "A stretch when you kept coming back",
      `${stats.longestStreak} consecutive active days in the conversation.`,
      null,
      { longestStreak: stats.longestStreak },
    );
  }

  if (stats.longestSilenceDays > 0) {
    push(
      "LONGEST_SILENCE",
      "A quiet stretch",
      `The longest measured gap between active days was ${stats.longestSilenceDays} day${stats.longestSilenceDays === 1 ? "" : "s"}.`,
      null,
      { longestSilenceDays: stats.longestSilenceDays },
    );
  }

  if (stats.biggestDay.messages > 0) {
    push(
      "PEAK_DAY",
      "Your busiest day",
      `${formatDate(stats.biggestDay.timestamp)} had ${stats.biggestDay.messages.toLocaleString("en-US")} messages.`,
      stats.biggestDay.timestamp,
      { biggestDayMessages: stats.biggestDay.messages, biggestDayTimestamp: stats.biggestDay.timestamp },
    );
  }

  if (stats.lateNightMessages > 0) {
    push(
      "LATE_NIGHT_RHYTHM",
      "The late-night chapter",
      `${stats.lateNightMessages.toLocaleString("en-US")} messages landed during the conversation's late-night window.`,
      null,
      { lateNightMessages: stats.lateNightMessages, peakHour: stats.peakHour },
    );
  }

  const topWords = stats.topWords.slice(0, 3);
  if (topWords.length > 0) {
    push(
      "SHARED_LANGUAGE",
      "Words that kept showing up",
      `Frequently repeated words include ${topWords.map((item) => item.word).join(", ")}.`,
      null,
      Object.fromEntries(topWords.map((item, index) => [`word${index + 1}`, item.word])),
    );
  }

  if (stats.byYear.length > 1) {
    const firstYear = stats.byYear[0]?.year ?? new Date(stats.firstTimestamp).getFullYear();
    const lastYear = stats.byYear.at(-1)?.year ?? new Date(stats.lastTimestamp).getFullYear();
    push(
      "RELATIONSHIP_ERA",
      "A story that spans years",
      `This conversation has measurable activity from ${firstYear} through ${lastYear}.`,
      null,
      { firstYear, lastYear, yearsWithActivity: stats.byYear.length },
    );
  }

  return candidates;
}

export function decideMemoryCandidate(
  candidates: readonly MemoryCandidate[],
  candidateIdValue: string,
  status: Exclude<MemoryCandidateStatus, "PENDING">,
): MemoryCandidate[] {
  return candidates.map((candidate) =>
    candidate.id === candidateIdValue ? { ...candidate, status } : candidate,
  );
}

export function createEmptyMemoryGraph(memorySpaceId: string, now = new Date()): MemoryGraph {
  return { schemaVersion: 1, memorySpaceId, nodes: [], updatedAt: now.toISOString() };
}

export function approveCandidateIntoGraph(
  graph: MemoryGraph,
  candidate: MemoryCandidate,
  now = new Date(),
): MemoryGraph {
  if (candidate.memorySpaceId !== graph.memorySpaceId) {
    throw new Error("Memory candidate belongs to a different MemorySpace.");
  }
  if (candidate.status !== "APPROVED") {
    throw new Error("Memory candidate must be explicitly approved before it can enter the graph.");
  }
  if (graph.nodes.some((node) => node.sourceCandidateId === candidate.id)) return graph;

  const approvedAt = now.toISOString();
  const node: MemoryNode = {
    schemaVersion: 1,
    id: `${candidate.id}:node`,
    memorySpaceId: graph.memorySpaceId,
    kind: candidate.kind,
    title: candidate.title,
    summary: candidate.summary,
    occurredAt: candidate.occurredAt,
    sourceCandidateId: candidate.id,
    facts: { ...candidate.facts },
    approvedAt,
  };

  return { ...graph, nodes: [...graph.nodes, node], updatedAt: approvedAt };
}

export function memoryGraphStorageKey(memorySpaceId: string) {
  return `${MEMORY_GRAPH_STORAGE_PREFIX}${memorySpaceId}`;
}
