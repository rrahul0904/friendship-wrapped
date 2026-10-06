import type { MemoryGraph, MemoryNode } from "./memory-graph";
import type { MemoryIntentKind } from "./memory-space";
import type { MemorySpaceManifest } from "./memory-platform";

export interface MemoryStoryBeat {
  id: string;
  title: string;
  body: string;
  nodeId?: string;
  occurredAt?: number | null;
  role: "OPENING" | "MEMORY" | "CLOSING";
}

export interface MemoryStory {
  schemaVersion: 1;
  id: string;
  memorySpaceId: string;
  intent: MemoryIntentKind;
  title: string;
  subtitle: string;
  beats: MemoryStoryBeat[];
  generatedAt: string;
}

const INTENT_TITLES: Record<MemoryIntentKind, string> = {
  MEMORY_LANE: "Memory Lane",
  VALENTINE_GIFT: "A Valentine made from your memories",
  PROM_INVITATION: "A story that ends with one question",
  DATE_INVITATION: "A more personal invitation",
  APOLOGY: "The memories that still matter",
  I_LOVE_YOU: "The little things that say I love you",
  ANNIVERSARY: "Another chapter of us",
  PROUD_OF_YOU: "Look how far you came",
  GROUP_MEMORY: "The story of this crew",
};

function chronological(nodes: readonly MemoryNode[]) {
  return [...nodes].sort((a, b) => {
    const aTime = a.occurredAt ?? Date.parse(a.approvedAt);
    const bTime = b.occurredAt ?? Date.parse(b.approvedAt);
    return aTime - bTime || a.title.localeCompare(b.title);
  });
}

function uniqueNodes(nodes: readonly MemoryNode[]) {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    const key = `${node.kind}:${node.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function prioritize(nodes: readonly MemoryNode[], intent: MemoryIntentKind) {
  const ordered = chronological(nodes);
  const preferredKinds: Partial<Record<MemoryIntentKind, string[]>> = {
    ANNIVERSARY: ["BEGINNING", "MILESTONE", "RELATIONSHIP_ERA", "PLACE", "SHARED_LANGUAGE", "PHOTO_VIDEO", "MANUAL_MEMORY"],
    VALENTINE_GIFT: ["BEGINNING", "SHARED_LANGUAGE", "MILESTONE", "SONG", "PHOTO_VIDEO", "MANUAL_MEMORY"],
    I_LOVE_YOU: ["SHARED_LANGUAGE", "MILESTONE", "PHOTO_VIDEO", "MANUAL_MEMORY", "BEGINNING"],
    APOLOGY: ["BEGINNING", "MILESTONE", "PHOTO_VIDEO", "MANUAL_MEMORY", "PLACE"],
    PROUD_OF_YOU: ["MILESTONE", "PHOTO_VIDEO", "MANUAL_MEMORY", "PLACE", "BEGINNING"],
    GROUP_MEMORY: ["PERSON", "PLACE", "PEAK_DAY", "SHARED_LANGUAGE", "PHOTO_VIDEO", "MANUAL_MEMORY"],
    PROM_INVITATION: ["PHOTO_VIDEO", "MANUAL_MEMORY", "SHARED_LANGUAGE", "BEGINNING"],
    DATE_INVITATION: ["PHOTO_VIDEO", "PLACE", "MANUAL_MEMORY", "SHARED_LANGUAGE"],
  };
  const kinds = preferredKinds[intent] ?? [];
  if (!kinds.length) return ordered;
  const rank = new Map(kinds.map((kind, index) => [kind, index]));
  return [...ordered].sort((a, b) => {
    const aRank = rank.get(a.kind) ?? 999;
    const bRank = rank.get(b.kind) ?? 999;
    if (aRank !== bRank) return aRank - bRank;
    const aTime = a.occurredAt ?? Date.parse(a.approvedAt);
    const bTime = b.occurredAt ?? Date.parse(b.approvedAt);
    return aTime - bTime;
  });
}

function maxMemoryBeats(intent: MemoryIntentKind) {
  if (intent === "PROM_INVITATION" || intent === "DATE_INVITATION") return 4;
  if (intent === "APOLOGY") return 5;
  return 8;
}

function openingCopy(manifest: MemorySpaceManifest, intent: MemoryIntentKind) {
  if (intent === "PROUD_OF_YOU") return `A few moments from ${manifest.name}'s story worth holding onto.`;
  if (intent === "GROUP_MEMORY") return `The places, people, and moments that made ${manifest.name} what it is.`;
  if (intent === "APOLOGY") return `Before the hard words, remember what has mattered in ${manifest.name}.`;
  return `A story composed from memories you chose to keep in ${manifest.name}.`;
}

function closingCopy(intent: MemoryIntentKind, dedication?: string) {
  if (dedication?.trim()) return dedication.trim();
  if (intent === "APOLOGY") return "The apology itself should be yours. ThreadTales will not pretend to feel it for you.";
  if (intent === "PROM_INVITATION") return "Now ask the question in your own words.";
  if (intent === "DATE_INVITATION") return "Now make the invitation yours.";
  if (intent === "PROUD_OF_YOU") return "Some chapters deserve to be remembered while the next one is still beginning.";
  if (intent === "ANNIVERSARY") return "Still becoming a story worth keeping.";
  return "Keep this chapter. Add the next one when it happens.";
}

export function composeMemoryStory({
  graph,
  manifest,
  intent,
  dedication,
  now = new Date(),
}: {
  graph: MemoryGraph;
  manifest: MemorySpaceManifest;
  intent: MemoryIntentKind;
  dedication?: string;
  now?: Date;
}): MemoryStory {
  if (graph.memorySpaceId !== manifest.id) throw new Error("Memory Graph and MemorySpace do not match.");
  const selected = uniqueNodes(prioritize(graph.nodes, intent)).slice(0, maxMemoryBeats(intent));
  const generatedAt = now.toISOString();
  const memoryBeats: MemoryStoryBeat[] = selected.map((node, index) => ({
    id: `memory-${index + 1}-${node.id}`,
    title: node.title,
    body: node.summary,
    nodeId: node.id,
    occurredAt: node.occurredAt,
    role: "MEMORY",
  }));

  return {
    schemaVersion: 1,
    id: `${manifest.id}:${intent.toLowerCase()}:${generatedAt}`,
    memorySpaceId: manifest.id,
    intent,
    title: INTENT_TITLES[intent],
    subtitle: manifest.name,
    generatedAt,
    beats: [
      { id: "opening", title: manifest.name, body: openingCopy(manifest, intent), role: "OPENING" },
      ...memoryBeats,
      { id: "closing", title: "For what comes next", body: closingCopy(intent, dedication), role: "CLOSING" },
    ],
  };
}

export function storyIntentTitle(intent: MemoryIntentKind) {
  return INTENT_TITLES[intent];
}
