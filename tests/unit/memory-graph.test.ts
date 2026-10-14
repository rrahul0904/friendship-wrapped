import { describe, expect, it } from "vitest";
import { analyzeChat } from "../../src/lib/analyze";
import {
  approveCandidateIntoGraph,
  buildConversationMemoryCandidates,
  createEmptyMemoryGraph,
  decideMemoryCandidate,
  isMemoryGraph,
  readStoredMemoryGraph,
  replaceLegacyMemoryNodes,
  legacyProductMemorySpaceId,
  legacyWorldEventToMemoryNode,
  createDirectMemoryNode,
} from "../../src/lib/memory-graph";
import type { ChatMessage } from "../../src/lib/types";

function at(day: number, hour: number, minute: number) {
  return new Date(2026, 0, day, hour, minute).getTime();
}

const messages: ChatMessage[] = [
  { sender: "Alice", timestamp: at(1, 0, 30), text: "hello there? ❤️" },
  { sender: "Bob", timestamp: at(1, 0, 40), text: "haha 😂" },
  { sender: "Alice", timestamp: at(2, 10, 0), text: "coffee plan" },
  { sender: "Bob", timestamp: at(2, 10, 20), text: "<Media omitted>" },
  { sender: "Alice", timestamp: at(4, 18, 0), text: "coffee coffee" },
];

describe("memory graph approval boundary", () => {
  it("turns derived chat stats into pending local memory candidates", () => {
    const candidates = buildConversationMemoryCandidates("space-1", analyzeChat(messages));

    expect(candidates.length).toBeGreaterThanOrEqual(6);
    expect(candidates.every((candidate) => candidate.status === "PENDING")).toBe(true);
    expect(candidates.every((candidate) => candidate.source === "CONVERSATION_DERIVED")).toBe(true);
    expect(candidates.find((candidate) => candidate.kind === "BEGINNING")?.occurredAt).toBe(messages[0].timestamp);
    expect(candidates.find((candidate) => candidate.kind === "SHARED_LANGUAGE")?.summary).toContain("coffee");
  });

  it("assigns a distinct candidate identity to each conversation import", () => {
    const stats = analyzeChat(messages);
    const firstImport = buildConversationMemoryCandidates("space-1", stats, "import-a");
    const secondImport = buildConversationMemoryCandidates("space-1", stats, "import-b");

    expect(firstImport.map((candidate) => candidate.id)).not.toEqual(secondImport.map((candidate) => candidate.id));
    expect(new Set(secondImport.map((candidate) => candidate.id)).size).toBe(secondImport.length);
  });

  it("replaces legacy timeline nodes without dropping approved memories from other sources", () => {
    const memorySpaceId = legacyProductMemorySpaceId("relationship");
    const graph = createEmptyMemoryGraph(memorySpaceId);
    const userMemory = createDirectMemoryNode({
      id: "manual-memory-1",
      memorySpaceId,
      kind: "MANUAL_MEMORY",
      title: "A separately approved memory",
      source: "MANUAL",
    });
    const oldLegacy = legacyWorldEventToMemoryNode({
      memorySpaceId,
      productTemplate: "RELATIONSHIP",
      event: { id: "old-event", date: "2026-01-01", title: "Old event", kind: "Milestone" },
    });
    const replacement = legacyWorldEventToMemoryNode({
      memorySpaceId,
      productTemplate: "RELATIONSHIP",
      event: { id: "new-event", date: "2026-02-01", title: "New event", kind: "Milestone" },
    });
    const next = replaceLegacyMemoryNodes({ ...graph, nodes: [userMemory, oldLegacy] }, `${memorySpaceId}:legacy:`, [replacement]);

    expect(next.nodes.map((node) => node.id)).toEqual([userMemory.id, replacement.id]);
  });

  it("refuses to persist a candidate that the user did not approve", () => {
    const candidate = buildConversationMemoryCandidates("space-1", analyzeChat(messages))[0];
    const graph = createEmptyMemoryGraph("space-1", new Date("2026-10-06T00:00:00Z"));

    expect(() => approveCandidateIntoGraph(graph, candidate)).toThrow("explicitly approved");
  });

  it("adds an approved candidate exactly once", () => {
    const pending = buildConversationMemoryCandidates("space-1", analyzeChat(messages));
    const candidateId = pending[0].id;
    const approved = decideMemoryCandidate(pending, candidateId, "APPROVED")[0];
    const graph = createEmptyMemoryGraph("space-1", new Date("2026-10-06T00:00:00Z"));
    const once = approveCandidateIntoGraph(graph, approved, new Date("2026-10-06T01:00:00Z"));
    const twice = approveCandidateIntoGraph(once, approved, new Date("2026-10-06T02:00:00Z"));

    expect(once.nodes).toHaveLength(1);
    expect(once.nodes[0].sourceCandidateId).toBe(candidateId);
    expect(twice.nodes).toHaveLength(1);
  });

  it("rejects cross-MemorySpace approval", () => {
    const pending = buildConversationMemoryCandidates("space-1", analyzeChat(messages));
    const approved = decideMemoryCandidate(pending, pending[0].id, "APPROVED")[0];
    const otherGraph = createEmptyMemoryGraph("space-2");

    expect(() => approveCandidateIntoGraph(otherGraph, approved)).toThrow("different MemorySpace");
  });

  it("validates stored graph nodes, facts, timestamps, and space ownership", () => {
    const candidates = buildConversationMemoryCandidates("space-1", analyzeChat(messages));
    const approved = decideMemoryCandidate(candidates, candidates[0].id, "APPROVED")[0];
    const graph = approveCandidateIntoGraph(createEmptyMemoryGraph("space-1"), approved);

    expect(isMemoryGraph(graph, "space-1")).toBe(true);
    expect(isMemoryGraph(graph, "space-2")).toBe(false);
    expect(isMemoryGraph({ ...graph, nodes: [{ ...graph.nodes[0], kind: "UNSUPPORTED" }] }, "space-1")).toBe(false);
    expect(isMemoryGraph({ ...graph, nodes: [{ ...graph.nodes[0], facts: { unsafe: {} } }] }, "space-1")).toBe(false);
    expect(isMemoryGraph({ ...graph, updatedAt: "not-a-date" }, "space-1")).toBe(false);
  });

  it("preserves malformed stored graph bytes for user-directed recovery", () => {
    const raw = JSON.stringify({ schemaVersion: 1, memorySpaceId: "space-1", nodes: [{ kind: "BROKEN" }] });
    const result = readStoredMemoryGraph(raw, "space-1");

    expect(result.graph).toBeNull();
    expect(result.recoveryData).toBe(raw);
    expect(readStoredMemoryGraph(null, "space-1").graph?.nodes).toEqual([]);
  });
});
