import { describe, expect, it } from "vitest";
import { analyzeChat } from "../../src/lib/analyze";
import {
  approveCandidateIntoGraph,
  buildConversationMemoryCandidates,
  createEmptyMemoryGraph,
  decideMemoryCandidate,
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
});
