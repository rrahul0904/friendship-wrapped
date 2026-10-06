import { describe, expect, it } from "vitest";
import type { MemoryGraph, MemoryNode } from "./memory-graph";
import { composeMemoryStory, storyPlanStorageKey } from "./memory-story";

function node(kind: MemoryNode["kind"], title: string, id = kind): MemoryNode {
  return {
    schemaVersion: 1,
    id,
    memorySpaceId: "space-1",
    source: "CONVERSATION",
    kind,
    title,
    detail: `${title} detail`,
    containsPrivateText: kind === "SHARED_LANGUAGE",
    approvedAt: "2026-10-06T00:00:00.000Z",
    provenance: { type: kind === "SHARED_LANGUAGE" ? "LOCAL_TEXT" : "DERIVED_STAT", key: id },
  };
}

const graph: MemoryGraph = {
  schemaVersion: 1,
  memorySpaceId: "space-1",
  updatedAt: "2026-10-06T00:00:00.000Z",
  nodes: [
    node("LAUGH_SIGNAL", "We laughed a lot"),
    node("BEGINNING", "Where it started"),
    node("SHARED_LANGUAGE", "Our phrase"),
    node("BIG_DAY", "The big day"),
    node("LONGEST_STREAK", "Our streak"),
    node("BUSIEST_YEAR", "A big year"),
    node("HEART_SIGNAL", "Hearts everywhere"),
  ],
};

describe("intent-specific Memory Story composer", () => {
  it("uses only approved graph nodes as memory beats", () => {
    const plan = composeMemoryStory(graph, "ANNIVERSARY", new Date("2026-10-06T00:00:00Z"));
    const memoryBeats = plan.beats.filter((beat) => beat.source === "MEMORY_NODE");

    expect(memoryBeats.length).toBeGreaterThan(0);
    expect(memoryBeats.every((beat) => graph.nodes.some((item) => item.id === beat.memoryNodeId))).toBe(true);
    expect(plan.generatedAt).toBe("2026-10-06T00:00:00.000Z");
  });

  it("orders anniversary history differently from a prom invitation", () => {
    const anniversary = composeMemoryStory(graph, "ANNIVERSARY");
    const prom = composeMemoryStory(graph, "PROM_INVITATION");

    expect(anniversary.beats.filter((beat) => beat.source === "MEMORY_NODE").map((beat) => beat.memoryNodeId)).toEqual([
      "BEGINNING",
      "BUSIEST_YEAR",
      "LONGEST_STREAK",
      "BIG_DAY",
      "SHARED_LANGUAGE",
      "LAUGH_SIGNAL",
      "HEART_SIGNAL",
    ]);
    expect(prom.beats.filter((beat) => beat.source === "MEMORY_NODE").map((beat) => beat.memoryNodeId)).toEqual([
      "BEGINNING",
      "LAUGH_SIGNAL",
      "SHARED_LANGUAGE",
    ]);
    expect(prom.beats.at(-1)).toMatchObject({ kind: "QUESTION", body: "Will you go to prom with me?" });
  });

  it("requires the user to author an apology instead of generating one", () => {
    const apology = composeMemoryStory(graph, "APOLOGY");
    const dedication = apology.beats.find((beat) => beat.kind === "DEDICATION");

    expect(apology.requiresUserDedication).toBe(true);
    expect(dedication?.source).toBe("USER_REQUIRED");
    expect(dedication?.title).toMatch(/Write the apology/i);
    expect(apology.beats.some((beat) => /forgive me|you should forgive/i.test(`${beat.title} ${beat.body ?? ""}`))).toBe(false);
  });

  it("requires personal words for proud-of-you and love stories", () => {
    expect(composeMemoryStory(graph, "PROUD_OF_YOU").requiresUserDedication).toBe(true);
    expect(composeMemoryStory(graph, "I_LOVE_YOU").requiresUserDedication).toBe(true);
  });

  it("degrades gracefully when the graph contains only one approved memory", () => {
    const sparse = { ...graph, nodes: [node("BEGINNING", "Only memory")] };
    const plan = composeMemoryStory(sparse, "MEMORY_LANE");

    expect(plan.beats.some((beat) => beat.memoryNodeId === "BEGINNING")).toBe(true);
    expect(plan.beats[0].kind).toBe("OPENING");
    expect(plan.beats.at(-1)?.kind).toBe("CLOSING");
  });

  it("scopes stored plans by MemorySpace and intent", () => {
    expect(storyPlanStorageKey("abc", "ANNIVERSARY")).toBe("threadtales:memory-story-plan:v1:abc:ANNIVERSARY");
  });
});
