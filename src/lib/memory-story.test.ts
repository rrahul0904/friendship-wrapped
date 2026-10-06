import { describe, expect, it } from "vitest";
import { createDirectMemoryNode, createEmptyMemoryGraph, upsertMemoryNode } from "./memory-graph";
import { createMemorySpaceManifest } from "./memory-platform";
import { composeMemoryStory } from "./memory-story";

describe("Memory intent composer", () => {
  const manifest = createMemorySpaceManifest({
    id: "us-1",
    name: "Us",
    relationshipType: "PARTNER",
    productTemplate: "RELATIONSHIP",
    now: new Date("2026-01-01T00:00:00Z"),
  });

  function graphWithMemories() {
    let graph = createEmptyMemoryGraph(manifest.id, new Date("2026-01-01T00:00:00Z"));
    graph = upsertMemoryNode(graph, createDirectMemoryNode({
      id: "beginning",
      memorySpaceId: manifest.id,
      kind: "BEGINNING",
      title: "Where it started",
      summary: "The first chapter.",
      occurredAt: Date.parse("2020-01-01T12:00:00Z"),
      source: "LEGACY_PRODUCT",
    }, new Date("2026-01-01T00:00:00Z")));
    graph = upsertMemoryNode(graph, createDirectMemoryNode({
      id: "wedding",
      memorySpaceId: manifest.id,
      kind: "MILESTONE",
      title: "Our wedding",
      summary: "A day we chose to keep.",
      occurredAt: Date.parse("2024-06-15T12:00:00Z"),
      source: "MANUAL",
    }, new Date("2026-01-01T00:00:00Z")));
    return graph;
  }

  it("composes anniversary from approved graph nodes without inventing memories", () => {
    const graph = graphWithMemories();
    const story = composeMemoryStory({
      graph,
      manifest,
      intent: "ANNIVERSARY",
      now: new Date("2026-10-06T12:00:00Z"),
    });
    expect(story.title).toBe("Another chapter of us");
    expect(story.beats.map((beat) => beat.title)).toContain("Our wedding");
    expect(story.beats.filter((beat) => beat.role === "MEMORY")).toHaveLength(graph.nodes.length);
    expect(story.generatedAt).toBe("2026-10-06T12:00:00.000Z");
  });

  it("keeps apology authorship with the user", () => {
    const story = composeMemoryStory({ graph: graphWithMemories(), manifest, intent: "APOLOGY" });
    expect(story.beats.at(-1)?.body).toContain("should be yours");

    const withDedication = composeMemoryStory({
      graph: graphWithMemories(),
      manifest,
      intent: "APOLOGY",
      dedication: "I am sorry for what I did.",
    });
    expect(withDedication.beats.at(-1)?.body).toBe("I am sorry for what I did.");
  });

  it("rejects graph/space cross-writes", () => {
    expect(() => composeMemoryStory({
      graph: createEmptyMemoryGraph("someone-else"),
      manifest,
      intent: "MEMORY_LANE",
    })).toThrow("do not match");
  });
});
